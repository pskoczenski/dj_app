"use client";

/**
 * Decorative typing animation after “Name is typing”. Hidden when the user prefers reduced motion.
 */
export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 pl-0.5" aria-hidden>
      <span className="motion-reduce:hidden inline-flex items-center gap-0.5">
        {[0, 120, 240].map((delay) => (
          <span
            key={delay}
            className="animate-typing-dot inline-block h-1 w-1 rounded-full bg-fog"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      <span className="hidden text-fog motion-reduce:inline">…</span>
    </span>
  );
}
