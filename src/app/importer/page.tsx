import React from 'react';
import { RevampUrlForm } from '@/components/importer/RevampUrlForm';
import { Globe, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ImporterPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold border border-brand-500/20">
          <Globe className="w-3.5 h-3.5" />
          <span>Website Revamp & Content Importer Engine</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
          Already Have A Website? Paste Your URL Below.
        </h1>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Cuzmify automatically extracts your business content, services, logo, contact info, and reconstructs them into modern composable architecture.
        </p>
      </div>

      {/* Main Form */}
      <RevampUrlForm />

      {/* How it works */}
      <div className="bg-[#131A29] p-8 rounded-3xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white font-display">How The Revamp Importer Works</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-2">
            <span className="font-bold text-brand-400">1. URL Analysis</span>
            <p className="text-slate-400 leading-relaxed">
              We inspect performance, mobile responsiveness, typography contrast, and SEO structure.
            </p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-brand-400">2. Business Extraction</span>
            <p className="text-slate-400 leading-relaxed">
              Extracts headings, service menus, prices, WhatsApp contact details, and images without copying messy code.
            </p>
          </div>
          <div className="space-y-2">
            <span className="font-bold text-brand-400">3. AI Modernization</span>
            <p className="text-slate-400 leading-relaxed">
              Rebuilds the content into Cuzmify composable components ready for 1-click domain deployment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
