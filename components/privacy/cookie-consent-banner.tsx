"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  defaultConsent,
  getConsentFromCookie,
  setConsentCookie,
  type CookieConsent,
} from "@/lib/privacy/cookie-consent";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

type BannerMode = "banner" | "hidden";

function withUpdatedAt(consent: CookieConsent): CookieConsent {
  return { ...consent, updatedAt: new Date().toISOString() };
}

export function CookieConsentBanner() {
  const existing = useMemo(() => getConsentFromCookie(), []);
  const [mode, setMode] = useState<BannerMode>(existing ? "hidden" : "banner");
  const [open, setOpen] = useState(false);
  const [functional, setFunctional] = useState<boolean>(() => {
    const c = existing ?? defaultConsent();
    return Boolean(c.categories.functional);
  });

  useEffect(() => {
    if (existing) setMode("hidden");
  }, [existing]);

  function saveChoice(nextFunctional: boolean) {
    const next = withUpdatedAt({
      ...(existing ?? defaultConsent()),
      categories: { necessary: true, functional: nextFunctional },
    });
    setConsentCookie(next);
    setFunctional(nextFunctional);
    setMode("hidden");
    setOpen(false);
  }

  if (mode === "hidden") return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-mb-border-hair bg-mb-surface-0/95 supports-backdrop-filter:backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[900px] flex-col gap-3 px-6 py-4 text-sm text-mb-text-secondary md:flex-row md:items-center md:justify-between md:px-10">
          <div className="space-y-1">
            <p className="font-medium text-mb-text-primary">Cookie preferences</p>
            <p className="text-xs leading-5 text-mb-text-tertiary">
              We use strictly necessary cookies to run Mirrorball. You can also
              allow optional functional cookies.
            </p>
            <p className="text-xs text-mb-text-tertiary">
              <Link href="/cookie-preferences" className="underline underline-offset-4">
                Cookie Preferences
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => saveChoice(false)}>
              Reject optional
            </Button>
            <Button variant="outline" onClick={() => setOpen(true)}>
              Manage
            </Button>
            <Button onClick={() => saveChoice(true)}>Accept</Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md pr-10 pt-6">
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Strictly necessary cookies are always on. Functional cookies are
              optional and can be changed anytime.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 rounded-default border border-mb-border-hair bg-mb-surface-1 p-4">
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

            <div className="flex items-start justify-between gap-4 rounded-default border border-mb-border-hair bg-mb-surface-1 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-mb-text-primary">
                  Functional
                </p>
                <p className="text-xs text-mb-text-tertiary">
                  Optional preferences that improve convenience (default off).
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

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFunctional(false);
                saveChoice(false);
              }}
            >
              Reject optional
            </Button>
            <Button onClick={() => saveChoice(functional)}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

