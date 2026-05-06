import { LegalPage } from "@/components/shared/legal-page";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="2026-05-06">
      <p>
        Mirrorball is a community app for DJs, promoters, venues, and fans. This
        policy explains what we collect, why we collect it, and your choices.
      </p>

      <h2 id="information-we-collect">Information we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong>: email address, authentication details,
          and basic account identifiers.
        </li>
        <li>
          <strong>Profile data</strong>: display name, bio, avatar image, city,
          genres, and optional links you add.
        </li>
        <li>
          <strong>User-generated content</strong>: events, mixes/links, messages,
          and comments you create.
        </li>
        <li>
          <strong>Usage and device data</strong>: basic logs needed to operate
          and secure the service (for example: IP address, timestamps, and
          request metadata).
        </li>
      </ul>

      <h2 id="how-we-use-information">How we use information</h2>
      <ul>
        <li>Provide the service (accounts, profiles, and content features).</li>
        <li>Maintain safety, prevent abuse, and enforce our rules.</li>
        <li>Diagnose bugs, improve reliability, and monitor performance.</li>
        <li>Communicate with you about support and important service updates.</li>
      </ul>

      <h2 id="cookies-and-analytics">Cookies and analytics</h2>
      <p>
        Mirrorball uses cookies and similar technologies that are necessary to
        keep you signed in and keep the service working. We do not run ad tech.
        We do not sell your personal information.
      </p>

      <h2 id="sharing">How we share information</h2>
      <p>
        We share information only as needed to run Mirrorball, comply with law,
        and protect our users.
      </p>
      <ul>
        <li>
          <strong>Service providers</strong>: we use providers to host and
          operate Mirrorball (for example, Supabase for database/auth/storage
          and Vercel for hosting).
        </li>
        <li>
          <strong>Legal and safety</strong>: we may disclose information if we
          believe it is reasonably necessary to comply with law, respond to
          lawful requests, or protect rights, safety, and integrity.
        </li>
      </ul>

      <h2 id="retention-and-deletion">Retention and deletion</h2>
      <p>
        We retain information for as long as needed to provide the service and
        for legitimate business and legal purposes. Some content may remain
        visible to others until deleted. Backups may persist for a limited time.
      </p>

      <h2 id="your-choices">Your choices</h2>
      <ul>
        <li>You can update your profile information in settings.</li>
        <li>You can delete content you have created in the product.</li>
        <li>
          You can contact us to request help with account or data questions.
        </li>
      </ul>

      <h2 id="contact">Contact</h2>
      <p>
        Questions about privacy? Email{" "}
        <a href="mailto:privacy@mirrorball.social">privacy@mirrorball.social</a>.
      </p>
    </LegalPage>
  );
}

