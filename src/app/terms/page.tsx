import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — Cuzmify',
  description: 'Terms governing use of the Cuzmify website builder, booking tools, and Pro plans.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D5771]">
            Legal &amp; Compliance
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-[#64748B]">
            Last updated: November 25, 2026 • Applies to Cuzmify (by Bram Intel)
          </p>
        </div>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">1. Your Content &amp; Ownership</h2>
          <p>
            You retain full ownership of every photo, video, caption, brand name, and service rate you upload or import from your own Instagram account into Cuzmify. You grant Cuzmify permission solely to host and display that content on your published portfolio page.
          </p>
        </section>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">2. Acceptable Use</h2>
          <p>
            You agree to only connect Instagram accounts you own or are authorized to manage, and to accurately represent your services and pricing to clients. Impersonation, spam, or unlawful activity is prohibited and may result in site suspension.
          </p>
        </section>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">3. Free &amp; Pro Plans</h2>
          <p>
            Cuzmify offers a free bio-link plan and optional paid Pro upgrades (custom domain connection and removal of platform branding). We charge zero commission on bookings arranged between vendors and their clients.
          </p>
        </section>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">4. Privacy &amp; Contact</h2>
          <p>
            Use of Cuzmify is also governed by our{' '}
            <Link href="/privacy" className="text-[#0D5771] font-semibold underline">
              Privacy Policy
            </Link>
            . Support inquiries can be sent to{' '}
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
