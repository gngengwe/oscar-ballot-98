"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useCallback } from "react";
import OscarsPlayer from "@/components/OscarsPlayer";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const triggerTutorial = useCallback(() => {
    localStorage.removeItem("oscar-tutorial-seen");
    window.dispatchEvent(new CustomEvent("oscar-open-tutorial"));
    setMobileOpen(false);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-cinema-950/90 backdrop-blur-md border-b border-cinema-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🏆</span>
            <span className="text-lg font-bold text-gold-400 group-hover:text-gold-300 transition-colors">
              Oscar Ballot 2026
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/" className="text-cinema-200 hover:text-gold-400 transition-colors text-sm font-medium">
              Home
            </Link>
            {session && (
              <>
                <Link href="/ballot" className="text-cinema-200 hover:text-gold-400 transition-colors text-sm font-medium">
                  My Ballot
                </Link>
                <Link href="/leaderboard" className="text-cinema-200 hover:text-gold-400 transition-colors text-sm font-medium">
                  Leaderboard
                </Link>
              </>
            )}
            {session && (session.user as { role?: string }).role === "admin" && (
              <Link href="/admin" className="text-cinema-200 hover:text-gold-400 transition-colors text-sm font-medium">
                Admin
              </Link>
            )}

            {/* Tutorial help button */}
            <button
              onClick={triggerTutorial}
              title="Open tutorial"
              className="w-7 h-7 rounded-full bg-cinema-700/60 border border-cinema-600/40 text-cinema-300 hover:text-gold-400 hover:border-gold-500/40 transition-all text-xs font-bold"
            >
              ?
            </button>

            <OscarsPlayer />

            {session ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-1.5 text-sm text-cinema-300 hover:text-gold-400 transition-colors"
                  title="My Profile"
                >
                  <span className="text-base">👤</span>
                  <span className="max-w-[120px] truncate">{session.user?.name}</span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm px-3 py-1.5 rounded-md bg-cinema-800 text-cinema-200 hover:bg-cinema-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="text-sm px-4 py-1.5 rounded-md bg-cinema-800 text-cinema-200 hover:bg-cinema-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-sm px-4 py-1.5 rounded-md bg-gold-600 text-white hover:bg-gold-500 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-cinema-200"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" onClick={() => setMobileOpen(false)} className="block py-2 text-cinema-200 hover:text-gold-400">Home</Link>
            {session && (
              <>
                <Link href="/ballot" onClick={() => setMobileOpen(false)} className="block py-2 text-cinema-200 hover:text-gold-400">My Ballot</Link>
                <Link href="/leaderboard" onClick={() => setMobileOpen(false)} className="block py-2 text-cinema-200 hover:text-gold-400">Leaderboard</Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="block py-2 text-cinema-200 hover:text-gold-400">👤 My Profile</Link>
              </>
            )}
            {session && (session.user as { role?: string }).role === "admin" && (
              <Link href="/admin" onClick={() => setMobileOpen(false)} className="block py-2 text-cinema-200 hover:text-gold-400">Admin</Link>
            )}
            <button onClick={triggerTutorial} className="block py-2 text-cinema-300 hover:text-gold-400">? Tutorial</button>
            {session ? (
              <button onClick={() => signOut()} className="block py-2 text-cinema-300">Sign Out</button>
            ) : (
              <>
                <Link href="/auth/signin" className="block py-2 text-cinema-200">Sign In</Link>
                <Link href="/auth/register" className="block py-2 text-gold-400">Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
