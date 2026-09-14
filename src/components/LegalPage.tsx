import React, { useEffect } from 'react';
import SEOManager from './SEOManager';
import { ChevronRight } from 'lucide-react';

/**
 * Static legal pages: /privacy-policy, /terms-of-service and /disclaimer.
 *
 * NOTE FOR THE PUBLISHER: this is standard publisher boilerplate covering the
 * disclosures a news site is normally expected to carry. It is a starting
 * point, not legal advice, and it has not been reviewed by a lawyer. Before
 * relying on it, have counsel check it against the DPDP Act 2023, the IT Rules
 * 2021 (including the Grievance Officer requirement, which the contact block
 * below is structured for) and your actual ad/analytics stack.
 */

export type LegalSlug = 'privacy-policy' | 'terms-of-service' | 'disclaimer';

export const LEGAL_SLUGS: LegalSlug[] = ['privacy-policy', 'terms-of-service', 'disclaimer'];

export const LEGAL_PAGE_TITLES: Record<LegalSlug, string> = {
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
  disclaimer: 'Disclaimer',
};

const LEGAL_DESCRIPTIONS: Record<LegalSlug, string> = {
  'privacy-policy':
    'How News Forever collects, uses, stores and protects your personal data, including newsletter subscriptions, cookies and third-party advertising.',
  'terms-of-service':
    'The terms governing your use of News Forever — acceptable use, intellectual property, pageant and award listings, and limitation of liability.',
  disclaimer:
    'Editorial, sponsored-content, astrology and third-party-link disclaimers for News Forever.',
};

/** Last substantive revision of the text below. Update when the copy changes. */
const LAST_UPDATED = '14 September 2026';

interface SectionProps {
  heading: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ heading, children }) => (
  <section className="space-y-3">
    <h2 className="text-lg sm:text-xl font-serif font-bold text-stone-900 border-l-4 border-[#991B1B] pl-3">
      {heading}
    </h2>
    <div className="space-y-3 text-sm leading-relaxed text-stone-700">{children}</div>
  </section>
);

const ContactBlock: React.FC = () => (
  <Section heading="Contact & Grievance Officer">
    <p>
      For any question, correction request, takedown notice or privacy request, write to{' '}
      <a
        href="mailto:starindiaaward@gmail.com"
        className="text-[#991B1B] font-semibold underline underline-offset-2"
      >
        starindiaaward@gmail.com
      </a>
      . We aim to acknowledge within 24 hours and resolve within 15 days.
    </p>
    <p className="text-xs text-stone-500">
      Publisher: News Forever (Forever Star India). Postal address and the named
      Grievance Officer should be filled in here before publication.
    </p>
  </Section>
);

const PrivacyPolicy: React.FC = () => (
  <>
    <Section heading="What we collect">
      <p>
        We collect the minimum needed to run a news site. If you subscribe to our
        newsletter we store the email address you give us and the date you gave
        it. If you contact us we keep that correspondence. We do not ask you to
        create an account to read articles.
      </p>
      <p>
        Our servers record ordinary technical data — IP address, browser type,
        pages requested and referring URL — in standard web logs, used for
        security and to understand which stories are read.
      </p>
    </Section>

    <Section heading="How we use it">
      <p>
        Your email address is used to send the newsletter you asked for, and for
        nothing else. We do not sell, rent or trade subscriber lists. Every
        newsletter carries an unsubscribe link, and unsubscribing removes you
        from the list.
      </p>
    </Section>

    <Section heading="Cookies and advertising">
      <p>
        We use cookies to remember your language preference and to measure
        traffic. Advertising and analytics partners whose code appears on this
        site may also set cookies and may use them to show you advertising
        elsewhere. You can block or delete cookies in your browser settings;
        the site remains readable without them.
      </p>
    </Section>

    <Section heading="Your rights">
      <p>
        You may ask us what personal data we hold about you, ask us to correct
        it, or ask us to delete it. Write to the address below and we will act
        on the request. Newsletter data is deleted on unsubscribe.
      </p>
    </Section>

    <Section heading="Data security and retention">
      <p>
        Subscriber and enquiry data is held on access-controlled systems and is
        retained only while it serves the purpose it was collected for. No
        online transmission is perfectly secure, and we cannot guarantee
        absolute security — but we do not retain data we have no use for.
      </p>
    </Section>

    <Section heading="Children">
      <p>
        This site is a general-audience news publication and is not directed at
        children under 13. We do not knowingly collect their personal data. If
        you believe a child has given us data, contact us and we will delete it.
      </p>
    </Section>

    <ContactBlock />
  </>
);

const TermsOfService: React.FC = () => (
  <>
    <Section heading="Acceptance">
      <p>
        By using News Forever you agree to these terms. If you do not agree,
        please do not use the site. We may update these terms; continued use
        after a change means you accept the revised version.
      </p>
    </Section>

    <Section heading="Use of the site">
      <p>
        You may read, link to and share our articles. You may not scrape the
        site at a volume that degrades it for others, attempt to breach its
        security, misrepresent your identity, or use it to publish unlawful,
        defamatory or infringing material.
      </p>
    </Section>

    <Section heading="Intellectual property">
      <p>
        Articles, photographs, graphics and the News Forever name and marks
        belong to News Forever or to the contributors who licensed them to us.
        You may quote short extracts with clear attribution and a link to the
        original. Republishing a full article requires our written permission.
      </p>
      <p>
        If you believe material here infringes your copyright, write to us with
        the details and we will investigate and remove infringing material where
        the claim is substantiated.
      </p>
    </Section>

    <Section heading="Pageant, award and event listings">
      <p>
        Coverage of a pageant, award, audition, nomination or franchise
        opportunity is editorial reporting. It is not an endorsement, and it is
        not an offer or a guarantee of selection, placement, prize or return.
        Entry terms, eligibility, fees and outcomes are set by the organisers of
        each event, and any agreement you enter into is with them, not with us.
        Satisfy yourself about an organiser before paying anyone money.
      </p>
    </Section>

    <Section heading="User submissions">
      <p>
        If you send us a tip, photograph, nomination or comment, you confirm you
        have the right to do so and grant us a non-exclusive licence to publish
        it with attribution. We may edit for length, clarity and legal reasons,
        and we may decline to publish.
      </p>
    </Section>

    <Section heading="Limitation of liability">
      <p>
        The site is provided on an "as is" basis. To the extent permitted by
        law, News Forever is not liable for indirect or consequential loss
        arising from your use of the site or reliance on its content. Nothing
        here limits liability that cannot lawfully be limited.
      </p>
    </Section>

    <Section heading="Governing law">
      <p>
        These terms are governed by the laws of India, and the courts at Jaipur,
        Rajasthan have jurisdiction over any dispute arising from them.
      </p>
    </Section>

    <ContactBlock />
  </>
);

const Disclaimer: React.FC = () => (
  <>
    <Section heading="Editorial accuracy">
      <p>
        We publish continuously and check what we publish. Even so, reporting
        can contain errors, and details — dates, results, spellings, figures —
        can change after publication. Content is provided for general
        information and is not professional advice. If you spot an error, tell
        us and we will correct it on the record.
      </p>
    </Section>

    <Section heading="Sponsored and promotional content">
      <p>
        Some articles are sponsored, promotional or commercially supplied.
        Those carry a visible <strong>Sponsored</strong> label. A sponsor never
        controls our reporting on unrelated stories, and a label means exactly
        what it says: treat that article as promotional material rather than
        independent editorial.
      </p>
    </Section>

    <Section heading="Astrology and prediction content">
      <p>
        Astrology articles, forecasts and market or election predictions are
        published for interest and entertainment. They are not financial,
        legal, medical or investment advice, they carry no guarantee of
        accuracy, and no outcome should be relied upon in making a decision.
      </p>
    </Section>

    <Section heading="Pageants, awards and franchise opportunities">
      <p>
        Reporting on an audition, nomination, award or franchise opportunity is
        not an endorsement or a recommendation to pay money. Verify the
        organiser, the terms and the fees independently before you commit.
      </p>
    </Section>

    <Section heading="External links">
      <p>
        We link to third-party sites for reference. We do not control them and
        are not responsible for their content, accuracy, or privacy practices.
        Following an external link is at your own discretion.
      </p>
    </Section>

    <ContactBlock />
  </>
);

const BODIES: Record<LegalSlug, React.FC> = {
  'privacy-policy': PrivacyPolicy,
  'terms-of-service': TermsOfService,
  disclaimer: Disclaimer,
};

export interface LegalPageProps {
  slug: LegalSlug;
  onGoHome: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ slug, onGoHome }) => {
  const title = LEGAL_PAGE_TITLES[slug];
  const Body = BODIES[slug];

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      <SEOManager
        title={title}
        meta_title={title}
        meta_description={LEGAL_DESCRIPTIONS[slug]}
        siteName="News Forever"
      />

      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
        <a
          href="/"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            onGoHome();
          }}
          className="hover:text-[#991B1B] transition"
        >
          Home
        </a>
        <ChevronRight className="w-3 h-3 text-stone-300" aria-hidden="true" />
        <span className="text-stone-700" aria-current="page">{title}</span>
      </nav>

      <header className="space-y-3 border-b border-[#E7E5E4] pb-6">
        <h1 className="text-3xl sm:text-4xl font-serif font-black text-stone-900 leading-tight tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-stone-500 font-mono uppercase tracking-widest">
          Last updated: {LAST_UPDATED}
        </p>
      </header>

      <div className="space-y-8">
        <Body />
      </div>

      <div className="pt-6 border-t border-[#E7E5E4] flex flex-wrap gap-4 text-xs font-mono">
        {LEGAL_SLUGS.filter((s) => s !== slug).map((s) => (
          <a
            key={s}
            href={`/${s}`}
            className="text-[#991B1B] font-bold uppercase tracking-widest hover:underline underline-offset-4"
          >
            {LEGAL_PAGE_TITLES[s]}
          </a>
        ))}
      </div>
    </div>
  );
};

export default LegalPage;
