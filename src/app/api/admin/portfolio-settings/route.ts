import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { queryOne, execute } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await execute(`
      CREATE TABLE IF NOT EXISTS portfolio_settings (
        id INT PRIMARY KEY DEFAULT 1,
        slug VARCHAR(255) UNIQUE DEFAULT '',
        title VARCHAR(255) DEFAULT 'My Portfolio',
        tagline VARCHAR(500) DEFAULT 'Web Developer & Designer',
        bio TEXT DEFAULT '',
        skills JSONB DEFAULT '[]',
        social_github TEXT DEFAULT '',
        social_linkedin TEXT DEFAULT '',
        social_facebook TEXT DEFAULT '',
        social_twitter TEXT DEFAULT '',
        contact_email VARCHAR(255) DEFAULT '',
        contact_phone VARCHAR(50) DEFAULT '',
        contact_location VARCHAR(255) DEFAULT '',
        hero_visible BOOLEAN DEFAULT true,
        about_visible BOOLEAN DEFAULT true,
        skills_visible BOOLEAN DEFAULT true,
        projects_visible BOOLEAN DEFAULT true,
        services_visible BOOLEAN DEFAULT true,
        contact_visible BOOLEAN DEFAULT true,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await execute(`ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS social_twitter TEXT DEFAULT ''`);

    let settings = await queryOne(`SELECT * FROM portfolio_settings WHERE id = 1`);
    if (!settings) {
      await execute(`INSERT INTO portfolio_settings (id) VALUES (1)`);
      settings = await queryOne(`SELECT * FROM portfolio_settings WHERE id = 1`);
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Portfolio settings GET error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      slug, title, tagline, bio, skills,
      social_github, social_linkedin, social_facebook, social_twitter,
      contact_email, contact_phone, contact_location,
      hero_visible, about_visible, skills_visible, projects_visible,
      services_visible, contact_visible, is_published,
    } = body;

    await execute(`
      CREATE TABLE IF NOT EXISTS portfolio_settings (
        id INT PRIMARY KEY DEFAULT 1,
        slug VARCHAR(255) UNIQUE DEFAULT '',
        title VARCHAR(255) DEFAULT 'My Portfolio',
        tagline VARCHAR(500) DEFAULT 'Web Developer & Designer',
        bio TEXT DEFAULT '',
        skills JSONB DEFAULT '[]',
        social_github TEXT DEFAULT '',
        social_linkedin TEXT DEFAULT '',
        social_facebook TEXT DEFAULT '',
        social_twitter TEXT DEFAULT '',
        contact_email VARCHAR(255) DEFAULT '',
        contact_phone VARCHAR(50) DEFAULT '',
        contact_location VARCHAR(255) DEFAULT '',
        hero_visible BOOLEAN DEFAULT true,
        about_visible BOOLEAN DEFAULT true,
        skills_visible BOOLEAN DEFAULT true,
        projects_visible BOOLEAN DEFAULT true,
        services_visible BOOLEAN DEFAULT true,
        contact_visible BOOLEAN DEFAULT true,
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await execute(`ALTER TABLE portfolio_settings ADD COLUMN IF NOT EXISTS social_twitter TEXT DEFAULT ''`);

    await execute(`INSERT INTO portfolio_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`);

    await execute(
      `UPDATE portfolio_settings SET
        slug = $1, title = $2, tagline = $3, bio = $4, skills = $5,
        social_github = $6, social_linkedin = $7, social_facebook = $8, social_twitter = $9,
        contact_email = $10, contact_phone = $11, contact_location = $12,
        hero_visible = $13, about_visible = $14, skills_visible = $15, projects_visible = $16,
        services_visible = $17, contact_visible = $18, is_published = $19,
        updated_at = NOW()
      WHERE id = 1`,
      [
        slug || "", title || "My Portfolio", tagline || "Web Developer & Designer", bio || "",
        JSON.stringify(skills || []),
        social_github || "", social_linkedin || "", social_facebook || "", social_twitter || "",
        contact_email || "", contact_phone || "", contact_location || "",
        hero_visible !== false, about_visible !== false, skills_visible !== false,
        projects_visible !== false, services_visible !== false, contact_visible !== false,
        is_published === true,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Portfolio settings POST error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
