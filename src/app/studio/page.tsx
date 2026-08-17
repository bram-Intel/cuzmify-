import React, { Suspense } from 'react';

export const metadata = {
  title: 'Cuzmify Studio — Visual Website Editor',
  description: 'Cuzmify Visual Studio: drag, customize, and launch your professional website.',
};

export default function StudioPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-[#041017]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#475569] text-xs font-mono">Initializing Cuzmify Studio…</p>
        </div>
      </div>
    }>
      <StudioContent />
    </Suspense>
  );
}

// Client-side wrapper (separate file avoids Next.js metadata + use client conflict)
import StudioContent from './StudioContent';
