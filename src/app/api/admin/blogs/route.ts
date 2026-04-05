import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createBlog, getBlogsWithCounts } from "@/lib/db";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const blogs = await getBlogsWithCounts();
    return NextResponse.json({ blogs });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, excerpt, tags, coverImage, published, scheduledFor } = body;

    if (!title || !content || !excerpt) {
      return NextResponse.json(
        { error: "Title, content, and excerpt are required" },
        { status: 400 }
      );
    }

    const blog = await createBlog({
      title,
      content,
      excerpt,
      tags: tags || "",
      coverImage: coverImage || null,
      published: published ?? false,
      scheduledFor: scheduledFor || null,
    });

    return NextResponse.json({ blog }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
