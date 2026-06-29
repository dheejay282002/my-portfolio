import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const config = db.prepare("SELECT * FROM email_config WHERE id = 1").get() as any;
    if (!config || !config.smtp_host || !config.smtp_user || !config.smtp_password) {
      return NextResponse.json(
        { error: "Email service is not configured by the administrator yet." },
        { status: 500 }
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.prepare(`
      INSERT OR REPLACE INTO pending_otps (email, code, expires_at)
      VALUES (?, ?, datetime('now', '+5 minutes'))
    `).run(email, otpCode);

    const transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: Number(config.smtp_port) || 587,
      secure: Number(config.smtp_port) === 465,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: `"${config.sender_name || "Dee Jay"}" <${config.sender_email || "otp@deejay.dev"}>`,
      to: email,
      subject: "Verification Code for Account Registration",
      text: `Hello ${name},\n\nYour verification code is: ${otpCode}.\nIt will expire in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #18181b; margin-bottom: 8px;">Verify Your Email</h2>
          <p style="font-size: 14px; color: #71717a; margin-bottom: 24px;">Hello <strong>${name}</strong>, use the verification code below to verify your email and complete your registration.</p>
          <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #06b6d4;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 16px;">This code will expire in 5 minutes. If you did not sign up for an account, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
