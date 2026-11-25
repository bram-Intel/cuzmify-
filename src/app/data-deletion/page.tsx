import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions — Cuzmify',
  description: 'How to revoke Instagram permissions and delete your Cuzmify website data.',
};

export default async function DataDeletionPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] py-12 px-5 sm:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-3 border-b border-[#E2E8F0] pb-6">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#0D5771]">
            Privacy Controls
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
            Data Deletion Instructions
          </h1>
          <p className="text-sm text-[#64748B]">
            How to disconnect Instagram and permanently remove your Cuzmify data.
          </p>
        </div>

        {code && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-emerald-950">Data Deletion Request Recorded</p>
              <p className="text-xs text-emerald-800">
                Any stored Instagram access tokens linked to your request have been invalidated. Confirmation Code:{' '}
                <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {code}
                </code>
              </p>
            </div>
          </div>
        )}

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">Option 1: Delete Inside Cuzmify (Instant)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Sign in and open your{' '}
              <Link href="/dashboard" className="text-[#0D5771] font-semibold underline">
                Cuzmify Dashboard
              </Link>
              .
            </li>
            <li>Click the trash icon on any website project to delete the site, imported portfolio metadata, and stored Instagram tokens from our database.</li>
          </ol>
        </section>

        <section className="space-y-3 text-[15px] leading-[1.7] text-[#334155]">
          <h2 className="text-lg font-bold text-[#0F172A] font-display">Option 2: Revoke Access via Instagram</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Open the Instagram app or website and go to <strong>Settings and activity</strong>.</li>
            <li>Open <strong>Website permissions → Apps and websites</strong>.</li>
            <li>Select <strong>Cuzmify</strong> and click <strong>Remove</strong>. Meta immediately notifies our endpoint to invalidate your token.</li>
          </ol>
        </section>

        <section className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
            <ShieldCheck className="w-4 h-4 text-[#0D5771]" />
            <span>Need Full Account Erasure?</span>
          </div>
          <p className="text-sm text-[#475569]">
            Email{' '}
            <a href="mailto:bramintel@gmail.com" className="text-[#0D5771] font-semibold underline">
              bramintel@gmail.com
            </a>{' '}
            from your registered email address with subject <strong>Delete My Cuzmify Account</strong> and we will erase your account record within 48 hours.
          </p>
        </section>
      </div>
    </div>
  );
}
