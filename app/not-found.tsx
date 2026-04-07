import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <h1 className="font-display text-3xl font-bold text-bone">404</h1>
      <p className="text-stone">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link
        href="/"
        className="rounded-default bg-fern px-5 py-2 text-sm font-medium text-bone transition-colors hover:bg-living-fern"
      >
        Back to home
      </Link>
    </main>
  );
}
