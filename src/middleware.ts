import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Use the edge-compatible config (no Prisma / bcrypt)
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  if (!session) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(signInUrl);
  }

  const role = (session.user as { role?: string } | undefined)?.role;
  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
    role !== "admin"
  ) {
    return Response.redirect(new URL("/", req.url));
  }
});

export const config = {
  matcher: [
    "/ballot/:path*",
    "/leaderboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
