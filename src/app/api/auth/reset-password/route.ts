import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const record = await queryOne(
      "SELECT code, expires_at FROM pending_otps WHERE email = $1",
      [email]
    );

    if (!record) {
      return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });
    }

    if (new Date() > new Date(record.expires_at)) {
      await execute("DELETE FROM pending_otps WHERE email = $1", [email]);
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (record.code !== otp.trim()) {
      return NextResponse.json({ error: "Invalid OTP code." }, { status: 400 });
    }

    const hash = hashPassword(newPassword);
    await execute("UPDATE users SET password = $1 WHERE email = $2", [hash, email]);
    await execute("DELETE FROM pending_otps WHERE email = $1", [email]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[RESET PASSWORD ERROR]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
