import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/audit";
import { getCurrentUser } from "@/lib/auth";
import { updateUserProfile } from "@/lib/db";
import { getRequestIp } from "@/lib/rate-limit";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  const ip = getRequestIp(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await updateUserProfile(user.id, {
      username: typeof body.username === "string" ? body.username : undefined,
      avatar: typeof body.avatar === "string" ? body.avatar : undefined,
      bio: typeof body.bio === "string" ? body.bio : undefined,
      websiteUrl: typeof body.websiteUrl === "string" ? body.websiteUrl : undefined,
      xUrl: typeof body.xUrl === "string" ? body.xUrl : undefined,
      linkedinUrl: typeof body.linkedinUrl === "string" ? body.linkedinUrl : undefined,
    });

    await recordAuditEvent({
      action: "PROFILE_UPDATE",
      status: "SUCCESS",
      actorUserId: user.id,
      actorEmail: user.email,
      ipAddress: ip,
      route: "/api/profile",
      metadata: {
        changedFields: ["username", "avatar", "bio", "websiteUrl", "xUrl", "linkedinUrl"].filter((field) =>
          typeof body[field] === "string"
        ),
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    await recordAuditEvent({
      action: "PROFILE_UPDATE",
      status: "FAILURE",
      actorUserId: user.id,
      actorEmail: user.email,
      ipAddress: ip,
      route: "/api/profile",
      metadata: {
        reason: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile" },
      { status: 500 }
    );
  }
}
