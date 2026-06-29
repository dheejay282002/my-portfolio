import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await queryAll("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
  return NextResponse.json({ users });
}
