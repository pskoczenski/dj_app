"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import type { Profile } from "@/types";
import { profilesService } from "@/lib/services/profiles";
import { getFtueSteps } from "@/lib/onboarding/ftue-steps";
import { waitForVisibleFtueAnchor } from "@/lib/onboarding/ftue-dom";

type FtueTourProps = {
  profile: Profile | null;
  userLoading: boolean;
  refetch: () => Promise<void> | void;
};

export function FtueTour({ profile, userLoading, refetch }: FtueTourProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [tourActive, setTourActive] = useState(false);
  /** Bumps when the user moves to the next FTUE step (same-route steps). */
  const [stepAdvanceKey, setStepAdvanceKey] = useState(0);

  const stepIndexRef = useRef(0);
  const stepsRef = useRef<ReturnType<typeof getFtueSteps>>([]);
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const tourActiveRef = useRef(false);
  const completingRef = useRef(false);

  useEffect(() => {
    tourActiveRef.current = tourActive;
  }, [tourActive]);

  const completeTour = useCallback(async () => {
    if (completingRef.current || !profile?.id) return;
    completingRef.current = true;
    driverRef.current?.destroy();
    driverRef.current = null;
    setTourActive(false);
    try {
      await profilesService.update(profile.id, {
        ftue_completed_at: new Date().toISOString(),
      });
      await refetch();
    } catch (e) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[FTUE] Failed to persist completion", e);
      }
    } finally {
      completingRef.current = false;
    }
  }, [profile, refetch]);

  const advanceTour = useCallback(() => {
    stepIndexRef.current += 1;
    setStepAdvanceKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (userLoading || !profile || profile.ftue_completed_at) return;
    if (tourActive) return;
    stepsRef.current = getFtueSteps(
      typeof window !== "undefined" &&
        window.matchMedia("(max-width: 767px)").matches,
    );
    stepIndexRef.current = 0;
    startTransition(() => {
      setTourActive(true);
    });
  }, [userLoading, profile, tourActive]);

  useEffect(() => {
    if (!tourActive || !profile?.id || profile.ftue_completed_at) return;

    const steps = stepsRef.current;
    if (steps.length === 0) return;

    const i = stepIndexRef.current;
    if (i >= steps.length) {
      void completeTour();
      return;
    }

    const step = steps[i];
    if (pathname !== step.path) {
      driverRef.current?.destroy();
      driverRef.current = null;
      router.push(step.path);
      return;
    }

    let cancelled = false;

    void waitForVisibleFtueAnchor(step.anchor).then((el) => {
      if (cancelled || !tourActiveRef.current) return;
      if (!el) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[FTUE] Missing anchor, ending tour:", step.anchor);
        }
        void completeTour();
        return;
      }

      driverRef.current?.destroy();

      const total = steps.length;
      const current = i + 1;
      const isLast = i === total - 1;

      const d = driver({
        animate: true,
        allowClose: true,
        overlayOpacity: 0.75,
        stageRadius: 8,
        popoverClass: "ftue-driver-popover",
        onCloseClick: (_element, _step, { driver: drv }) => {
          drv.destroy();
          void completeTour();
        },
      });

      d.highlight({
        element: el,
        popover: {
          title: step.title,
          description: step.description,
          showButtons: isLast ? ["next", "close"] : ["next", "close"],
          nextBtnText: isLast ? "Done" : "Next",
          progressText: `${current} / ${total}`,
          onNextClick: (_element, _step, { driver: drv }) => {
            drv.destroy();
            if (isLast) {
              void completeTour();
            } else {
              advanceTour();
            }
          },
          onCloseClick: (_element, _step, { driver: drv }) => {
            drv.destroy();
            void completeTour();
          },
        },
      });

      driverRef.current = d;
    });

    return () => {
      cancelled = true;
      driverRef.current?.destroy();
      driverRef.current = null;
    };
  }, [
    pathname,
    tourActive,
    stepAdvanceKey,
    profile?.id,
    profile?.ftue_completed_at,
    advanceTour,
    completeTour,
    router,
  ]);

  return null;
}
