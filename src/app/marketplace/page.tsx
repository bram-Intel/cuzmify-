import React from 'react';
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid';
import { ShoppingBag, Sparkles, ShieldCheck } from 'lucide-react';

export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Cuzmify Product Marketplace</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
          Discover Professionally Engineered Digital Products
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Every product passes security scanning, build validation, customization testing, and RSA license key generation before listing. Choose a product and start Cuzmifying.
        </p>
      </div>

      {/* Grid */}
      <MarketplaceGrid />
    </div>
  );
}
