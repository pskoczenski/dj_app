import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <main className="flex-1 bg-mb-surface-0 text-mb-text-primary">
      <div className="mx-auto w-full max-w-[900px] px-6 pb-16 pt-14 md:px-10 md:pt-20">
        <header className="space-y-3">
          <h1 className="font-display text-[30px] font-medium leading-[1.12] tracking-[-0.015em] md:text-[40px]">
            {title}
          </h1>
          <p className="text-sm text-mb-text-tertiary">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="prose prose-invert mt-10 max-w-none text-mb-text-secondary prose-headings:scroll-mt-24 prose-headings:font-display prose-headings:font-medium prose-headings:text-mb-text-primary prose-a:text-mb-accent-moss prose-a:no-underline hover:prose-a:underline prose-strong:text-mb-text-primary">
          {children}
        </div>
      </div>
    </main>
  );
}

