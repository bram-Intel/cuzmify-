import React, { Suspense } from 'react';
import PostLoginDispatcher from './PostLoginDispatcher';

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#FFFFFF]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#64748B] text-xs font-mono">Routing your Cuzmify experience…</p>
          </div>
        </div>
      }
    >
      <PostLoginDispatcher />
    </Suspense>
  );
}
