import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Sparkles, ArrowRight, Eye, ShieldCheck, Tag } from 'lucide-react';
import Link from 'next/link';

export interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  developerName: string;
  imageUrl: string;
  isFeatured?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  category,
  description,
  priceCents,
  developerName,
  imageUrl,
  isFeatured = false,
}) => {
  const priceDisplay = priceCents === 0 ? 'FREE STARTER' : `$${(priceCents / 100).toFixed(0)}`;

  return (
    <GlassCard glow={isFeatured} className="flex flex-col justify-between group hover:scale-[1.01] transition-transform">
      <div className="space-y-4">
        {/* Preview Image Frame */}
        <div className="relative h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-slate-700 transition-colors">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131A29] via-transparent to-black/20" />

          {isFeatured && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-lg">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              Verified Architecture
            </div>
          )}

          <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10 flex items-center gap-1.5">
            <Tag className="w-3 h-3 text-brand-400" />
            {category}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-white font-display group-hover:text-amber-400 transition-colors">
              {name}
            </h3>
            <span className="text-sm font-extrabold text-amber-400 font-mono">{priceDisplay}</span>
          </div>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>by {developerName}</span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/editor?template=${encodeURIComponent(name)}`}
            className="px-3.5 py-2 rounded-xl bg-brand-600/20 hover:bg-brand-600 border border-brand-500/30 text-brand-300 hover:text-white font-semibold text-xs transition-all flex items-center gap-1"
          >
            <span>Customize</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
};
