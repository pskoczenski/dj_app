import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";

type FooterLink = { href: string; label: string };
type SiteFooterVariant = "public" | "auth";

const FOOTER_LINKS: FooterLink[] = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/guidelines", label: "Guidelines" },
  { href: "/dmca", label: "DMCA" },
  { href: "/contact", label: "Contact" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/cookie-preferences", label: "Cookie Preferences" },
];

export function SiteFooter({ variant = "public" }: { variant?: SiteFooterVariant }) {
  const year = new Date().getFullYear();

  const wrapperClasses =
    variant === "auth"
      ? "border-t border-root-line bg-deep-loam"
      : "border-t border-mb-border-hair bg-mb-surface-0";
  const textClasses =
    variant === "auth" ? "text-stone" : "text-mb-text-tertiary";
  const hoverTextClasses =
    variant === "auth" ? "hover:text-bone" : "hover:text-mb-text-secondary";
  const focusRingClasses =
    variant === "auth"
      ? "focus-visible:ring-2 focus-visible:ring-fern focus-visible:ring-offset-2 focus-visible:ring-offset-deep-loam"
      : "focus-visible:ring-2 focus-visible:ring-mb-turquoise-mid/50 focus-visible:ring-offset-2 focus-visible:ring-offset-mb-surface-0";

  return (
    <footer className={wrapperClasses}>
      <div className="mx-auto w-full max-w-[900px] px-6 py-10 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <p className={`flex flex-wrap items-center gap-x-2 text-xs ${textClasses}`}>
            <Wordmark className="text-xs" />
            <span>&copy; {year} Mirrorball</span>
          </p>

          <nav aria-label="Footer">
            <ul className={`flex flex-wrap gap-x-4 gap-y-2 text-xs ${textClasses}`}>
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`underline-offset-4 hover:underline focus-visible:outline-none ${hoverTextClasses} ${focusRingClasses}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

