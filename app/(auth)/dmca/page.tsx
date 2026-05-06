import { LegalPage } from "@/components/shared/legal-page";

export const metadata = {
  title: "DMCA / Copyright",
};

export default function DmcaPage() {
  return (
    <LegalPage title="DMCA / Copyright" lastUpdated="2026-05-06">
      <p>
        Mirrorball respects intellectual property rights. If you believe content
        on Mirrorball infringes your copyright, you may submit a DMCA notice.
      </p>

      <h2 id="notice">Submit a notice</h2>
      <p>
        Email{" "}
        <a href="mailto:dmca@mirrorball.social">dmca@mirrorball.social</a> and
        include:
      </p>
      <ol>
        <li>Your name and contact information.</li>
        <li>The copyrighted work you claim has been infringed.</li>
        <li>
          The allegedly infringing material on Mirrorball, with enough
          information for us to locate it (URLs are best).
        </li>
        <li>
          A statement that you have a good-faith belief the use is not
          authorized by the copyright owner, its agent, or the law.
        </li>
        <li>
          A statement, under penalty of perjury, that the information in the
          notice is accurate and that you are the copyright owner or authorized
          to act on the owner’s behalf.
        </li>
        <li>A physical or electronic signature.</li>
      </ol>

      <h2 id="counter-notice">Counter-notice</h2>
      <p>
        If you believe your content was removed by mistake, you may submit a
        counter-notice to the same address. We may forward notices and
        counter-notices as required by law.
      </p>

      <h2 id="repeat-infringers">Repeat infringers</h2>
      <p>
        We may terminate accounts of repeat infringers in appropriate
        circumstances.
      </p>
    </LegalPage>
  );
}

