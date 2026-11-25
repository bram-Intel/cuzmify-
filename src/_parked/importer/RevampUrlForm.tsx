'use client';

import React from 'react';
import { Globe, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { WebsiteImportResult } from '@/core/types';
import { WebsiteReportModal } from './WebsiteReportModal';

export const RevampUrlForm: React.FC = () => {
  const [url, setUrl] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [reportResult, setReportResult] = React.useState<WebsiteImportResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data && !data.error) {
        setReportResult(data);
      }
    } catch {
      // error handling
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="relative space-y-3" suppressHydrationWarning>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Globe className="w-5 h-5 text-[#0D5771]" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your existing website URL (e.g. www.glorybeauty.com)..."
            className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl pl-12 pr-36 py-4 text-sm text-[#1A202C] placeholder-slate-400 focus:outline-none focus:border-[#0D5771] focus:ring-2 focus:ring-[#0D5771]/20 shadow-sm transition-all"
            suppressHydrationWarning
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-90 text-white font-semibold text-xs shadow-md shadow-[#3498E3]/20 flex items-center gap-2 transition-all disabled:opacity-50"
            suppressHydrationWarning
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Auditing...</span>
              </>
            ) : (
              <>
                <span>Analyze & Revamp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-[#64748B] px-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Automatic Content Extraction & Structure Detection
          </span>
          <span className="text-amber-600 font-medium">Free Modernization Assessment</span>
        </div>
      </form>

      {/* Report Modal / Result */}
      {reportResult && (
        <WebsiteReportModal
          data={reportResult}
          onClose={() => setReportResult(null)}
        />
      )}
    </div>
  );
};
