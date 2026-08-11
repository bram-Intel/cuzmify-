'use client';

import React from 'react';
import { WebsiteImportResult } from '@/core/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { CheckCircle2, AlertTriangle, ArrowRight, X, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface WebsiteReportModalProps {
  data: WebsiteImportResult;
  onClose: () => void;
}

export const WebsiteReportModal: React.FC<WebsiteReportModalProps> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <GlassCard className="w-full max-w-2xl bg-[#0B0F17] border border-slate-700 shadow-2xl relative space-y-6 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">
            Website Modernization Report
          </span>
          <h2 className="text-2xl font-bold text-white font-display">
            {data.businessName} Audit Summary
          </h2>
          <p className="text-xs text-slate-400">Extracted from {data.url}</p>
        </div>

        {/* Audit Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400">Mobile Experience</span>
            <div className="text-xl font-extrabold text-amber-400">{data.report.mobileScore}/100</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400">Performance</span>
            <div className="text-xl font-extrabold text-amber-400">{data.report.performanceScore}/100</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400">Visual Design</span>
            <div className="text-xl font-extrabold text-red-400">{data.report.visualDesignScore}/100</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center space-y-1">
            <span className="text-xs text-slate-400">SEO Score</span>
            <div className="text-xl font-extrabold text-emerald-400">{data.report.seoScore}/100</div>
          </div>
        </div>

        {/* Detected Issues */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Detected Friction Points
          </h3>
          <div className="space-y-2">
            {data.report.issues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation CTA */}
        <div className="bg-gradient-to-r from-brand-900/40 via-indigo-900/40 to-slate-900 p-5 rounded-xl border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" />
              Cuzmify Revamp Ready
            </span>
            <p className="text-xs text-slate-300">
              We extracted {data.services.length} services, logo, contact info, and branding. Ready to transform into modern Cuzmify architecture.
            </p>
          </div>
          <Link
            href={`/editor?importName=${encodeURIComponent(data.businessName)}`}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/25 flex items-center gap-2 whitespace-nowrap"
          >
            <span>See My New Version</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
