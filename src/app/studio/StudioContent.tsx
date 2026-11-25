'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { EditorProvider } from '@/studio/engine/EditorContext';
import { EditorShell } from '@/studio/EditorShell';
import { StudioAuthGate } from '@/studio/StudioAuthGate';
import { MobileGuard } from '@/studio/MobileGuard';
import { resolveNicheBlueprint } from '@/core/niche-blueprints';
import { resolveTemplateEngineId } from '@/core/template-engines';
import type { ThemeName } from '@/core/project-schema';

export default function StudioContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const nameParam = searchParams.get('name') || searchParams.get('importName');
  const templateParam = searchParams.get('template') || searchParams.get('templateId');
  const categoryParam = searchParams.get('category') || searchParams.get('nicheId');
  const currencyParam = searchParams.get('currency');
  const whatsappParam = searchParams.get('whatsapp');
  const instagramParam = searchParams.get('instagram');
  const projectId = searchParams.get('projectId') ?? 'proj_default';

  if (status === 'loading') {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F1F5F9]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#0D5771] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#64748B] text-xs font-mono">Verifying Cuzmify Session…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <StudioAuthGate callbackUrl={`/studio?${searchParams.toString()}`} />;
  }

  const resolvedNiche = resolveNicheBlueprint(categoryParam);
  const resolvedTemplate = templateParam
    ? resolveTemplateEngineId(templateParam)
    : resolvedNiche.recommendedTemplate;
  const initialTheme: ThemeName = resolvedTemplate === 'noir-showcase' ? 'dark-obsidian' : 'bram-light';
  const userAccountName = session?.user?.name ? `${session.user.name}'s Studio` : 'My Studio';
  const initialBusinessName = nameParam || userAccountName;

  return (
    <MobileGuard>
      <EditorProvider
        initialBusinessName={initialBusinessName}
        initialTheme={initialTheme}
        projectId={projectId}
        initialCurrency={(currencyParam as any) || 'NGN'}
        initialCategory={resolvedNiche.label}
        initialNicheId={resolvedNiche.id}
        initialWhatsapp={whatsappParam || undefined}
        initialInstagram={instagramParam || undefined}
        initialTemplate={resolvedTemplate}
      >
        <EditorShell
          initialBusinessName={initialBusinessName}
          initialTheme={initialTheme}
          projectId={projectId}
        />
      </EditorProvider>
    </MobileGuard>
  );
}
