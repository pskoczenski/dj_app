import { LegalPage } from "@/components/shared/legal-page";

export const metadata = {
  title: "Accessibility Statement",
};

export default function AccessibilityPage() {
  return (
    <LegalPage title="Accessibility Statement" lastUpdated="2026-05-06">
      <p>
        Mirrorball is committed to providing an accessible experience for people
        of all abilities. We aim to meet WCAG 2.1 AA where reasonably possible.
      </p>

      <h2 id="support">Accessibility support</h2>
      <p>
        If you experience any difficulty using Mirrorball, please email{" "}
        <a href="mailto:accessibility@mirrorball.social">
          accessibility@mirrorball.social
        </a>{" "}
        and include:
      </p>
      <ul>
        <li>The page URL</li>
        <li>What you were trying to do</li>
        <li>Your device and browser</li>
        <li>Any assistive technology you use (optional)</li>
      </ul>

      <h2 id="known-limitations">Known limitations</h2>
      <p>
        Mirrorball includes user-generated content and third-party embeds, which
        may not always be fully accessible. We welcome reports so we can improve
        the experience.
      </p>

      <h2 id="last-updated">Last updated</h2>
      <p>2026-05-06</p>
    </LegalPage>
  );
}

