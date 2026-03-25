"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileForUser } from "@/lib/auth/profile-bootstrap";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProfileType } from "@/types";

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

  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: authData,
      error: authError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const user = authData.user;
    if (user) {
      const metadata = (user.user_metadata ?? {}) as {
        display_name?: string;
        profile_type?: ProfileType;
      };

      const fallbackName =
        metadata.display_name ||
        user.email?.split("@")[0] ||
        "New User";
      const fallbackType: ProfileType =
        metadata.profile_type === "promoter" ||
        metadata.profile_type === "fan" ||
        metadata.profile_type === "dj"
          ? metadata.profile_type
          : "dj";

      try {
        await ensureProfileForUser({
          userId: user.id,
          displayName: fallbackName,
          profileType: fallbackType,
        });
      } catch {
        // Non-fatal: user can still continue and complete profile manually.
      }
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

  function openForgotPassword() {
    setResetEmail(email);
    setResetError(null);
    setResetSent(false);
    setForgotOpen(true);
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    const supabase = createClient();
    const trimmed = resetEmail.trim();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
      trimmed,
      {
        redirectTo: `${window.location.origin}/login`,
      },
    );
    setResetLoading(false);
    if (resetErr) {
      setResetError(resetErr.message);
      return;
    }
    setResetSent(true);
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
          <div className="mb-1 flex items-center justify-between gap-2">
            <label htmlFor="password" className="block text-sm text-stone">
              Password
            </label>
            <button
              type="button"
              onClick={openForgotPassword}
              className="text-sm text-fern underline-offset-4 hover:underline"
            >
              Forgot password?
            </button>
          </div>
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

      <Dialog
        open={forgotOpen}
        onOpenChange={(open) => {
          setForgotOpen(open);
          if (!open) {
            setResetError(null);
            setResetSent(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-bone">Reset your password</DialogTitle>
            <DialogDescription className="text-stone">
              Enter your account email and we&apos;ll send you a link to choose a
              new password.
            </DialogDescription>
          </DialogHeader>
          {resetSent ? (
            <p className="text-sm text-stone" role="status">
              Check your inbox for a reset link. If you don&apos;t see it, try
              your spam folder.
            </p>
          ) : (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              {resetError && (
                <div
                  role="alert"
                  className="rounded-default border border-dried-blood bg-rust-mist/30 px-4 py-3 text-sm text-bone"
                >
                  {resetError}
                </div>
              )}
              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-1 block text-sm text-stone"
                >
                  Email
                </label>
                <Input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" disabled={resetLoading}>
                {resetLoading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
