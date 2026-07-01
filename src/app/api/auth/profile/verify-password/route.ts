import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { current_password } = await req.json();
    if (!current_password) {
      return NextResponse.json({ valid: false, error: "Current password is required" }, { status: 400 });
    }

    const stored = await queryOne(
      "SELECT password FROM users WHERE id = $1",
      [user.id]
    ) as { password: string } | null;

    if (!stored || !bcrypt.compareSync(current_password, stored.password)) {
      return NextResponse.json({ valid: false, error: "Current password is incorrect" });
    }

    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false, error: "Something went wrong" }, { status: 500 });
  }
}
