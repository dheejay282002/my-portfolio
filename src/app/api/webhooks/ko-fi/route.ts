import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";

export async function POST(req: Request) {
  try {
    let payload: any = {};
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      const dataStr = formData.get("data") as string;
      if (dataStr) {
        payload = JSON.parse(dataStr);
      }
    } else {
      payload = await req.json().catch(() => ({}));
    }

    console.log("[KO-FI WEBHOOK PAYLOAD]", payload);

    // Only process successful donations/payments
    const amount = Number(payload.amount || 0);
    // Ko-Fi default coffee is $3. So number of cups = amount / 3, minimum 1 if amount > 0
    const cupsEarned = amount > 0 ? Math.max(1, Math.floor(amount / 3)) : 1;

    // Get current cups count for admin
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS cups_of_coffee VARCHAR(50) DEFAULT '0'");
    const admin = await queryOne("SELECT id, cups_of_coffee FROM users WHERE role = 'admin' LIMIT 1");
    if (admin) {
      const currentVal = admin.cups_of_coffee || "0";
      const match = currentVal.match(/\d+/);
      const currentNum = match ? parseInt(match[0], 10) : 0;
      const newNum = currentNum + cupsEarned;
      const updatedVal = currentVal.includes("+") ? `${newNum}+` : `${newNum}`;

      await execute("UPDATE users SET cups_of_coffee = $1 WHERE id = $2", [updatedVal, admin.id]);
      console.log(`[KO-FI WEBHOOK SUCCESS] Incremented cups_of_coffee by ${cupsEarned} for admin. New value: ${updatedVal}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[KO-FI WEBHOOK ERROR]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
