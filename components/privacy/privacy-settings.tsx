"use client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePrivacyActions } from "@/hooks/use-privacy-actions";

export function PrivacySettings() {
  const { exportMyData, deleteMyAccount, exporting, deleting } =
    usePrivacyActions();

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="font-display text-xl font-medium text-mb-text-primary">
          Data export
        </h2>
        <p className="text-sm text-mb-text-tertiary">
          Download a JSON export of your Mirrorball data.
        </p>
        <Button onClick={exportMyData} disabled={exporting || deleting}>
          {exporting ? "Preparing download…" : "Download my data"}
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-medium text-mb-text-primary">
          Account deletion
        </h2>
        <p className="text-sm text-mb-text-tertiary">
          This will deactivate your profile and remove your access. Your content
          may no longer be visible depending on current visibility rules.
        </p>

        <ConfirmDialog
          title="Delete your account?"
          description="This action will deactivate your profile and sign you out."
          confirmLabel={deleting ? "Deleting…" : "Delete account"}
          variant="destructive"
          onConfirm={deleteMyAccount}
          triggerVariant="destructive"
          triggerDisabled={exporting || deleting}
          trigger={
            "Delete my account"
          }
        />
      </section>
    </div>
  );
}

