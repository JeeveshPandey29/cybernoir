import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { toggleCommentLike } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await toggleCommentLike(id, user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to like comment" },
      { status: 500 }
    );
  }
}
