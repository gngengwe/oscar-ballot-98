"use client";

import { registerUser } from "@/lib/actions";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Auto sign in after registration
    const signInResult = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      setError("Registration succeeded but auto-login failed. Please sign in.");
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
            <span className="text-4xl mb-3 block">🎬</span>
            <h1 className="text-2xl font-bold text-cinema-100">
              Join the Game
            </h1>
            <p className="text-cinema-400 text-sm mt-1">
              Create your account and start picking winners
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
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                required
                minLength={2}
                maxLength={30}
                className="w-full px-4 py-2.5 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 placeholder-cinema-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="Your display name"
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg bg-cinema-900 border border-cinema-600/50 text-cinema-100 placeholder-cinema-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                placeholder="Min 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gold-600 text-white font-semibold hover:bg-gold-500 disabled:opacity-50 transition-all"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-cinema-400 text-sm mt-6">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-gold-400 hover:text-gold-300"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
