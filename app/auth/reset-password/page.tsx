"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [checking, setChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setHasRecoverySession(Boolean(data.session));
      } finally {
        setChecking(false);
      }
    })();

    // When returning from a password recovery link, Supabase emits PASSWORD_RECOVERY.
    const { data } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setHasRecoverySession(Boolean(session));
        }
      },
    );

    return () => data.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!hasRecoverySession) {
      setError(
        "Your reset link is invalid or has expired. Request a new one.",
      );
      return;
    }

    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        setError(updateErr.message);
        return;
      }

      router.push("/login?reset=1");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-2 font-display text-2xl font-bold tracking-wide text-bone">
        Reset Password
      </h1>

      <p className="mb-6 text-sm text-stone">
        Enter your new password. We&apos;ll update it for your account.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-default border border-dried-blood bg-rust-mist/30 px-4 py-3 text-sm text-bone"
        >
          {error}
        </div>
      )}

      {checking ? (
        <p className="text-sm text-fog">Checking your reset link…</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm text-stone"
            >
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-sm text-stone"
            >
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update Password"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-stone">
        Remembered your password?{" "}
        <Link href="/login" className="text-fern hover:text-living-fern">
          Back to Log In
        </Link>
      </p>
    </>
  );
}

