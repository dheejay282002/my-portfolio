import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { ensureCertificatesTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureCertificatesTable();
    const certificates = await queryAll(
      "SELECT id, recipient_name, course_title, description, issued_date, issuer_name, issuer_title, badge_image_url, certificate_url, credly_badge_id, credly_host FROM certificates WHERE is_public = TRUE ORDER BY issued_date DESC"
    );
    return NextResponse.json({ certificates }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
