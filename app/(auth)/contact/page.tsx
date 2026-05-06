import { LegalPage } from "@/components/shared/legal-page";

export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact" lastUpdated="2026-05-06">
      <p>
        Need help, want to report an issue, or have a legal request? Email us
        and we’ll respond as soon as we can.
      </p>

      <h2 id="support">Support</h2>
      <p>
        <a href="mailto:support@mirrorball.social">support@mirrorball.social</a>
      </p>
      <p className="text-sm">
        Typical response time: 1–3 business days.
      </p>

      <h2 id="legal">Legal</h2>
      <p>
        <a href="mailto:legal@mirrorball.social">legal@mirrorball.social</a>
      </p>

      <h2 id="copyright">DMCA / Copyright</h2>
      <p>
        For copyright notices, use{" "}
        <a href="mailto:dmca@mirrorball.social">dmca@mirrorball.social</a> or see
        the <a href="/dmca">DMCA page</a>.
      </p>
    </LegalPage>
  );
}

