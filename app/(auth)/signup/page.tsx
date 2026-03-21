"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileForUser } from "@/lib/auth/profile-bootstrap";
import type { ProfileType } from "@/types";

const PROFILE_TYPES: { value: ProfileType; label: string }[] = [
  { value: "dj", label: "DJ" },
  { value: "promoter", label: "Promoter" },
  { value: "fan", label: "Fan" },
];

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profileType, setProfileType] = useState<ProfileType>("dj");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          profile_type: profileType,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError("Signup succeeded but no user ID was returned.");
      setLoading(false);
      return;
    }

    if (authData.session) {
      try {
        await ensureProfileForUser({
          userId,
          displayName,
          profileType,
        });
      } catch (profileError) {
        setError(
          profileError instanceof Error
            ? profileError.message
            : "Could not create profile."
        );
        setLoading(false);
        return;
      }
      router.push("/home");
      return;
    }

    // Email-confirm flows typically do not return a session yet.
    router.push("/login?created=1");
  }

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-wide text-bone">
        Create Account
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
          <label
            htmlFor="displayName"
            className="mb-1 block text-sm text-stone"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            required
            minLength={2}
            maxLength={50}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11 w-full rounded-default border border-root-line bg-dark-moss px-4 text-bone placeholder:text-fog focus:border-fern"
            placeholder="DJ Shadow"
          />
        </div>

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-default border border-root-line bg-dark-moss px-4 text-bone placeholder:text-fog focus:border-fern"
            placeholder="••••••••"
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-sm text-stone">I am a…</legend>
          <div className="flex gap-4">
            {PROFILE_TYPES.map(({ value, label }) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 text-sm text-bone"
              >
                <input
                  type="radio"
                  name="profileType"
                  value={value}
                  checked={profileType === value}
                  onChange={() => setProfileType(value)}
                  className="accent-fern"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-default bg-fern font-body text-sm font-medium text-bone transition-colors duration-150 hover:bg-living-fern disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone">
        Already have an account?{" "}
        <Link href="/login" className="text-fern hover:text-living-fern">
          Log in
        </Link>
      </p>
    </>
  );
}
