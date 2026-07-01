import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";
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
      password,
      current_password,
      cups_of_coffee,
      contributions,
    } = await req.json();

    if (user.role === "admin") {
      if (email && email !== user.email) {
        const existing = await queryOne(
          "SELECT id FROM users WHERE email = $1 AND id != $2",
          [email, user.id]
        );
        if (existing) {
          return NextResponse.json({ error: "Email is already taken" }, { status: 400 });
        }
        await execute("UPDATE users SET email = $1 WHERE id = $2", [email, user.id]);
      }
    }

    if (password) {
      if (!current_password) {
        return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
      }
      const stored = await queryOne(
        "SELECT password FROM users WHERE id = $1",
        [user.id]
      ) as { password: string } | null;
      if (!stored || !bcrypt.compareSync(current_password, stored.password)) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      const hash = bcrypt.hashSync(password, 10);
      await execute("UPDATE users SET password = $1 WHERE id = $2", [hash, user.id]);
    }
    
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS cups_of_coffee VARCHAR(50) DEFAULT '0'");
    await execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS contributions VARCHAR(50) DEFAULT '1k+'");

    await execute(
      "UPDATE users SET name = COALESCE($1, name), last_name = COALESCE($2, last_name), bio = COALESCE($3, bio), profile_photo = COALESCE($4, profile_photo), github_url = COALESCE($5, github_url), linkedin_url = COALESCE($6, linkedin_url), twitter_url = COALESCE($7, twitter_url), cups_of_coffee = COALESCE($8, cups_of_coffee), contributions = COALESCE($9, contributions) WHERE id = $10",
      [
        name ?? null,
        last_name ?? null,
        bio ?? null,
        profile_photo ?? null,
        github_url ?? null,
        linkedin_url ?? null,
        twitter_url ?? null,
        cups_of_coffee ?? null,
        contributions ?? null,
        user.id
      ]
    );

    const updated = await queryOne(
      "SELECT id, name, email, role, last_name, profile_photo, bio, github_url, linkedin_url, twitter_url, cups_of_coffee, contributions FROM users WHERE id = $1",
      [user.id]
    ) as Record<string, unknown>;

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
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
