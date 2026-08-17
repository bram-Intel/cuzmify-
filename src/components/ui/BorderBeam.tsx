'use client';

import React from 'react';

interface BorderBeamProps {
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam: React.FC<BorderBeamProps> = ({
  size = 200,
  duration = 12,
  borderWidth = 1.5,
  colorFrom = '#0D5771',
  colorTo = '#3498E3',
  delay = 0,
}) => {
  return (
    <div
      style={
        {
          '--size': size,
          '--duration': `${duration}s`,
          '--border-width': `${borderWidth}px`,
          '--color-from': colorFrom,
          '--color-to': colorTo,
          '--delay': `-${delay}s`,
        } as React.CSSProperties
      }
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <div
        className="absolute aspect-square w-[calc(var(--size)*1px)] animate-border-beam bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent"
        style={{
          offsetPath: 'rect(0 auto auto 0 round calc(var(--size) * 1px))',
          animationDuration: 'var(--duration)',
          animationDelay: 'var(--delay)',
        }}
      />
    </div>
  );
};
