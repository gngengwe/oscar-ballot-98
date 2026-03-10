/**
 * Edge-compatible auth config (no DB / bcrypt imports).
 * Used by middleware only.
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;

      const isProtected =
        nextUrl.pathname.startsWith("/ballot") ||
        nextUrl.pathname.startsWith("/leaderboard") ||
        nextUrl.pathname.startsWith("/admin") ||
        nextUrl.pathname.startsWith("/api/admin");

      if (!isProtected) return true;
      if (!isLoggedIn) return false;

      if (nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin")) {
        return role === "admin";
      }

      return true;
    },
  },
};
