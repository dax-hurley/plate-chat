import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = ["/app"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    console.error("AUTH_SECRET is not set");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const token = await getToken({ req, secret });
  if (!token) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
