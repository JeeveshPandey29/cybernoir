import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reportComment } from "@/lib/db";

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
    const reason = typeof body.reason === "string" ? body.reason : "Inappropriate";
    const result = await reportComment(id, user.id, reason);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to report comment" },
      { status: 500 }
    );
  }
}
