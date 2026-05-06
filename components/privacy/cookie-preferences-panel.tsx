"use client";

import { useEffect, useState } from "react";
import {
  defaultConsent,
  getConsentFromCookie,
  setConsentCookie,
  type CookieConsent,
} from "@/lib/privacy/cookie-consent";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

function withUpdatedAt(consent: CookieConsent): CookieConsent {
  return { ...consent, updatedAt: new Date().toISOString() };
}

export function CookiePreferencesPanel() {
  const [loading, setLoading] = useState(true);
  const [functional, setFunctional] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const existing = getConsentFromCookie();
    const c = existing ?? defaultConsent();
    setFunctional(Boolean(c.categories.functional));
    setSavedAt(existing?.updatedAt ?? null);
    setLoading(false);
  }, []);

  function save(nextFunctional: boolean) {
    const existing = getConsentFromCookie();
    const next = withUpdatedAt({
      ...(existing ?? defaultConsent()),
      categories: { necessary: true, functional: nextFunctional },
    });
    setConsentCookie(next);
    setFunctional(nextFunctional);
    setSavedAt(next.updatedAt);
  }

  if (loading) {
    return <p className="text-sm text-mb-text-tertiary">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-xl font-medium text-mb-text-primary">
          Categories
        </h2>
        <p className="text-sm text-mb-text-tertiary">
          Strictly necessary cookies are always enabled. Functional cookies are
          optional.
        </p>
        {savedAt && (
          <p className="text-xs text-mb-text-tertiary">Last saved: {savedAt}</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="rounded-default border border-mb-border-hair bg-mb-surface-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-mb-text-primary">
                Strictly necessary
              </p>
              <p className="text-xs text-mb-text-tertiary">
                Required for sign-in, security, and core site features.
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-mb-text-tertiary">
              Always on
            </span>
          </div>
        </div>

        <div className="rounded-default border border-mb-border-hair bg-mb-surface-1 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-mb-text-primary">
                Functional
              </p>
              <p className="text-xs text-mb-text-tertiary">
                Optional preferences that improve convenience.
              </p>
            </div>
            <label className="flex shrink-0 items-center gap-2 text-xs text-mb-text-tertiary">
              <Checkbox
                checked={functional}
                onCheckedChange={(checked) => setFunctional(Boolean(checked))}
                aria-label="Functional cookies"
              />
              Allow
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => save(false)}>
          Reject optional
        </Button>
        <Button onClick={() => save(functional)}>Save preferences</Button>
      </div>
    </div>
  );
}

