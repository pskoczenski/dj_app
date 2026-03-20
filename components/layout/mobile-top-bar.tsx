"use client";

import Link from "next/link";
import { Search } from "lucide-react";

export function MobileTopBar() {
  return (
    <header className="flex h-12 items-center justify-between border-b border-root-line bg-dark-moss px-4 md:hidden">
      <Link
        href="/home"
        className="font-display text-base font-bold tracking-wide text-bone"
      >
        DJ Network
      </Link>
      <Link
        href="/search"
        aria-label="Search"
        className="rounded-md p-1.5 text-stone transition-colors hover:text-bone"
      >
        <Search className="size-5" />
      </Link>
    </header>
  );
}
