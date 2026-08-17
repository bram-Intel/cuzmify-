'use client';

import React from 'react';

export interface CuzmifyLogoProps {
  className?: string;
  size?: number;
}

export const CuzmifyLogo: React.FC<CuzmifyLogoProps> = ({ className = 'w-8 h-8', size }) => {
  const styleProps = size ? { width: size, height: size } : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      style={styleProps}
      fill="none"
    >
      <defs>
        {/* Pure Sharp Vector Gradients */}
        <linearGradient id="cuzmifyBgRaw" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#071A24" />
          <stop offset="50%" stopColor="#0D5771" />
          <stop offset="100%" stopColor="#083D50" />
        </linearGradient>

        <linearGradient id="cuzmifyStreamRaw" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#3498E3" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>

      {/* Sharp Rounded Background Base */}
      <rect width="48" height="48" rx="12" fill="url(#cuzmifyBgRaw)" />

      {/* Backbone Interlocking "C" Flow Pipeline (1:1 Crisp Subpixel Vector) */}
      <path
        d="M 34,13 C 21,7 9,15 9,24 C 9,33 21,41 34,35"
        stroke="url(#cuzmifyStreamRaw)"
        strokeWidth="2.5"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Inner Active Wave */}
      <path
        d="M 15,18 C 12,21 12,27 15,30"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.8"
        vectorEffect="non-scaling-stroke"
      />

      {/* Dotted Links */}
      <path
        d="M 24,24 L 34,13 M 24,24 L 34,35"
        stroke="#FFFFFF"
        strokeWidth="0.8"
        strokeDasharray="2 2"
        opacity="0.7"
        vectorEffect="non-scaling-stroke"
      />

      {/* Top Node */}
      <rect x="30" y="9" width="7.5" height="7.5" rx="2.5" fill="#38BDF8" transform="rotate(12 33.75 12.75)" />
      <circle cx="33.75" cy="12.75" r="1.2" fill="#FFFFFF" />

      {/* Center Engine Hub Node */}
      <rect x="20.25" y="20.25" width="7.5" height="7.5" rx="2.5" fill="#3498E3" transform="rotate(45 24 24)" />
      <circle cx="24" cy="24" r="1.2" fill="#FFFFFF" />

      {/* Bottom Node */}
      <rect x="30" y="31.25" width="7.5" height="7.5" rx="2.5" fill="#34D399" transform="rotate(-12 33.75 35)" />
      <circle cx="33.75" cy="35" r="1.2" fill="#FFFFFF" />
    </svg>
  );
};
