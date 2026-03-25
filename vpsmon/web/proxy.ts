import { NextResponse, type NextRequest } from "next/server";

import { isAuthEnabled, verifyApiKeyCached } from "@/lib/auth";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/api/webhook/deploy") return true;
  if (pathname.startsWith("/share/")) return true;
  if (pathname.startsWith("/api/share/") && pathname !== "/api/share/route") return true;
  return false;
}

function unauthorizedApi() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthEnabled()) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const key = bearer || request.cookies.get("vpsmon-api-key")?.value || "";
  const role = key ? verifyApiKeyCached(key) : null;

  if (!role) {
    if (pathname.startsWith("/api/")) {
      return unauthorizedApi();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set("x-user-role", role);
  return response;
}

export const config = {
  matcher: ["/:path*"],
};
