"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/home";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo);
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-wide text-bone">
        Log In
      </h1>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-default border border-dried-blood bg-rust-mist/30 px-4 py-3 text-sm text-bone"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-stone">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-default border border-root-line bg-dark-moss px-4 text-bone placeholder:text-fog focus:border-fern"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-stone">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-default border border-root-line bg-dark-moss px-4 text-bone placeholder:text-fog focus:border-fern"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-default bg-fern font-body text-sm font-medium text-bone transition-colors duration-150 hover:bg-living-fern disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log In"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-root-line" />
        <span className="text-xs text-fog">OR</span>
        <div className="h-px flex-1 bg-root-line" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="h-10 w-full rounded-default border border-root-line text-sm font-medium text-stone transition-colors duration-150 hover:border-sage-edge hover:bg-forest-shadow hover:text-bone"
      >
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-stone">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-fern hover:text-living-fern">
          Sign up
        </Link>
      </p>
    </>
  );
}
