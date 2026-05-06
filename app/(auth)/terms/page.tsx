import { LegalPage } from "@/components/shared/legal-page";

export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="2026-05-06">
      <p>
        These Terms govern your use of Mirrorball. By using the service, you
        agree to these Terms.
      </p>

      <h2 id="eligibility">Eligibility</h2>
      <p>You must be at least 13 years old to use Mirrorball.</p>

      <h2 id="your-account">Your account</h2>
      <ul>
        <li>You are responsible for activity under your account.</li>
        <li>
          You agree not to access or use the service in a way that violates
          applicable law.
        </li>
      </ul>

      <h2 id="user-content">User content</h2>
      <p>
        Mirrorball allows you to post user-generated content (UGC), such as
        profile details, events, mixes/links, messages, and comments.
      </p>
      <ul>
        <li>
          <strong>You own your content</strong>. You are responsible for the
          content you post.
        </li>
        <li>
          <strong>License to Mirrorball</strong>: you grant Mirrorball a
          worldwide, non-exclusive, royalty-free license to host, store,
          reproduce, modify (for formatting/display), and display your content
          solely to operate and provide the service.
        </li>
        <li>
          <strong>Removal</strong>: we may remove or limit content that violates
          these Terms or our Community Guidelines.
        </li>
      </ul>

      <h2 id="acceptable-use">Acceptable use</h2>
      <p>
        You agree not to misuse Mirrorball, including by engaging in harassment,
        threats, impersonation, unlawful activity, or attempts to compromise the
        service.
      </p>

      <h2 id="moderation-and-termination">Moderation and termination</h2>
      <p>
        We may suspend or terminate accounts, or restrict access to features, if
        we reasonably believe a user has violated these Terms, our Guidelines,
        or the law, or to protect the service and users.
      </p>

      <h2 id="disclaimers">Disclaimers</h2>
      <p>
        Mirrorball is provided “as is” and “as available.” We do not guarantee
        that the service will be uninterrupted or error-free.
      </p>

      <h2 id="limitation-of-liability">Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Mirrorball will not be liable
        for indirect, incidental, special, consequential, or punitive damages.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:legal@mirrorball.social">legal@mirrorball.social</a>.
      </p>
    </LegalPage>
  );
}

