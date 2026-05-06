import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Avoid static prerender quirks for credential POST flows on the edge network. */
export const dynamic = "force-dynamic";

export default function ComingSoonPage(props: {
  searchParams?: { next?: string; error?: string };
}) {
  const searchParams = props.searchParams ?? {};
  const next = typeof searchParams.next === "string" ? searchParams.next : "";
  const hasError = searchParams.error === "1";

  return (
    <main className="flex min-h-[calc(100vh-0px)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="mb-2 font-display text-3xl font-bold tracking-wide text-bone">
          Mirrorball
        </h1>
        <p className="mb-6 text-sm text-stone">
          We’re in a private compliance rollout. Enter the password to continue.
        </p>

        {hasError && (
          <div
            role="alert"
            className="mb-4 rounded-default border border-dried-blood bg-rust-mist/30 px-4 py-3 text-sm text-bone"
          >
            That password didn’t work. Please try again.
          </div>
        )}

        <form
          method="post"
          action="/api/coming-soon/unlock"
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="next" value={next} />

          <div>
            <label
              htmlFor="coming-soon-password"
              className="mb-1 block text-sm text-stone"
            >
              Password
            </label>
            <Input
              id="coming-soon-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            className={cn(buttonVariants({ variant: "default" }), "w-full")}
          >
            Enter
          </button>
        </form>

        <p className="mt-6 text-xs text-fog">
          If you believe you should have access, contact the team.
        </p>

        <div className="mt-8 flex items-center justify-between text-xs text-stone">
          <Link
            href="/"
            prefetch={false}
            className="underline underline-offset-2"
          >
            Back to home
          </Link>
          <form method="post" action="/api/coming-soon/lock">
            <button type="submit" className="underline underline-offset-2">
              Lock again
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

