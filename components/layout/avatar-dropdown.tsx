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
}

export function AvatarDropdown({ user }: AvatarDropdownProps) {
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
        className="flex size-11 cursor-pointer items-center justify-center rounded-full text-stone outline-none transition-colors hover:bg-root-line/60 hover:text-bone focus-visible:ring-2 focus-visible:ring-fern"
        aria-label="User menu"
      >
        <User className="size-" aria-hidden />
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
