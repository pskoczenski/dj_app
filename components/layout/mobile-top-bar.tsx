"use client";

import Link from "next/link";
import { MessageCircle, Search } from "lucide-react";
import { AvatarDropdown } from "@/components/layout/avatar-dropdown";
import { LocationIndicator } from "@/components/layout/location-indicator";
import { Wordmark } from "@/components/layout/wordmark";
import type { CurrentUser } from "@/hooks/use-current-user";

interface MobileTopBarProps {
  user: CurrentUser | null;
}

export function MobileTopBar({ user }: MobileTopBarProps) {
  return (
    <header className="sticky top-0 z-40 flex min-h-12 items-center gap-3 border-b border-mb-border-hair bg-mb-surface-0 px-4 py-2 md:hidden">
      <Link href="/home" className="min-w-0 flex-1 truncate">
        <Wordmark className="text-sm" />
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <LocationIndicator />
        <Link
          href="/messages"
          data-ftue="ftue-messages"
          aria-label="Messages"
          className="relative rounded-md p-1.5 text-mb-text-secondary transition-colors hover:text-mb-text-primary"
        >
          <MessageCircle className="size-5" />
        </Link>
        <Link
          href="/search"
          data-ftue="ftue-search"
          aria-label="Search"
          className="rounded-md p-1.5 text-mb-text-secondary transition-colors hover:text-mb-text-primary"
        >
          <Search className="size-5" />
        </Link>
        {user ? <AvatarDropdown user={user} /> : null}
      </div>
    </header>
  );
}
