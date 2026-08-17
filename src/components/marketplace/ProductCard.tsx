'use client';

import React, { Suspense } from 'react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { Zap, ArrowRight, ShieldCheck, Tag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  developerName: string;
  imageUrl: string;
  isFeatured?: boolean;
  activeTemplate?: string | null;
  onSelectTemplate?: (name: string) => void;
}

function ProductCardInner({
  name,
  category,
  description,
  priceCents,
  developerName,
  imageUrl,
  isFeatured = false,
  activeTemplate,
  onSelectTemplate,
}: ProductCardProps) {
  const searchParams = useSearchParams();
  const isFromOnboarding = searchParams.get('fromOnboarding') === 'true';
  const priceDisplay = priceCents === 0 ? 'FREE STARTER' : `$${(priceCents / 100).toFixed(0)}`;

  const isActive = activeTemplate && (
    activeTemplate.toLowerCase() === name.toLowerCase() ||
    (activeTemplate.includes('BeautyPro') && name.includes('BeautyPro')) ||
    (activeTemplate.includes('Vogue') && name.includes('Vogue')) ||
    (activeTemplate.includes('Couture') && name.includes('Couture')) ||
    (activeTemplate.includes('Luxe') && name.includes('Luxe'))
  );

  const targetHref = isFromOnboarding
    ? `/onboarding?template=${encodeURIComponent(name)}`
    : `/editor?template=${encodeURIComponent(name)}`;

  const handleClick = () => {
    if (onSelectTemplate) {
      onSelectTemplate(name);
    }
  };

  return (
    <SpotlightCard
      className={`flex flex-col justify-between group p-4 rounded-2xl bg-[#FFFFFF] transition-all duration-300 ${
        isActive
          ? 'border-2 border-emerald-500 shadow-md shadow-emerald-500/10'
          : 'border border-[#E2E8F0] shadow-sm hover:border-[#0D5771]/40 hover:shadow-md'
      }`}
    >
      <div className="space-y-3">
        {/* Aspect-Ratio Constrained Image Frame */}
        <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center group-hover:border-[#3498E3]/50 transition-colors">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover object-center opacity-95 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A202C]/65 via-transparent to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
            {isActive ? (
              <div className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 shadow-md border border-emerald-400/40">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Active Template
              </div>
            ) : isFeatured ? (
              <div className="px-2.5 py-1 rounded-full bg-[#0D5771] text-white font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-md border border-[#3498E3]/30">
                <Zap className="w-3 h-3 text-[#3498E3]" />
                Verified Starter
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/10 flex items-center gap-1.5 font-mono z-10">
            <Tag className="w-3 h-3 text-[#72B9F3]" />
            {category}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-[#1A202C] font-display group-hover:text-[#0D5771] transition-colors leading-snug">
              {name}
            </h3>
            <span className="text-[11px] font-extrabold text-[#0D5771] font-mono px-2 py-0.5 rounded bg-[#0D5771]/5 border border-[#0D5771]/10 flex-shrink-0">
              {priceDisplay}
            </span>
          </div>
          <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-3 mt-3 border-t border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono text-[10px]">by {developerName}</span>
        </div>

        <Link
          href={targetHref}
          onClick={handleClick}
          className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.02] ${
            isActive
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : isFromOnboarding
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/20'
              : 'bg-gradient-to-r from-[#0D5771] to-[#3498E3] text-white shadow-[#3498E3]/20'
          }`}
        >
          {isActive ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Open in Studio</span>
            </>
          ) : isFromOnboarding ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Use This Template</span>
            </>
          ) : (
            <>
              <span>Select & Open</span>
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </Link>
      </div>
    </SpotlightCard>
  );
}

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  return (
    <Suspense fallback={<div className="h-64 bg-white rounded-2xl animate-pulse" />}>
      <ProductCardInner {...props} />
    </Suspense>
  );
};
