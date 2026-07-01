import { NextResponse } from "next/server";
import { queryOne, execute } from "@/lib/db";

export async function GET() {
  try {
    // Ensure table exists
    await execute(`
      CREATE TABLE IF NOT EXISTS web_settings (
        id INT PRIMARY KEY,
        web_name VARCHAR(255) DEFAULT 'Dee Jay.',
        logo_type VARCHAR(50) DEFAULT 'letter',
        logo_font VARCHAR(255) DEFAULT 'Inter',
        logo_image TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure logo_font_file column exists
    await execute(`
      ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS logo_font_file TEXT DEFAULT '';
    `);

    // Ensure logo_color column exists
    await execute(`
      ALTER TABLE web_settings ADD COLUMN IF NOT EXISTS logo_color VARCHAR(50) DEFAULT '#ffffff';
    `);

    // Ensure theme columns exist
    await execute(`
      ALTER TABLE web_settings 
      ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT '#06b6d4',
      ADD COLUMN IF NOT EXISTS bg_color VARCHAR(50) DEFAULT '#09090b',
      ADD COLUMN IF NOT EXISTS body_font VARCHAR(255) DEFAULT 'Inter',
      ADD COLUMN IF NOT EXISTS body_font_size VARCHAR(50) DEFAULT 'medium',
      ADD COLUMN IF NOT EXISTS body_font_file TEXT DEFAULT '';
    `);

    // Ensure default settings exist
    let settings = await queryOne("SELECT web_name, logo_type, logo_font, logo_image, logo_font_file, logo_color, accent_color, bg_color, body_font, body_font_size, body_font_file FROM web_settings WHERE id = 1");
    if (!settings) {
      await execute(`
        INSERT INTO web_settings (id, web_name, logo_type, logo_font, logo_image)
        VALUES (1, 'Dee Jay.', 'letter', 'Inter', '')
        ON CONFLICT (id) DO NOTHING
      `);
      settings = await queryOne("SELECT web_name, logo_type, logo_font, logo_image FROM web_settings WHERE id = 1");
    }

    return NextResponse.json({ settings });
  } catch (err: any) {
    console.error("[PUBLIC SETTINGS GET ERROR]", err);
    return NextResponse.json({
      settings: {
        web_name: "Dee Jay.",
        logo_type: "letter",
        logo_font: "Inter",
        logo_image: ""
      }
    });
  }
}
