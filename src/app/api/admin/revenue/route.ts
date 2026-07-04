import { NextResponse } from "next/server";
import { queryAll, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

function extractAmount(baseline: string): number {
  if (!baseline) return 0;
  const matches = baseline.match(/\$?([\d,]+)/g);
  if (!matches) return 0;
  const nums = matches.map((m) => parseFloat(m.replace(/,/g, ""))).filter((n) => !isNaN(n));
  if (nums.length === 0) return 0;
  return Math.max(...nums);
}

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_signature_url TEXT");

    const all = await queryAll(
      "SELECT status, project_baseline FROM project_requests WHERE status IN ('completed', 'delivered')"
    ) as { status: string; project_baseline: string }[];

    let totalRevenue = 0;
    let deliveredRevenue = 0;
    let completedRevenue = 0;
    let deliveredCount = 0;
    let completedCount = 0;

    for (const r of all) {
      const amount = extractAmount(r.project_baseline);
      if (r.status === "delivered") {
        deliveredRevenue += amount;
        deliveredCount++;
      } else {
        completedRevenue += amount;
        completedCount++;
      }
      totalRevenue += amount;
    }

    return NextResponse.json({
      totalRevenue,
      deliveredRevenue,
      completedRevenue,
      deliveredCount,
      completedCount,
      totalCompletedDelivered: deliveredCount + completedCount,
    });
  } catch (err) {
    console.error("[REVENUE ERROR]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
