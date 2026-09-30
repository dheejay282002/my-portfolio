import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const download = searchParams.get("download") === "1";
  const fileName = (searchParams.get("name") || "resume.pdf").replace(/["\\]/g, "");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { redirect: "follow" });
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
