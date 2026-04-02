import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "studio-token";

const PUBLIC_PATHS = [
  "/studio-ai/login",
  "/api/studio/auth", // covers /api/studio/auth and /api/studio/auth/logout
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isApiRoute = pathname.startsWith("/api/studio");

  if (!token) {
    return isApiRoute
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/studio-ai/login", request.url));
  }

  try {
    const sec = new TextEncoder().encode(process.env.AUTH_SECRET!);
    await jwtVerify(token, sec);
    return NextResponse.next();
  } catch {
    return isApiRoute
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/studio-ai/login", request.url));
  }
}

export const config = {
  matcher: ["/studio-ai(.*)", "/api/studio(.*)"],
};
