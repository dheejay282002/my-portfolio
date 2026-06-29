import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  let config = await queryOne("SELECT * FROM email_config WHERE id = 1");
  if (!config) {
    await execute(`
      INSERT INTO email_config (id, smtp_host, smtp_port, smtp_user, smtp_password, sender_email, sender_name, provider)
      VALUES (1, 'smtp.gmail.com', 587, '', '', '', '', 'smtp')
      ON CONFLICT (id) DO NOTHING
    `);
    config = await queryOne("SELECT * FROM email_config WHERE id = 1");
  }
  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const { smtp_host, smtp_port, smtp_user, smtp_password, sender_email, sender_name, provider } = await req.json();

    await execute(`
      UPDATE email_config
      SET smtp_host = $1, smtp_port = $2, smtp_user = $3, smtp_password = $4, sender_email = $5, sender_name = $6, provider = $7, updated_at = NOW()
      WHERE id = 1
    `, [
      smtp_host || "",
      Number(smtp_port) || 587,
      smtp_user || "",
      smtp_password || "",
      sender_email || "",
      sender_name || "",
      provider || "smtp"
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
