import { v2 as cloudinary } from "cloudinary";
import { execute, queryOne } from "@/lib/db";
import { processCertificateBuffer, SignatureRegion } from "@/lib/signatureBlur";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type SignatureStatus = "pending" | "blurred" | "no-signature" | "skipped-pdf" | "skipped-no-image" | "error";

export interface SignatureOutcome {
  id?: number;
  status: SignatureStatus;
  regions: SignatureRegion[];
  originalUrl: string;
  blurredUrl?: string;
  error?: string;
}

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

function uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", quality: "auto:best" },
      (error, result) => {
        if (error || !result) return reject(error || new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export async function processCertificateImage(url: string): Promise<Omit<SignatureOutcome, "id">> {
  const originalUrl = url || "";
  if (!originalUrl) return { status: "skipped-no-image", regions: [], originalUrl };

  if (/\.pdf($|\?)/i.test(originalUrl)) return { status: "skipped-pdf", regions: [], originalUrl };

  try {
    const res = await fetch(originalUrl, { redirect: "follow" });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/pdf"))
      return { status: "skipped-pdf", regions: [], originalUrl };

    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > MAX_IMAGE_BYTES)
      return { status: "error", regions: [], originalUrl, error: "Image too large" };
    if (contentType && !contentType.startsWith("image/") && !contentType.includes("octet-stream"))
      return { status: "skipped-pdf", regions: [], originalUrl };

    const result = await processCertificateBuffer(bytes);
    if (!result.hadSignature) return { status: "no-signature", regions: [], originalUrl };

    const blurredUrl = await uploadBuffer(result.image, "portfolio-certificates");
    return { status: "blurred", regions: result.regions, originalUrl, blurredUrl };
  } catch (err) {
    return {
      status: "error",
      regions: [],
      originalUrl,
      error: err instanceof Error ? err.message : "Signature processing failed",
    };
  }
}

interface CertRow {
  id: number;
  certificate_image_url: string;
  certificate_image_original_url: string | null;
  signature_status: string | null;
  signature_regions: string | null;
}

export async function processCertificateById(
  id: number,
  opts: { force?: boolean; urlChanged?: boolean } = {}
): Promise<SignatureOutcome> {
  const row = await queryOne(
    `SELECT id, certificate_image_url, certificate_image_original_url, signature_status, signature_regions
     FROM certificates WHERE id = $1`,
    [id]
  ) as CertRow | null;

  if (!row) return { id, status: "error", regions: [], originalUrl: "", error: "Certificate not found" };

  const currentUrl = row.certificate_image_url || "";
  const status = (row.signature_status || "pending") as SignatureStatus;
  const alreadyProcessed = status !== "pending";

  if (alreadyProcessed && status !== "error" && !opts.force && !opts.urlChanged) {
    return { id, status, regions: [], originalUrl: row.certificate_image_original_url || currentUrl };
  }

  // A newly uploaded image is scanned as-is; otherwise scan the preserved
  // original so re-runs never read our own blurred output.
  const inputUrl = opts.urlChanged ? currentUrl : row.certificate_image_original_url || currentUrl;
  const outcome = await processCertificateImage(inputUrl);

  const wasBlurred = status === "blurred";
  let finalStatus = outcome.status;
  let finalRegions = outcome.regions;

  // Never un-blur: if the certificate was already blurred and a re-run finds
  // nothing (or fails), keep the existing blur, status and regions.
  if (wasBlurred && finalStatus !== "blurred") {
    finalStatus = "blurred";
    finalRegions = parseRegions(row.signature_regions);
  }

  const finalImage = outcome.blurredUrl || currentUrl;

  await execute(
    `UPDATE certificates
     SET signature_status = $1,
         signature_regions = $2,
         certificate_image_original_url = $3,
         certificate_image_url = $4,
         signature_blurred_at = CASE WHEN $5 = 'blurred' THEN NOW() ELSE signature_blurred_at END
     WHERE id = $6`,
    [finalStatus, JSON.stringify(finalRegions), inputUrl, finalImage, finalStatus, id]
  );

  return {
    id,
    status: finalStatus,
    regions: finalRegions,
    originalUrl: inputUrl,
    ...(outcome.blurredUrl ? { blurredUrl: outcome.blurredUrl } : {}),
    ...(outcome.error ? { error: outcome.error } : {}),
  };
}

function parseRegions(raw: string | null): SignatureRegion[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function redactSignatureFields<T extends object>(row: T, includeOriginal: boolean): T {
  if (includeOriginal) return row;
  const copy = { ...row } as Record<string, unknown>;
  delete copy.certificate_image_original_url;
  return copy as T;
}
