import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];
const API_JOBS_PREFIX = "/api/jobs/";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ログインページ・認証API・cronジョブAPIは認証不要
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith(API_JOBS_PREFIX)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authSecret = process.env.AUTH_SECRET ?? "change-me-in-production";

  if (!token || !(await verifySessionToken(token, authSecret))) {
    // APIルートは401を返す
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    // ページはログイン画面にリダイレクト
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
