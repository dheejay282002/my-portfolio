import { NextResponse } from "next/server";
import { queryAll } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let contacts;
    if (user.role === "client") {
      contacts = await queryAll(
        "SELECT id, name, email, role, profile_photo FROM users WHERE role = 'admin' LIMIT 1",
        []
      );
    } else {
      contacts = await queryAll(
        "SELECT id, name, email, role, profile_photo FROM users WHERE role = 'client' ORDER BY name ASC",
        []
      );
    }

    return NextResponse.json({ contacts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Something went wrong" }, { status: 500 });
  }
}
