import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/home");
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
      <h1 className="font-display text-4xl font-bold tracking-wide">
        Anastomosis
      </h1>
      <h3 className="font-display text-2xl font-bold tracking-wide">
        When separate hyphae fuse together to share resources
      </h3>
      <p className="max-w-md text-center text-stone">
        A grassroots DJ networking platform. Connect, share, and elevate.
      </p>
      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-default bg-fern px-6 py-2.5 text-sm font-medium text-bone transition-colors hover:bg-living-fern"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="rounded-default border border-root-line px-6 py-2.5 text-sm font-medium text-stone transition-colors hover:border-sage-edge hover:text-bone"
        >
          Log In
        </Link>
      </div>
    </main>
  );
}
