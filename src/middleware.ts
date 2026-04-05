import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/setup") return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/public")) return true;
  if (pathname === "/favicon.ico") return true;
  return false;
}

export function middleware(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};

