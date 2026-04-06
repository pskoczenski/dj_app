"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/use-unread-count";
import { AvatarDropdown } from "./avatar-dropdown";
import { LocationIndicator } from "./location-indicator";
import { Wordmark } from "./wordmark";
import type { CurrentUser } from "@/hooks/use-current-user";

const NAV_LINKS = [
  { href: "/home", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/mixes", label: "Mixes" },
] as const;

interface NavbarProps {
  user: CurrentUser | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const { count: unread } = useUnreadCount();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-mb-border-hair bg-mb-surface-0 md:block">
      <nav className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-[18px] md:px-10">
        <Link href="/home" className="shrink-0">
          <Wordmark className="text-sm" />
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "text-mb-text-primary underline decoration-mb-turquoise-mid decoration-2 underline-offset-8"
                  : "text-mb-text-secondary hover:text-mb-text-primary",
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <LocationIndicator />
          <Link
            href="/messages"
            aria-label="Messages"
            className="relative rounded-md p-2 text-mb-text-secondary transition-colors hover:text-mb-text-primary"
          >
            <MessageCircle className="size-5" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 rounded-full bg-mb-turquoise-deep px-1 text-[10px] leading-4 text-mb-turquoise-ice">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-md p-2 text-mb-text-secondary transition-colors hover:text-mb-text-primary"
          >
            <Search className="size-5" />
          </Link>
          {user ? <AvatarDropdown user={user} /> : null}
        </div>
      </nav>
    </header>
  );
}
