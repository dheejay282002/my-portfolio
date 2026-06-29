import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const contacts = await queryAll(
      "SELECT id, name, email, role, profile_photo FROM users WHERE id != $1 ORDER BY name ASC",
      [user.id]
    );

    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
