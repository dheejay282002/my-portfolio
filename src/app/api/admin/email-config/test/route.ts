import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      sender_email,
      sender_name,
      to_email,
    } = await req.json();

    if (!to_email) {
      return NextResponse.json({ error: "Test recipient email is required" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtp_host || "",
      port: Number(smtp_port) || 587,
      secure: Number(smtp_port) === 465,
      auth: {
        user: smtp_user || "",
        pass: smtp_password || "",
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    const info = await transporter.sendMail({
      from: `"${sender_name || "Dee Jay OTP"}" <${sender_email || "otp@deejay.dev"}>`,
      to: to_email,
      subject: "Your OTP Verification Code",
      text: `Your OTP verification code is: ${otpCode}. It will expire in 5 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 16px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #18181b; margin-bottom: 8px;">OTP Verification</h2>
          <p style="font-size: 14px; color: #71717a; margin-bottom: 24px;">Use the verification code below to complete your authentication. Never share this code.</p>
          <div style="background-color: #f4f4f5; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #06b6d4;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #a1a1aa; margin-top: 24px; border-top: 1px solid #e4e4e7; padding-top: 16px;">If you did not request this code, please ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send test email" }, { status: 500 });
  }
}
