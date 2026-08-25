'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EditorProvider } from '@/studio/engine/EditorContext';
import { EditorShell } from '@/studio/EditorShell';
import { StudioAuthGate } from '@/studio/StudioAuthGate';
import { getBlueprintByNameOrCategory } from '@/core/blueprints';
import type { ThemeName } from '@/core/project-schema';

const THEME_MAP: Record<string, ThemeName> = {
  'apple-luxury': 'apple-luxury',
  'bram-light': 'bram-light',
  'dark-obsidian': 'dark-obsidian',
  luxury: 'luxury',
  minimal: 'minimal',
  modern: 'modern',
  editorial: 'editorial',
  vibrant: 'vibrant',
};

export default function StudioContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const nameParam = searchParams.get('name') || searchParams.get('importName');
  const templateName = searchParams.get('template');
  const categoryParam = searchParams.get('category');
  const currencyParam = searchParams.get('currency');
  const whatsappParam = searchParams.get('whatsapp');
  const instagramParam = searchParams.get('instagram');
  const projectId = searchParams.get('projectId') ?? 'proj_default';

  const blueprint = getBlueprintByNameOrCategory(templateName || categoryParam || 'beauty');
  const initialTheme: ThemeName = THEME_MAP[blueprint.themeConfig.style] ?? 'bram-light';
  const initialBusinessName = nameParam || (templateName ? `${templateName} Studio` : 'Glory Beauty Studio');

  return (
    <>
      {status === 'loading' ? (
        <div className="flex h-screen w-screen items-center justify-center bg-[#F1F5F9]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#64748B] text-xs font-mono">Verifying Cuzmify Session…</p>
          </div>
        </div>
      ) : !session ? (
        <StudioAuthGate callbackUrl={`/studio?${searchParams.toString()}`} />
      ) : (
        <EditorProvider
          initialBusinessName={initialBusinessName}
          initialTheme={initialTheme}
          projectId={projectId}
        >
          <EditorShell
            initialBusinessName={initialBusinessName}
            initialTheme={initialTheme}
            projectId={projectId}
          />
        </EditorProvider>
      )}
    </>
  );
}
