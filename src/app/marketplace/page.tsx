import React from 'react';
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import { ShoppingBag } from 'lucide-react';

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A202C] relative overflow-hidden pb-24">
      {/* Background Particle Mesh Canvas */}
      <HeroCanvasBackground />

      {/* Radial Dot Grid Background Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.65px,transparent_0.65px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 space-y-5 relative z-10">
        {/* Compact Header */}
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5F9] text-[#0D5771] text-[11px] font-mono font-bold border border-[#E2E8F0] shadow-sm">
            <ShoppingBag className="w-3.5 h-3.5 text-[#0D5771]" />
            <span>MODULAR BUSINESS BLUEPRINTS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#1A202C] font-display leading-tight">
            Discover Professionally Engineered Digital Products
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-2xl">
            Choose a verified starter blueprint, customize it using AI, and launch your business with 1-click domain hosting.
          </p>
        </div>

        {/* Grid & Search Controls (Density Optimized for Viewport) */}
        <MarketplaceGrid />
      </div>
    </div>
  );
}
