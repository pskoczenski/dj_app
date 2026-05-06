"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Sparkle = {
  id: string;
  leftPct: number;
  topPct: number;
  sizeRem: number;
  blurRem: number;
  driftRem: number;
  durationSec: number;
  delaySec: number;
  alpha: number;
};

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function DiscoAmbience({
  className,
  sparkleCount = 24,
}: {
  className?: string;
  sparkleCount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = (x: number, y: number) => {
      el.style.setProperty("--mb-mx", `${x}px`);
      el.style.setProperty("--mb-my", `${y}px`);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => update(x, y));
    };

    // Seed with center so the spotlight isn't stuck top-left.
    const rect = el.getBoundingClientRect();
    update(rect.width / 2, rect.height * 0.3);

    el.addEventListener("pointermove", handlePointerMove);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", handlePointerMove);
    };
  }, [reduced]);

  const sparkles = useMemo<Sparkle[]>(() => {
    const r = mulberry32(42);
    return Array.from({ length: sparkleCount }).map((_, idx) => {
      const leftPct = r() * 100;
      const topPct = r() * 100;
      const sizeRem = 0.2 + r() * 0.55;
      const blurRem = 0.1 + r() * 0.55;
      const driftRem = 0.25 + r() * 1.25;
      const durationSec = 6 + r() * 10;
      const delaySec = -r() * durationSec;
      const alpha = 0.06 + r() * 0.16;
      return {
        // stable key within this component
        id: `sparkle-${idx}`,
        leftPct,
        topPct,
        sizeRem,
        blurRem,
        driftRem,
        durationSec,
        delaySec,
        alpha,
      };
    });
  }, [sparkleCount]);

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {/* Spotlight that gently follows the cursor */}
      <div
        className={cn(
          "absolute inset-0 opacity-70 transition-opacity duration-300",
          reduced && "opacity-0",
        )}
        style={{
          background:
            "radial-gradient(48rem 32rem at var(--mb-mx, 50%) var(--mb-my, 30%), rgba(90, 226, 255, 0.10), transparent 60%)",
        }}
      />

      {/* Subtle disco “sparkles” / dust motes */}
      {!reduced ? (
        <div className="absolute inset-0">
          {sparkles.map((s) => (
            <span
              key={s.id}
              className="absolute rounded-full"
              style={{
                left: `${s.leftPct}%`,
                top: `${s.topPct}%`,
                width: `${s.sizeRem}rem`,
                height: `${s.sizeRem}rem`,
                filter: `blur(${s.blurRem}rem)`,
                background:
                  "radial-gradient(circle, rgba(214, 249, 255, 1) 0%, rgba(214, 249, 255, 0) 68%)",
                opacity: s.alpha,
                transform: "translate3d(0,0,0)",
                animation: `mb-sparkle-float ${s.durationSec}s ease-in-out ${s.delaySec}s infinite`,
                // unique drift per mote
                ["--mb-drift" as string]: `${s.driftRem}rem`,
                ["--mb-alpha" as string]: String(s.alpha),
              }}
            />
          ))}
        </div>
      ) : null}

      <style jsx>{`
        @keyframes mb-sparkle-float {
          0% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
          22% {
            opacity: var(--mb-alpha, 0.14);
          }
          50% {
            transform: translate3d(
              calc(var(--mb-drift) * 0.55),
              calc(var(--mb-drift) * -0.75),
              0
            );
            opacity: 0.22;
          }
          78% {
            opacity: var(--mb-alpha, 0.14);
          }
          100% {
            transform: translate3d(0, 0, 0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

