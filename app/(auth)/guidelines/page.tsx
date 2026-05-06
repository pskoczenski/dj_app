import { LegalPage } from "@/components/shared/legal-page";

export const metadata = {
  title: "Community Guidelines",
};

export default function GuidelinesPage() {
  return (
    <LegalPage title="Community Guidelines" lastUpdated="2026-05-06">
      <p>
        Mirrorball is for real people in local scenes. These Guidelines explain
        what’s allowed and what isn’t.
      </p>

      <h2 id="be-respectful">Be respectful</h2>
      <ul>
        <li>No harassment, hate, or targeted abuse.</li>
        <li>No threats of violence or encouragement of self-harm.</li>
      </ul>

      <h2 id="no-impersonation">No impersonation</h2>
      <p>
        Don’t pretend to be someone else, including artists, venues, promoters,
        or brands. Don’t mislead people about affiliations.
      </p>

      <h2 id="no-doxxing">No doxxing or privacy violations</h2>
      <p>
        Don’t share someone’s private information without consent (including
        addresses, phone numbers, legal names, or private messages).
      </p>

      <h2 id="no-illegal-content">No illegal content</h2>
      <p>
        Don’t use Mirrorball to promote illegal activity, distribute illegal
        content, or share content that infringes copyright.
      </p>

      <h2 id="no-spam">No spam or manipulation</h2>
      <ul>
        <li>No bulk unsolicited messages.</li>
        <li>No scams, phishing, or deceptive links.</li>
        <li>No attempts to game discovery or engagement.</li>
      </ul>

      <h2 id="enforcement">Enforcement</h2>
      <p>
        We may remove content or restrict accounts that violate these
        Guidelines. If you think something violates these rules, contact us.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Report safety concerns at{" "}
        <a href="mailto:support@mirrorball.social">support@mirrorball.social</a>.
      </p>
    </LegalPage>
  );
}

