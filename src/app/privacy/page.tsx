import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — Cuzmify',
  description: 'How Cuzmify handles account data, Instagram Business Login permissions, and user privacy.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D5771]">
            Legal &amp; Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#64748B]">
            Last updated: November 25, 2026 • Applies to Cuzmify (by Bram Intel)
          </p>
        </div>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">1. Information We Collect</h2>
          <p>
            Cuzmify helps service vendors turn their existing business profile and portfolio photos into a booking website. We collect only the information you choose to share:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Account Details:</strong> Your name, email address, and profile avatar when you sign in via Google OAuth or Email &amp; Password.
            </li>
            <li>
              <strong>Instagram Basic Profile &amp; Media (`instagram_business_basic`):</strong> When you explicitly authorize Instagram OAuth, Cuzmify requests read-only access to your Instagram username and media posts (images, Reels, carousel slides, captions, and post links) to display them inside your own website portfolio.
            </li>
            <li>
              <strong>Business &amp; Booking Data:</strong> Service names, rates, WhatsApp phone numbers you configure, and client enquiry submissions sent through your live site&apos;s booking form.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">2. How We Use Your Instagram Data</h2>
          <p>
            Cuzmify <strong>never posts on your behalf, never sends DMs, and never sells or shares your Instagram data with advertisers or third parties</strong>. Access tokens are used strictly to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Import your portfolio media into your Cuzmify Studio website builder.</li>
            <li>Refresh temporary Meta CDN image links on your published portfolio so your website photos do not break.</li>
          </ul>
        </section>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">3. Data Storage, Security &amp; Deletion</h2>
          <p>
            All sessions and site records are stored securely over HTTPS/TLS in encrypted PostgreSQL infrastructure. You can revoke Instagram access or delete your website data at any time. For full removal instructions, visit our{' '}
            <Link href="/data-deletion" className="text-[#0D5771] font-semibold underline">
              Data Deletion Instructions
            </Link>{' '}
            page.
          </p>
        </section>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">4. Contact Us</h2>
          <p>
            Questions about privacy or data handling? Email{' '}
            <a href="mailto:bramintel@gmail.com" className="text-[#0D5771] font-semibold underline">
              bramintel@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
