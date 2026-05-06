"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { CurrentUser } from "@/hooks/use-current-user";
import { LogOut, Pencil, User } from "lucide-react";

interface AvatarDropdownProps {
  user: CurrentUser;
  /** First-time tour anchor (desktop navbar only; mobile uses the Me tab). */
  ftueAnchor?: string;
}

export function AvatarDropdown({ user, ftueAnchor }: AvatarDropdownProps) {
  const router = useRouter();

  const initials =
    user.displayName
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase() || "MB";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-ftue={ftueAnchor}
        className="flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-mb-turquoise-pale outline-none ring-0 transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid/70"
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <Avatar
            size="lg"
            className="size-10 shrink-0 border-0 shadow-none ring-0 after:hidden"
          >
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        ) : (
          <User className="size-7 shrink-0" aria-hidden />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-bone">
            <span className="block text-sm font-medium normal-case">
              {user.displayName}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="text-bone focus:bg-root-line focus:text-bone"
            onClick={() => router.push("/profile/edit")}
          >
            <Pencil className="size-4" />
            Edit profile
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
