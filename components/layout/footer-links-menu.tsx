"use client";

import { useRouter } from "next/navigation";
import { Menu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SITE_FOOTER_LINKS } from "@/components/layout/site-footer";

export function FooterLinksMenu({
  align = "end",
  icon = "gear",
  className,
}: {
  align?: "start" | "end";
  icon?: "gear" | "hamburger";
  className?: string;
}) {
  const router = useRouter();
  const Icon = icon === "hamburger" ? Menu : Settings;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "rounded-md p-2 text-mb-text-secondary transition-colors hover:text-mb-text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-0",
          className,
        )}
        aria-label="Site links"
      >
        <Icon className="size-5" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align={align} sideOffset={8} className="w-56">
        <DropdownMenuLabel className="text-bone">
          Site links
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SITE_FOOTER_LINKS.map((link) => (
          <DropdownMenuItem
            key={link.href}
            className="text-bone focus:bg-root-line focus:text-bone"
            onClick={() => router.push(link.href)}
          >
            {link.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

