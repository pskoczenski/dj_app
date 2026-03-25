"use client";

import { Navbar } from "@/components/layout/navbar";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { PageContainer } from "@/components/layout/page-container";
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
      <MobileTopBar user={user} />
      <PageContainer as="main" className="flex-1 py-6 pb-20 md:pb-6">
        {children}
      </PageContainer>
      <MobileTabBar user={user} />
    </div>
  );
}
