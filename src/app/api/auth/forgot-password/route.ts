import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await execute(
      `INSERT INTO pending_otps (email, code, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET code=$2, expires_at=$3, created_at=NOW()`,
      [email, code, expiresAt]
    );

    await sendOtpEmail(email, code, "Password Reset");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[FORGOT PASSWORD ERROR]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
