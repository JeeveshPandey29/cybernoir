import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addCommentToBlog, getBlogCounts } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const content = String(body.content ?? "");
    const parentCommentId = body.parentCommentId ? String(body.parentCommentId) : null;
    const comment = await addCommentToBlog(id, user.id, content, parentCommentId);
    const counts = await getBlogCounts(id);

    return NextResponse.json({ comment, counts }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add comment" },
      { status: 500 }
    );
  }
}
