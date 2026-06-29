import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession, signToken } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { 
      name, 
      last_name, 
      bio, 
      profile_photo, 
      github_url, 
      linkedin_url, 
      twitter_url,
      email,
      password 
    } = await req.json();

    const db = getDb();

    if (user.role === "admin") {
      if (email && email !== user.email) {
        const existing = db
          .prepare("SELECT id FROM users WHERE email = ? AND id != ?")
          .get(email, user.id);
        if (existing) {
          return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
        }
        db.prepare("UPDATE users SET email = ? WHERE id = ?").run(email, user.id);
      }

      if (password) {
        const hash = bcrypt.hashSync(password, 10);
        db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hash, user.id);
      }
    }
    db.prepare(
      "UPDATE users SET name = COALESCE(?, name), last_name = COALESCE(?, last_name), bio = COALESCE(?, bio), profile_photo = COALESCE(?, profile_photo), github_url = COALESCE(?, github_url), linkedin_url = COALESCE(?, linkedin_url), twitter_url = COALESCE(?, twitter_url) WHERE id = ?"
    ).run(
      name ?? null,
      last_name ?? null,
      bio ?? null,
      profile_photo ?? null,
      github_url ?? null,
      linkedin_url ?? null,
      twitter_url ?? null,
      user.id
    );

    const updated = db
      .prepare("SELECT id, name, email, role, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url FROM users WHERE id = ?")
      .get(user.id) as Record<string, unknown>;

    const newToken = signToken({
      id: updated.id as number,
      name: updated.name as string,
      email: updated.email as string,
      role: updated.role as "admin" | "client",
    });

    const response = NextResponse.json({ user: updated });
    response.cookies.set("token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
