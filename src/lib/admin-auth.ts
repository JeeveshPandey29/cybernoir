import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "cybernoir-admin-token";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for admin authentication.");
  }
  return secret;
}

export function createAdminToken(): string {
  const payload = JSON.stringify({
    role: "admin",
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyAdminToken(token: string): boolean {
  try {
    const parts = token.split(".");
    const encoded = parts[0];
    const sig = parts[1];
    if (!encoded || !sig) return false;
    const expectedSig = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
    if (sig !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    return payload.role === "admin" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminUser || !adminPass) return false;
  const usernameMatch =
    Buffer.byteLength(username) === Buffer.byteLength(adminUser) &&
    timingSafeEqual(Buffer.from(username), Buffer.from(adminUser));
  const passwordMatch =
    Buffer.byteLength(password) === Buffer.byteLength(adminPass) &&
    timingSafeEqual(Buffer.from(password), Buffer.from(adminPass));
  return usernameMatch && passwordMatch;
}

export { COOKIE_NAME };
