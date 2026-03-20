"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Disc3, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickCreateMenu } from "./quick-create-menu";
import type { CurrentUser } from "@/hooks/use-current-user";

interface MobileTabBarProps {
  user: CurrentUser | null;
}

const iconClass = "size-5";

export function MobileTabBar({ user }: MobileTabBarProps) {
  const pathname = usePathname();

  const profileHref = user ? `/dj/${user.slug}` : "/login";

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-root-line bg-dark-moss md:hidden"
    >
      <TabLink href="/home" label="Home" active={isActive("/home")}>
        <Home className={iconClass} />
      </TabLink>

      <TabLink href="/events" label="Events" active={isActive("/events")}>
        <CalendarDays className={iconClass} />
      </TabLink>

      <QuickCreateMenu />

      <TabLink href="/mixes" label="Mixes" active={isActive("/mixes")}>
        <Disc3 className={iconClass} />
      </TabLink>

      <TabLink href={profileHref} label="Me" active={isActive("/dj/")}>
        <UserCircle className={iconClass} />
      </TabLink>
    </nav>
  );
}

function TabLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex flex-col items-center gap-0.5 text-[10px]",
        active ? "text-fern" : "text-stone",
      )}
    >
      {children}
      <span>{label}</span>
    </Link>
  );
}
