import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteOwnComment, updateOwnComment } from "@/lib/db";

export async function PATCH(
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
    const comment = await updateOwnComment(id, user.id, String(body.content ?? ""));
    return NextResponse.json({ comment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update comment";
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteOwnComment(id, user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete comment";
    const status = message === "Unauthorized" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
