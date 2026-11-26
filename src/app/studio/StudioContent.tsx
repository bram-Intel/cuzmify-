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
import { StudioLoader } from '@/studio/StudioLoader';

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
    return <StudioLoader subtitle="Verifying Cuzmify session…" className="h-screen w-screen" />;
  }

  if (!session) {
    return <StudioAuthGate callbackUrl={`/studio?${searchParams.toString()}`} />;
  }

  const resolvedNiche = resolveNicheBlueprint(categoryParam);
  const resolvedTemplate = templateParam
    ? resolveTemplateEngineId(templateParam)
    : resolvedNiche.recommendedTemplate;
  const initialTheme: ThemeName = resolvedTemplate === 'noir-showcase' ? 'dark-obsidian' : 'bram-light';
  const cleanAccountFirst = session?.user?.name
    ? session.user.name
        .split(/[@._\s]+/)[0]
        .replace(/^\w/, (c) => c.toUpperCase())
    : '';
  const userAccountName = cleanAccountFirst ? `${cleanAccountFirst}'s Studio` : 'My Studio';
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
