import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!name || !email || !password || !otp) {
      return NextResponse.json(
        { error: "All fields, including the verification code, are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Verify OTP
    const pending = db.prepare("SELECT code, expires_at FROM pending_otps WHERE email = ?").get(email) as any;
    if (!pending) {
      return NextResponse.json(
        { error: "No verification request found for this email. Please request a new code." },
        { status: 400 }
      );
    }

    const expiredCheck = db.prepare(`
      SELECT 1 FROM pending_otps 
      WHERE email = ? AND datetime('now') > datetime(expires_at)
    `).get(email);

    if (expiredCheck) {
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (pending.code !== otp.trim()) {
      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    // Create user
    const hashed = hashPassword(password);
    const result = db
      .prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'client')")
      .run(name, email, hashed);

    // Clean up verification
    db.prepare("DELETE FROM pending_otps WHERE email = ?").run(email);

    const user = {
      id: Number(result.lastInsertRowid),
      name,
      email,
      role: "client" as const,
    };

    const token = signToken(user);

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
