import React from 'react';
import { RevampUrlForm } from '@/components/importer/RevampUrlForm';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { Globe, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ImporterPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A202C] relative overflow-hidden pb-32">
      {/* Background Particle Mesh Canvas */}
      <HeroCanvasBackground />

      {/* Radial Dot Grid Background Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.65px,transparent_0.65px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 pt-10 space-y-12 relative z-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] text-[#0D5771] text-xs font-mono font-bold border border-[#E2E8F0] shadow-sm">
            <Globe className="w-4 h-4 text-[#3498E3]" />
            <span>WEBSITE REVAMP ENGINE</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#1A202C] font-display">
            Already Have A Website? Rebuild It In One Sitting.
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-xl mx-auto leading-relaxed">
            Paste your website URL below. Cuzmify analyzes its structure, extracts your best content, and rebuilds it using our modern design system.
          </p>
        </div>

        {/* Main Form */}
        <RevampUrlForm />

        {/* How it works */}
        <div className="bg-[#F7FAFC] p-8 rounded-3xl border border-[#E2E8F0] space-y-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1A202C] font-display flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#0D5771]" />
            <span>How The Revamp Importer Works</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-[#1A202C]">
            <SpotlightCard className="p-4 space-y-2 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0]">
              <span className="font-bold text-[#0D5771] font-mono block">1. URL Analysis</span>
              <p className="text-[#64748B] leading-relaxed">
                We inspect performance, mobile responsiveness, typography contrast, and SEO structure.
              </p>
            </SpotlightCard>
            <SpotlightCard className="p-4 space-y-2 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0]">
              <span className="font-bold text-[#0D5771] font-mono block">2. Content Extraction</span>
              <p className="text-[#64748B] leading-relaxed">
                Extracts headings, service menus, prices, WhatsApp contact details, and images.
              </p>
            </SpotlightCard>
            <SpotlightCard className="p-4 space-y-2 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0]">
              <span className="font-bold text-[#0D5771] font-mono block">3. Modern Migration</span>
              <p className="text-[#64748B] leading-relaxed">
                Rebuilds the content into Cuzmify composable components ready for 1-click domain deployment.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </div>
    </div>
  );
}
