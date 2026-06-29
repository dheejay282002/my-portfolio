import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = getDb();
  const projects = db
    .prepare("SELECT * FROM projects ORDER BY created_at DESC")
    .all() as Array<Record<string, unknown>>;

  const result = projects.map((p) => {
    const images = db
      .prepare("SELECT id, url FROM project_images WHERE project_id = ? ORDER BY sort_order")
      .all(p.id) as Array<{ id: number; url: string }>;
    return { ...p, images };
  });

  return NextResponse.json({ projects: result });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { title, description, live_url, images, tech_stack } =
      await req.json();
    const imageUrls = (images || []) as string[];

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = db
      .prepare(
        "INSERT INTO projects (title, description, live_url, image_url, tech_stack) VALUES (?, ?, ?, ?, ?)"
      )
      .run(title, description, live_url || "", imageUrls[0] || "", tech_stack || "");

    const projectId = Number(result.lastInsertRowid);

    const insertImg = db.prepare(
      "INSERT INTO project_images (project_id, url, sort_order) VALUES (?, ?, ?)"
    );
    for (let i = 0; i < imageUrls.length; i++) {
      insertImg.run(projectId, imageUrls[i], i);
    }

    return NextResponse.json({ id: projectId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id, title, description, live_url, images, tech_stack } =
      await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const db = getDb();
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (title !== undefined) { fields.push("title = ?"); values.push(title); }
    if (description !== undefined) { fields.push("description = ?"); values.push(description); }
    if (live_url !== undefined) { fields.push("live_url = ?"); values.push(live_url); }
    if (tech_stack !== undefined) { fields.push("tech_stack = ?"); values.push(tech_stack); }

    if (images !== undefined) {
      const imageUrls = images as string[];
      fields.push("image_url = ?");
      values.push(imageUrls[0] || "");
      db.prepare("DELETE FROM project_images WHERE project_id = ?").run(Number(id));
      const insertImg = db.prepare(
        "INSERT INTO project_images (project_id, url, sort_order) VALUES (?, ?, ?)"
      );
      for (let i = 0; i < imageUrls.length; i++) {
        insertImg.run(Number(id), imageUrls[i], i);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(Number(id));
    db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await req.json();
    const db = getDb();
    db.prepare("DELETE FROM project_images WHERE project_id = ?").run(id);
    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
