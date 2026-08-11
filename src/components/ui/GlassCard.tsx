import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`relative rounded-2xl bg-[#131A29]/80 backdrop-blur-xl border border-slate-800/80 p-6 transition-all duration-300 ${
        glow ? 'shadow-[0_0_25px_rgba(83,100,247,0.15)] border-brand-500/30 hover:border-brand-500/60' : 'hover:border-slate-700'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
