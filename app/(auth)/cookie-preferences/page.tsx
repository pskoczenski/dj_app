import { CookiePreferencesPanel } from "@/components/privacy/cookie-preferences-panel";

export const metadata = {
  title: "Cookie Preferences",
};

export default function CookiePreferencesPage() {
  return (
    <main className="flex-1 bg-mb-surface-0 text-mb-text-primary">
      <div className="mx-auto w-full max-w-[900px] px-6 pb-16 pt-14 md:px-10 md:pt-20">
        <header className="space-y-3">
          <h1 className="font-display text-[30px] font-medium leading-[1.12] tracking-[-0.015em] md:text-[40px]">
            Cookie Preferences
          </h1>
          <p className="text-sm text-mb-text-tertiary">
            Mirrorball uses no ads and no analytics. You can control optional
            functional cookies here.
          </p>
        </header>

        <div className="mt-10">
          <CookiePreferencesPanel />
        </div>
      </div>
    </main>
  );
}

