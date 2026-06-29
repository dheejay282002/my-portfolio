import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
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

    const existing = await queryOne("SELECT id FROM users WHERE email = $1", [email]);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Verify OTP
    const pending = await queryOne("SELECT code, expires_at FROM pending_otps WHERE email = $1", [email]) as any;
    if (!pending) {
      return NextResponse.json(
        { error: "No verification request found for this email. Please request a new code." },
        { status: 400 }
      );
    }

    const expiredCheck = await queryOne(`
      SELECT 1 FROM pending_otps 
      WHERE email = $1 AND NOW() > expires_at
    `, [email]);

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
    const result = await queryOne(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'client') RETURNING id",
      [name, email, hashed]
    ) as { id: number };

    // Clean up verification
    await execute("DELETE FROM pending_otps WHERE email = $1", [email]);

    const user = {
      id: result.id,
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
