import React from 'react';
import { SpotlightCard } from './SpotlightCard';

export const BentoGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto ${className}`}>
      {children}
    </div>
  );
};

export interface BentoCardProps {
  title: string;
  category: string;
  description: string;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  badgeText?: string;
  onClick?: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  title,
  category,
  description,
  header,
  icon,
  className = '',
  badgeText,
  onClick,
}) => {
  return (
    <SpotlightCard
      onClick={onClick}
      className={`group cursor-pointer p-6 flex flex-col justify-between space-y-6 ${className}`}
    >
      <div className="space-y-4">
        {header && <div className="rounded-2xl overflow-hidden">{header}</div>}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0D5771] bg-[#F1F5F9] px-2.5 py-1 rounded-md border border-[#E2E8F0]">
              {category}
            </span>
            {badgeText && (
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {badgeText}
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold text-[#1A202C] font-display group-hover:text-[#0D5771] transition-colors flex items-center gap-2">
            {icon && <span className="text-[#0D5771]">{icon}</span>}
            {title}
          </h3>

          <p className="text-xs text-[#64748B] leading-relaxed">{description}</p>
        </div>
      </div>
    </SpotlightCard>
  );
};
