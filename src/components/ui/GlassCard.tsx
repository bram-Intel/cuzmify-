import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`relative rounded-2xl bg-[#F7FAFC] backdrop-blur-xl border border-[#E2E8F0] p-6 transition-all duration-300 ${
        glow ? 'shadow-[0_4px_20px_rgba(13,87,113,0.12)] border-[#3498E3]/60' : 'hover:border-[#3498E3]/40 hover:shadow-md'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
