import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Wordmark } from "@/components/layout/wordmark";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen flex-col bg-mb-surface-0 text-mb-text-primary">
      <nav
        className="flex items-center justify-between border-b border-mb-border-hair px-6 py-5 md:px-10 md:py-[18px]"
        aria-label="Site"
      >
        <Link href="/" className="shrink-0 focus-visible:outline-none">
          <Wordmark className="text-sm" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Sign up
          </Link>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[900px] flex-1 px-6 pb-12 pt-20 md:px-10 md:pt-[140px]">
        <h1 className="max-w-[780px] font-display text-[36px] font-medium leading-[1.1] tracking-[-0.015em] text-mb-text-primary md:text-[52px]">
          A home for the people keeping the dance floor honest.
        </h1>

        <div className="mt-10 max-w-[600px] space-y-5 text-base leading-[1.75] text-mb-text-secondary md:text-[17px]">
          <p>
            Mirrorball is where local scenes find each other — the DJs, the
            organizers, the regulars. Discover the night you might have missed,
            the mix nobody sent you, the opener worth showing up early for.
          </p>
          <p>Built for the scene by the people in it.</p>
        </div>

        <div className="mt-14 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Create an account
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Login
          </Link>
        </div>
      </main>

      <footer className="mx-auto mt-auto w-full max-w-[900px] px-6 pb-10 pt-32 md:px-10 md:pt-[200px]">
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-mb-text-tertiary">
          <Wordmark className="text-xs" />
          <span>&copy; Mirrorball</span>
        </p>
      </footer>
    </div>
  );
}
