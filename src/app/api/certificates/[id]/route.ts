import { NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureCertificatesTable } from "@/lib/schema";
import { processCertificateById, redactSignatureFields } from "@/lib/certificateSignature";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureCertificatesTable();
    const { id } = await params;
    const cert = await queryOne("SELECT * FROM certificates WHERE id = $1", [Number(id)]);
    if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const user = await getSession();
    return NextResponse.json({ certificate: redactSignatureFields(cert, user?.role === "admin") });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureCertificatesTable();
    const { id } = await params;
    const body = await req.json();
    const allowed = ["recipient_name", "course_title", "description", "issued_date", "issuer_name", "issuer_title", "badge_image_url", "certificate_image_url", "certificate_url", "is_public", "credly_badge_id", "credly_host", "verify_url", "category"];
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const current = await queryOne(
      "SELECT certificate_image_url, signature_status FROM certificates WHERE id = $1",
      [Number(id)]
    ) as { certificate_image_url: string | null; signature_status: string | null } | null;

    const incomingUrl = typeof body.certificate_image_url === "string" ? body.certificate_image_url : "";
    const storedUrl = current?.certificate_image_url || "";
    const imageChanged = !!incomingUrl && incomingUrl !== storedUrl;
    const stillPending = (current?.signature_status || "pending") === "pending" && !!incomingUrl;

    values.push(Number(id));
    await execute(`UPDATE certificates SET ${fields.join(", ")} WHERE id = $${idx}`, values);

    let signatureStatus: string | undefined;
    if (imageChanged || stillPending) {
      try {
        const outcome = await processCertificateById(Number(id), { urlChanged: imageChanged });
        signatureStatus = outcome.status;
      } catch (e) {
        console.error("[CERT SIGNATURE] update processing failed:", e);
      }
    }

    return NextResponse.json({ success: true, ...(signatureStatus ? { signature_status: signatureStatus } : {}) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureCertificatesTable();
    const { id } = await params;
    await execute("DELETE FROM certificates WHERE id = $1", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
