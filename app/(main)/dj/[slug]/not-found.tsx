import Link from "next/link";

export default function DjNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <h1 className="font-display text-2xl font-bold text-bone">
        DJ not found
      </h1>
      <p className="text-stone">
        This profile doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/events"
        className="text-sm text-fern hover:underline"
      >
        Browse events instead
      </Link>
    </div>
  );
}
