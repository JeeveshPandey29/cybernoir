import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBlogCounts, toggleBlogLike } from "@/lib/db";

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
    const state = await toggleBlogLike(id, user.id);
    const counts = await getBlogCounts(id);

    return NextResponse.json({
      liked: state.liked,
      bookmarked: state.bookmarked,
      disabled: "disabled" in state ? state.disabled : false,
      counts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to toggle like" },
      { status: 500 }
    );
  }
}
