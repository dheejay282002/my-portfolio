import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { ensureProductsTable } = await import("@/lib/schema");
    await ensureProductsTable();

    let requests;
    if (user.role === "admin") {
      requests = await queryAll(
        `SELECT r.*, u.name as client_name, u.email as client_email, 
                p.package_tier, p.project_baseline, p.est_timeline, p.deliverables
         FROM project_requests r 
         JOIN users u ON r.client_id = u.id
         LEFT JOIN products p ON r.product_id = p.id
         ORDER BY r.created_at DESC`
      );
    } else {
      requests = await queryAll(
        `SELECT r.*, rev.rating, rev.content as review_content, 
                p.package_tier, p.project_baseline, p.est_timeline, p.deliverables
         FROM project_requests r
         LEFT JOIN reviews rev ON r.id = rev.project_request_id
         LEFT JOIN products p ON r.product_id = p.id
         WHERE r.client_id = $1
         ORDER BY r.created_at DESC`,
        [user.id]
      );
    }

    return NextResponse.json({ requests });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { project_name, description, tech_stack, conversation_id, product_id, payment_receipt_url, payment_reference_no } = await req.json();
    if (!project_name || !description) {
      return NextResponse.json({ error: "Project name and description are required" }, { status: 400 });
    }

    if (!payment_receipt_url || !payment_reference_no) {
      return NextResponse.json({ error: "Downpayment receipt screenshot and transaction reference number are required" }, { status: 400 });
    }

    // --- FAKE RECEIPT DETECTOR SCAN RULES ---
    const invalidKeywords = ["fake", "dummy", "test", "mock", "sample", "fabricated", "screenshot_123", "placeholder"];
    const fileLower = payment_receipt_url.toLowerCase();
    const refLower = payment_reference_no.toLowerCase();

    const containsFakeKeyword = invalidKeywords.some(
      (kw) => fileLower.includes(kw) || refLower.includes(kw)
    );

    const refClean = payment_reference_no.trim();
    const isValidRefFormat = /^[a-zA-Z0-9-]{8,24}$/.test(refClean);

    if (containsFakeKeyword || !isValidRefFormat) {
      return NextResponse.json(
        { error: "Fake Receipt Detected: Our automated payment scanner flagged this receipt or transaction reference as invalid. Please verify and upload your actual banking receipt." },
        { status: 400 }
      );
    }
    // ----------------------------------------

    const result = await queryOne(
      `INSERT INTO project_requests 
       (client_id, project_name, description, tech_stack, conversation_id, product_id, payment_receipt_url, payment_reference_no, receipt_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) 
       RETURNING id`,
      [user.id, project_name, description, tech_stack || "", conversation_id || null, product_id || null, payment_receipt_url, refClean]
    ) as { id: number };

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
