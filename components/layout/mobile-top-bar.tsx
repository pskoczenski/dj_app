"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { AvatarDropdown } from "@/components/layout/avatar-dropdown";
import type { CurrentUser } from "@/hooks/use-current-user";

interface MobileTopBarProps {
  user: CurrentUser | null;
}

export function MobileTopBar({ user }: MobileTopBarProps) {
  return (
    <header className="flex h-12 items-center gap-3 border-b border-root-line bg-dark-moss px-4 md:hidden">
      <Link
        href="/home"
        className="min-w-0 flex-1 truncate font-display text-base font-bold tracking-wide text-bone"
      >
        DJ Network
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <Link
          href="/search"
          aria-label="Search"
          className="rounded-md p-1.5 text-stone transition-colors hover:text-bone"
        >
          <Search className="size-5" />
        </Link>
        {user ? <AvatarDropdown user={user} /> : null}
      </div>
    </header>
  );
}
