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
        className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-mb-border-soft bg-mb-surface-3 text-mb-turquoise-pale outline-none transition-colors hover:bg-mb-surface-3 hover:text-mb-text-primary focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid"
        aria-label="User menu"
      >
        <User className="size-4" aria-hidden />
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
