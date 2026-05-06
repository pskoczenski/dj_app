import { PrivacySettings } from "@/components/privacy/privacy-settings";

export const metadata = {
  title: "Privacy settings",
};

export default function PrivacySettingsPage() {
  return (
    <div className="bg-mb-surface-0 text-mb-text-primary">
      <div className="mx-auto w-full max-w-[900px] px-6 pb-16 pt-10 md:px-10">
        <header className="space-y-2">
          <h1 className="font-display text-2xl font-medium">Privacy</h1>
          <p className="text-sm text-mb-text-tertiary">
            Export your data or delete your account.
          </p>
        </header>

        <div className="mt-10">
          <PrivacySettings />
        </div>
      </div>
    </div>
  );
}

