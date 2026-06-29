import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const db = getDb();
  let config = db.prepare("SELECT * FROM email_config WHERE id = 1").get();
  if (!config) {
    db.prepare(`
      INSERT OR IGNORE INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_password, sender_email, sender_name, provider)
      VALUES (1, 'smtp.gmail.com', 587, '', '', '', '', 'smtp')
    `).run();
    config = db.prepare("SELECT * FROM email_config WHERE id = 1").get();
  }
  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { smtp_host, smtp_port, smtp_user, smtp_password, sender_email, sender_name, provider } = await req.json();

    const db = getDb();
    db.prepare(`
      UPDATE email_config
      SET smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_password = ?, sender_email = ?, sender_name = ?, provider = ?, updated_at = datetime('now')
      WHERE id = 1
    `).run(
      smtp_host || "",
      Number(smtp_port) || 587,
      smtp_user || "",
      smtp_password || "",
      sender_email || "",
      sender_name || "",
      provider || "smtp"
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
