import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureProductsTable } from "@/lib/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureProductsTable();
    // Return products sorted by creation time
    const products = await queryAll("SELECT * FROM products ORDER BY created_at ASC");
    
    // Get counts of selections in project requests for popular logic
    const requestCounts = await queryAll(
      "SELECT product_id, COUNT(*) as count FROM project_requests WHERE product_id IS NOT NULL GROUP BY product_id"
    );
    
    return NextResponse.json({ products, requestCounts }, {
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
    await ensureProductsTable();
    const { package_tier, project_baseline, est_timeline, deliverables } = await req.json();
    if (!package_tier || !project_baseline || !est_timeline || !deliverables)
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

    const result = await queryOne(
      "INSERT INTO products (package_tier, project_baseline, est_timeline, deliverables) VALUES ($1, $2, $3, $4) RETURNING id",
      [package_tier, project_baseline, est_timeline, deliverables]
    ) as { id: number };

    return NextResponse.json({ id: result.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
