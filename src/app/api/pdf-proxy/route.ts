import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getSignedCloudinaryUrl(sourceUrl: string) {
  const url = new URL(sourceUrl);
  if (!url.hostname.endsWith("cloudinary.com")) return null;

  const pathParts = url.pathname.split("/").filter(Boolean);
  const deliveryIndex = pathParts.findIndex((part) => ["image", "raw", "video"].includes(part));
  if (deliveryIndex < 0 || pathParts[deliveryIndex + 1] !== "upload") return null;

  const publicIdParts = pathParts.slice(deliveryIndex + 2);
  if (publicIdParts[0]?.match(/^v\d+$/)) publicIdParts.shift();
  const publicIdWithFormat = publicIdParts.join("/");
  const extensionIndex = publicIdWithFormat.lastIndexOf(".");
  const format = extensionIndex >= 0 ? publicIdWithFormat.slice(extensionIndex + 1) : "";
  const publicId = extensionIndex >= 0 ? publicIdWithFormat.slice(0, extensionIndex) : publicIdWithFormat;
  if (!publicId) return null;

  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: pathParts[deliveryIndex] as "image" | "raw" | "video",
    type: "upload",
    attachment: false,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const download = searchParams.get("download") === "1";
  const fileName = (searchParams.get("name") || "resume.pdf").replace(/["\\]/g, "");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    let res = await fetch(url, { redirect: "follow" });
    if (res.status === 401) {
      const signedUrl = getSignedCloudinaryUrl(url);
      if (signedUrl) res = await fetch(signedUrl, { redirect: "follow" });
    }
    if (!res.ok) {
      return NextResponse.json({ error: `Upstream returned ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "application/pdf";
    const arrayBuf = await res.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuf);

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": contentType.includes("pdf") ? "application/pdf" : contentType,
        "Content-Disposition": download
          ? `attachment; filename="${fileName}"`
          : "inline; filename=\"resume.pdf\"",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Accept-Ranges": "bytes",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : "Failed to proxy PDF") }, { status: 500 });
  }
}
