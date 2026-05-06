"use client";

import { Navbar } from "@/components/layout/navbar";
import { MobileTopBar } from "@/components/layout/mobile-top-bar";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { PageContainer } from "@/components/layout/page-container";
import { SiteFooter } from "@/components/layout/site-footer";
import { FtueTour } from "@/components/onboarding/ftue-tour";
import { MessagingInboxProvider } from "@/hooks/messaging-inbox-provider";
import { useCurrentUser } from "@/hooks/use-current-user";

export function MainLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: userLoading, refetch } = useCurrentUser();

  return (
    <MessagingInboxProvider userId={user?.id} userLoading={userLoading}>
      <FtueTour
        profile={profile}
        userLoading={userLoading}
        refetch={refetch}
      />
      <div className="flex min-h-screen flex-col">
        <Navbar user={user} />
        <MobileTopBar user={user} />
        <PageContainer as="main" className="flex-1 py-8 pb-24 md:pb-8">
          {children}
        </PageContainer>
        {/* On mobile, footer would be obscured by the fixed tab bar. */}
        <div className="hidden md:block">
          <SiteFooter />
        </div>
        <MobileTabBar user={user} />
      </div>
    </MessagingInboxProvider>
  );
}
