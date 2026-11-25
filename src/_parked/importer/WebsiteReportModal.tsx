'use client';

import React from 'react';
import { WebsiteImportResult } from '@/core/types';
import { GlassCard } from '@/components/ui/GlassCard';
import { AlertTriangle, ArrowRight, X, Zap } from 'lucide-react';
import Link from 'next/link';

interface WebsiteReportModalProps {
  data: WebsiteImportResult;
  onClose: () => void;
}

export const WebsiteReportModal: React.FC<WebsiteReportModalProps> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <GlassCard className="w-full max-w-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xl relative space-y-6 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-[#1A202C] rounded-lg hover:bg-slate-100 transition-colors"
          suppressHydrationWarning
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-xs font-semibold text-[#0D5771] uppercase tracking-widest font-mono">
            Website Modernization Audit
          </span>
          <h2 className="text-2xl font-bold text-[#1A202C] font-display">
            {data.businessName} Assessment Summary
          </h2>
          <p className="text-xs text-slate-500 font-mono">Source: {data.url}</p>
        </div>

        {/* Audit Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0] text-center space-y-1">
            <span className="text-xs text-slate-500">Mobile Experience</span>
            <div className="text-xl font-extrabold text-amber-600 font-mono">{data.report.mobileScore}/100</div>
          </div>
          <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0] text-center space-y-1">
            <span className="text-xs text-slate-500">Performance</span>
            <div className="text-xl font-extrabold text-amber-600 font-mono">{data.report.performanceScore}/100</div>
          </div>
          <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0] text-center space-y-1">
            <span className="text-xs text-slate-500">Visual Design</span>
            <div className="text-xl font-extrabold text-red-600 font-mono">{data.report.visualDesignScore}/100</div>
          </div>
          <div className="bg-[#F7FAFC] p-4 rounded-xl border border-[#E2E8F0] text-center space-y-1">
            <span className="text-xs text-slate-500">SEO Score</span>
            <div className="text-xl font-extrabold text-emerald-600 font-mono">{data.report.seoScore}/100</div>
          </div>
        </div>

        {/* Detected Issues */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-[#1A202C] uppercase tracking-wider">
            Detected Friction Points
          </h3>
          <div className="space-y-2">
            {data.report.issues.map((issue, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{issue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendation CTA */}
        <div className="bg-gradient-to-r from-[#0D5771] to-[#3498E3] p-5 rounded-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-[#3498E3]/20">
          <div>
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 mb-1 font-mono uppercase">
              <Zap className="w-4 h-4" />
              Cuzmify Revamp Engine Ready
            </span>
            <p className="text-xs text-slate-100">
              We extracted {data.services.length} services, logo, contact info, and branding. Ready to transform into modern Cuzmify architecture.
            </p>
          </div>
          <Link
            href={`/editor?importName=${encodeURIComponent(data.businessName)}`}
            className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-[#0D5771] font-bold text-xs flex items-center gap-2 whitespace-nowrap shadow-md"
          >
            <span>See My New Version</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};
