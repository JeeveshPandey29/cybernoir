import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { ensureAdminAuthorUser, updateUserProfile } from "@/lib/db";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await ensureAdminAuthorUser();

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load author profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const existing = await ensureAdminAuthorUser();

    const body = await req.json();
    const updated = await updateUserProfile(existing.id, {
      username: typeof body.username === "string" ? body.username : undefined,
      avatar: typeof body.avatar === "string" ? body.avatar : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
      websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : undefined,
      xUrl: typeof body.xUrl === "string" ? body.xUrl : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : undefined,
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update author profile" },
      { status: 500 }
    );
  }
}
