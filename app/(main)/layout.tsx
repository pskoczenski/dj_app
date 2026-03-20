"use client";

import { Navbar } from "@/components/layout/navbar";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { useCurrentUser } from "@/hooks/use-current-user";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      <MobileTopBar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileTabBar user={user} />
    </div>
  );
}
