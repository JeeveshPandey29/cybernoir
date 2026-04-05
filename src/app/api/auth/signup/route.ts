import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { recordAuditEvent } from "@/lib/audit";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db";
import { consumeRateLimit, getRequestIp } from "@/lib/rate-limit";
import { isValidEmail, isValidUsername, normalizeUsername, validatePasswordStrength } from "@/lib/security";

export async function POST(req: Request) {
  try {
    const ip = getRequestIp(req);
    const rateLimit = consumeRateLimit(`signup:${ip}`, 5, 15 * 60 * 1000);
    const body = await req.json();
    const { email, username, password } = body;
    const normalizedEmail = String(email ?? "").trim().toLowerCase();
    const normalizedUsername = normalizeUsername(String(username ?? ""));

    if (!normalizedEmail || !normalizedUsername || !password) {
      await recordAuditEvent({
        action: "SIGNUP",
        status: "FAILURE",
        actorEmail: normalizedEmail || null,
        ipAddress: ip,
        route: "/api/auth/signup",
        metadata: { reason: "MISSING_FIELDS" },
      });
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    if (!rateLimit.allowed) {
      await recordAuditEvent({
        action: "SIGNUP",
        status: "FAILURE",
        actorEmail: normalizedEmail || null,
        ipAddress: ip,
        route: "/api/auth/signup",
        metadata: { reason: "RATE_LIMITED" },
      });
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      );
    }

    if (!isValidEmail(normalizedEmail)) {
      await recordAuditEvent({
        action: "SIGNUP",
        status: "FAILURE",
        actorEmail: normalizedEmail || null,
        ipAddress: ip,
        route: "/api/auth/signup",
        metadata: { reason: "INVALID_EMAIL" },
      });
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    if (!isValidUsername(normalizedUsername)) {
      await recordAuditEvent({
        action: "SIGNUP",
        status: "FAILURE",
        actorEmail: normalizedEmail || null,
        ipAddress: ip,
        route: "/api/auth/signup",
        metadata: { reason: "INVALID_USERNAME" },
      });
      return NextResponse.json(
        { error: "Username must be 3-32 characters and use only letters, numbers, or underscores" },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      await recordAuditEvent({
        action: "SIGNUP",
        status: "FAILURE",
        actorEmail: normalizedEmail || null,
        ipAddress: ip,
        route: "/api/auth/signup",
        metadata: { reason: "WEAK_PASSWORD" },
      });
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    const existingEmail = await getUserByEmail(normalizedEmail);
    if (existingEmail) {
      await recordAuditEvent({
        action: "SIGNUP",
        status: "FAILURE",
        actorEmail: normalizedEmail,
        ipAddress: ip,
        route: "/api/auth/signup",
        metadata: { reason: "EMAIL_EXISTS" },
      });
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const existingUsername = await getUserByUsername(normalizedUsername);
    if (existingUsername) {
      await recordAuditEvent({
        action: "SIGNUP",
        status: "FAILURE",
        actorEmail: normalizedEmail,
        ipAddress: ip,
        route: "/api/auth/signup",
        metadata: { reason: "USERNAME_EXISTS" },
      });
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const adminEmail = process.env.ADMIN_EMAIL || "";

    const user = await createUser({
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role: normalizedEmail === adminEmail ? "ADMIN" : "USER",
    });

    await recordAuditEvent({
      action: "SIGNUP",
      status: "SUCCESS",
      actorUserId: user.id,
      actorEmail: normalizedEmail,
      ipAddress: ip,
      route: "/api/auth/signup",
      metadata: { role: user.role },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
