"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/ballot");
      router.refresh();
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-cinema-800/80 border border-cinema-600/30 rounded-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <span className="text-4xl mb-3 block">🏆</span>
            <h1 className="text-2xl font-bold text-cinema-100">Welcome Back</h1>
            <p className="text-cinema-400 text-sm mt-1">
              Sign in to manage your Oscar ballot
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cinema-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 placeholder-cinema-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-cinema-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 placeholder-cinema-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gold-600 text-white font-semibold hover:bg-gold-500 disabled:opacity-50 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-cinema-400 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-gold-400 hover:text-gold-300">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
