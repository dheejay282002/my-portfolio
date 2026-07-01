import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

const publicPaths = [
  "/",
  "/login",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/signup/request-otp",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/dashboard/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
