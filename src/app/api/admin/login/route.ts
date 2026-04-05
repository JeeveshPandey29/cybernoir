import { NextResponse } from "next/server";
import { verifyAdminCredentials, createAdminToken, COOKIE_NAME } from "@/lib/admin-auth";
import { recordAuditEvent } from "@/lib/audit";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";
import { isAdminMfaEnabled, verifyTotp } from "@/lib/totp";

export async function POST(req: Request) {
  try {
    const { username, password, otp } = await req.json();
    const ip = getRequestIp(req);
    const rateLimit = consumeRateLimit(`admin-login:${ip}:${username ?? "unknown"}`, 5, 15 * 60 * 1000);

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (!rateLimit.allowed) {
      await recordAuditEvent({
        action: "ADMIN_LOGIN",
        status: "FAILURE",
        actorEmail: typeof username === "string" ? username : null,
        ipAddress: ip,
        route: "/api/admin/login",
        metadata: { reason: "RATE_LIMITED" },
      });
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    if (!verifyAdminCredentials(username, password)) {
      await recordAuditEvent({
        action: "ADMIN_LOGIN",
        status: "FAILURE",
        actorEmail: username,
        ipAddress: ip,
        route: "/api/admin/login",
        metadata: { reason: "INVALID_CREDENTIALS" },
      });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (isAdminMfaEnabled()) {
      const secret = process.env.ADMIN_TOTP_SECRET!;
      if (!otp || !verifyTotp(secret, String(otp), 2)) {
        await recordAuditEvent({
          action: "ADMIN_LOGIN",
          status: "FAILURE",
          actorEmail: username,
          ipAddress: ip,
          route: "/api/admin/login",
          metadata: { reason: "INVALID_OTP" },
        });
        return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
      }
    }

    const token = createAdminToken();
    const res = NextResponse.json({ success: true });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    await recordAuditEvent({
      action: "ADMIN_LOGIN",
      status: "SUCCESS",
      actorEmail: username,
      ipAddress: ip,
      route: "/api/admin/login",
      metadata: { mfaEnabled: isAdminMfaEnabled() },
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
