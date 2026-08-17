import React, { Suspense } from 'react';
import LoginContent from './LoginContent';

export const metadata = {
  title: 'Sign In — Cuzmify',
  description: 'Log into your Cuzmify account to access your visual studio and digital businesses.',
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[75vh] items-center justify-center bg-[#FFFFFF]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#64748B] text-xs font-mono">Loading Cuzmify Auth…</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
