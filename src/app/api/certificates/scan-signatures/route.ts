import { NextResponse } from "next/server";
import { queryAll, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ensureCertificatesTable } from "@/lib/schema";
import { processCertificateById, SignatureStatus } from "@/lib/certificateSignature";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ScanResult {
  id: number;
  status: SignatureStatus;
  regions: number;
  error?: string;
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    await ensureCertificatesTable();
    const body = await req.json().catch(() => ({}));
    const force = !!body.force;
    const ids: number[] | undefined = Array.isArray(body.ids) && body.ids.length
      ? body.ids.map(Number).filter((n: number) => Number.isFinite(n))
      : undefined;

    let rows: { id: number }[];
    if (ids) {
      rows = [];
      for (const id of ids) {
        const row = await queryOne("SELECT id FROM certificates WHERE id = $1", [id]);
        if (row) rows.push(row as { id: number });
      }
    } else {
      rows = await queryAll("SELECT id FROM certificates ORDER BY id ASC") as { id: number }[];
    }

    const results: ScanResult[] = [];
    const CONCURRENCY = 3;
    let index = 0;

    async function worker() {
      while (index < rows.length) {
        const row = rows[index++];
        try {
          const outcome = await processCertificateById(row.id, { force });
          results.push({
            id: row.id,
            status: outcome.status,
            regions: (outcome.regions || []).length,
            ...(outcome.error ? { error: outcome.error } : {}),
          });
        } catch (err) {
          results.push({
            id: row.id,
            status: "error",
            regions: 0,
            error: err instanceof Error ? err.message : "Failed",
          });
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, rows.length) }, worker));
    results.sort((a, b) => a.id - b.id);

    const counts: Record<string, number> = {};
    for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;

    return NextResponse.json({
      total: rows.length,
      counts,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
