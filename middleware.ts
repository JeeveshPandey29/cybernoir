import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PRIVATE_USER_PATHS = new Set(["/profile", "/notifications", "/likes", "/bookmarks"]);

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function verifyAdminCookie(token: string, secret: string) {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signature),
    new TextEncoder().encode(encoded)
  );

  if (!isValidSignature) {
    return false;
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as {
      role?: string;
      exp?: number;
    };

    return payload.role === "admin" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function applyNoStoreHeaders(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminCookie = request.cookies.get("cybernoir-admin-token")?.value;
    const adminSecret = process.env.NEXTAUTH_SECRET;
    const isValidAdminSession =
      Boolean(adminCookie && adminSecret) && (await verifyAdminCookie(adminCookie!, adminSecret!));

    if (!isValidAdminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.set("cybernoir-admin-token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      });
      return applyNoStoreHeaders(response);
    }

    return applyNoStoreHeaders(NextResponse.next());
  }

  if (PRIVATE_USER_PATHS.has(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return applyNoStoreHeaders(NextResponse.redirect(loginUrl));
    }

    return applyNoStoreHeaders(NextResponse.next());
  }

  if (pathname === "/login" || pathname === "/signup" || pathname === "/admin/login") {
    return applyNoStoreHeaders(NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/profile",
    "/notifications",
    "/likes",
    "/bookmarks",
    "/login",
    "/signup",
  ],
};
