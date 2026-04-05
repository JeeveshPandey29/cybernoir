import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { buildAdminTotpUri, isAdminMfaEnabled } from "@/lib/totp";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.ADMIN_TOTP_SECRET ?? null;
  const otpauthUrl = buildAdminTotpUri();

  return NextResponse.json({
    enabled: isAdminMfaEnabled(),
    secret,
    otpauthUrl,
  });
}
