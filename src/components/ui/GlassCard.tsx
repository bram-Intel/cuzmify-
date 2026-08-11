import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', glow = false, ...props }) => {
  return (
    <div
      className={`relative rounded-2xl bg-[#0D2A38]/80 backdrop-blur-xl border border-[#1E3A4A] p-6 transition-all duration-300 ${
        glow ? 'shadow-[0_0_25px_rgba(52,152,227,0.25)] border-[#3498E3]/60' : 'hover:border-[#3498E3]/40'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
