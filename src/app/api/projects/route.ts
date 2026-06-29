import { NextResponse } from "next/server";
import { queryAll, queryOne, execute } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const projects = await queryAll("SELECT * FROM projects ORDER BY created_at DESC") as Array<Record<string, any>>;

    const result = [];
    for (const p of projects) {
      const images = await queryAll(
        "SELECT id, url FROM project_images WHERE project_id = $1 ORDER BY sort_order",
        [p.id]
      ) as Array<{ id: number; url: string }>;
      result.push({ ...p, images });
    }

    return NextResponse.json({ projects: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { title, description, live_url, images, tech_stack } = await req.json();
    const imageUrls = (images || []) as string[];

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const result = await queryOne(
      "INSERT INTO projects (title, description, live_url, image_url, tech_stack) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [title, description, live_url || "", imageUrls[0] || "", tech_stack || ""]
    ) as { id: number };

    const projectId = result.id;

    for (let i = 0; i < imageUrls.length; i++) {
      await execute(
        "INSERT INTO project_images (project_id, url, sort_order) VALUES ($1, $2, $3)",
        [projectId, imageUrls[i], i]
      );
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
    const { id, title, description, live_url, images, tech_stack } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const fields: string[] = [];
    const values: (string | number)[] = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); values.push(description); }
    if (live_url !== undefined) { fields.push(`live_url = $${idx++}`); values.push(live_url); }
    if (tech_stack !== undefined) { fields.push(`tech_stack = $${idx++}`); values.push(tech_stack); }

    if (images !== undefined) {
      const imageUrls = images as string[];
      fields.push(`image_url = $${idx++}`);
      values.push(imageUrls[0] || "");
      
      await execute("DELETE FROM project_images WHERE project_id = $1", [Number(id)]);
      for (let i = 0; i < imageUrls.length; i++) {
        await execute(
          "INSERT INTO project_images (project_id, url, sort_order) VALUES ($1, $2, $3)",
          [Number(id), imageUrls[i], i]
        );
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    values.push(Number(id));
    await execute(`UPDATE projects SET ${fields.join(", ")} WHERE id = $${idx}`, values);
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
    await execute("DELETE FROM project_images WHERE project_id = $1", [id]);
    await execute("DELETE FROM projects WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
