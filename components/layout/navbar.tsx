"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarDropdown } from "./avatar-dropdown";
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

  return (
    <header className="hidden border-b border-root-line bg-dark-moss md:block">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/home"
          className="mr-2 font-display text-lg font-bold tracking-wide text-bone"
        >
          DJ Network
        </Link>

        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "text-bone underline decoration-fern decoration-2 underline-offset-8"
                  : "text-stone hover:text-bone",
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-md p-2 text-stone transition-colors hover:text-bone"
          >
            <Search className="size-5" />
          </Link>

          {user && <AvatarDropdown user={user} />}
        </div>
      </nav>
    </header>
  );
}
