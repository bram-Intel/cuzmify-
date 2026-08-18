'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function EditorRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams ? searchParams.toString() : '';
    router.replace(query ? `/studio?${query}` : '/studio');
  }, [router, searchParams]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#F1F5F9]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[#64748B] text-xs font-mono">Redirecting to Cuzmify Studio…</p>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#F1F5F9]">
          <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      }
    >
      <EditorRedirect />
    </Suspense>
  );
}
