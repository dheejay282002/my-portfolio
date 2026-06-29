import nodemailer from "nodemailer";
import { queryOne } from "@/lib/db";

export async function sendOtpEmail(toEmail: string, code: string, subject: string = "Your OTP Code") {
  const config = await queryOne("SELECT * FROM email_config WHERE id = 1") as any;
  if (!config || !config.smtp_host || !config.smtp_user || !config.smtp_password) {
    throw new Error("Email service is not configured by the administrator yet.");
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: Number(config.smtp_port) || 587,
    secure: Number(config.smtp_port) === 465,
    auth: { user: config.smtp_user, pass: config.smtp_password },
    tls: { rejectUnauthorized: false },
  });

  await transporter.sendMail({
    from: `"${config.sender_name || "Dee Jay"}" <${config.sender_email || "otp@deejay.dev"}>`,
    to: toEmail,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e4e4e7;border-radius:16px;">
        <h2 style="font-size:20px;font-weight:bold;color:#18181b;margin-bottom:8px;">${subject}</h2>
        <p style="font-size:14px;color:#71717a;margin-bottom:24px;">Use the code below to proceed. It expires in 10 minutes.</p>
        <div style="background:#f4f4f5;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
          <span style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:6px;color:#06b6d4;">${code}</span>
        </div>
        <p style="font-size:12px;color:#a1a1aa;border-top:1px solid #e4e4e7;padding-top:16px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
}
