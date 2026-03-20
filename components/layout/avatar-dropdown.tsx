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
import { LogOut, User, Pencil, CalendarPlus } from "lucide-react";

interface AvatarDropdownProps {
  user: CurrentUser;
}

export function AvatarDropdown({ user }: AvatarDropdownProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  const initials = user.displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-fern"
        aria-label="User menu"
      >
        <Avatar className="size-8">
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.displayName} />}
          <AvatarFallback className="bg-forest-shadow text-xs text-bone">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block font-medium text-bone">{user.displayName}</span>
            <span className="block text-xs text-fog">@{user.slug}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(`/dj/${user.slug}`)}>
            <User className="size-4" />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/profile/edit")}>
            <Pencil className="size-4" />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/events/create")}>
            <CalendarPlus className="size-4" />
            Create Event
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="size-4" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
