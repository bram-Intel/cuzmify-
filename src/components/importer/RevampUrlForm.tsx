'use client';

import React from 'react';
import { Globe, ArrowRight, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
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
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <Globe className="w-5 h-5 text-brand-400" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your existing website URL (e.g. www.glorybeauty.com)..."
            className="w-full bg-[#131A29] border border-slate-700/80 rounded-2xl pl-12 pr-36 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-2xl transition-all"
            suppressHydrationWarning
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
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

        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Automatic Content Extraction & Structure Detection
          </span>
          <span className="text-amber-400 font-medium">Free Modernization Assessment</span>
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
