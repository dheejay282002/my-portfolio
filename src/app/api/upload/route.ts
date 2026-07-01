import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { execute } from "@/lib/db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "portfolio-uploads",
          resource_type: "auto",
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result as { secure_url: string });
        }
      );
      uploadStream.end(buffer);
    });

    // Auto-register fonts in font library
    const originalName = file.name || "Custom Font";
    const isFont = /\.(ttf|otf|woff|woff2)$/i.test(originalName);
    if (isFont) {
      const nameNoExt = originalName.replace(/\.[^/.]+$/, "");
      const fontName = nameNoExt.replace(/[-_]/g, " ");
      // Detect font style from filename (case‑insensitive)
      const lower = nameNoExt.toLowerCase();
      let fontWeight = "normal";
      let fontStyle = "normal";
      if (/italic/i.test(lower)) fontStyle = "italic";
      if (/bold/i.test(lower)) fontWeight = "bold";
      else if (/black/i.test(lower)) fontWeight = "900";
      else if (/extrabold|extra bold/i.test(lower)) fontWeight = "800";
      else if (/semibold|semi bold|demibold|demi bold/i.test(lower)) fontWeight = "600";
      else if (/medium/i.test(lower)) fontWeight = "500";
      else if (/light/i.test(lower)) fontWeight = "300";
      else if (/thin/i.test(lower)) fontWeight = "100";
      try {
        // Step 1: ensure basic table exists
        await execute(`
          CREATE TABLE IF NOT EXISTS uploaded_fonts (
            id SERIAL PRIMARY KEY,
            font_name VARCHAR(255) NOT NULL UNIQUE,
            font_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
        `);
        // Step 2: insert with basic fields (always works)
        await execute(
          `INSERT INTO uploaded_fonts (font_name, font_url) 
           VALUES ($1, $2) 
           ON CONFLICT (font_name) DO UPDATE SET font_url = EXCLUDED.font_url`,
          [fontName, result.secure_url]
        );
        // Step 3: try to add style columns & update them (migration)
        try {
          await execute(`ALTER TABLE uploaded_fonts ADD COLUMN IF NOT EXISTS font_weight VARCHAR(20) DEFAULT 'normal'`);
          await execute(`ALTER TABLE uploaded_fonts ADD COLUMN IF NOT EXISTS font_style VARCHAR(20) DEFAULT 'normal'`);
          await execute(
            `UPDATE uploaded_fonts SET font_weight = $1, font_style = $2 WHERE font_name = $3`,
            [fontWeight, fontStyle, fontName]
          );
        } catch (_) {
          // columns already exist or migration not supported — fine
        }
      } catch (dbErr) {
        console.error("Failed to register uploaded font:", dbErr);
      }
    }

    return NextResponse.json({ url: result.secure_url });
  } catch (err) {
    console.error("[UPLOAD ERROR]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
