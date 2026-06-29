import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const row = db
      .prepare("SELECT id, name, email, password, role FROM users WHERE email = ?")
      .get(email) as
      | { id: number; name: string; email: string; password: string; role: "admin" | "client" }
      | undefined;

    if (!row || !verifyPassword(password, row.password)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = { id: row.id, name: row.name, email: row.email, role: row.role };
    const token = signToken(user);

    const response = NextResponse.json({ user });
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
