import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureCertificatesTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

function generateUrl(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 12; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
}

export async function GET() {
  try {
    await ensureCertificatesTable();
    const certificates = await queryAll("SELECT * FROM certificates ORDER BY issued_date DESC");
    return NextResponse.json({ certificates }, {
      headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureCertificatesTable();
    const { recipient_name, course_title, description, issued_date, issuer_name, issuer_title, badge_image_url } = await req.json();
    if (!recipient_name || !course_title)
      return NextResponse.json({ error: "Recipient name and course title are required" }, { status: 400 });

    let certificate_url = generateUrl();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await queryOne("SELECT id FROM certificates WHERE certificate_url = $1", [certificate_url]);
      if (!existing) break;
      certificate_url = generateUrl();
      attempts++;
    }

    const result = await queryOne(
      `INSERT INTO certificates (recipient_name, course_title, description, issued_date, issuer_name, issuer_title, badge_image_url, certificate_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [recipient_name, course_title, description || "", issued_date || new Date().toISOString().split("T")[0], issuer_name || "", issuer_title || "", badge_image_url || "", certificate_url]
    ) as { id: number };

    return NextResponse.json({ id: result.id, certificate_url }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
