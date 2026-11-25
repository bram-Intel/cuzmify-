'use client';

import React, { useMemo } from 'react';
import { Instagram, Scissors, Phone, CheckCircle2 } from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import { renderTemplateEngine, TEMPLATE_ENGINES } from '@/core/template-engines';
import { createDefaultBlueprint } from '@/core/blueprint-schema';

/**
 * Touch-safe, 60fps Mobile Owner Preview (<1024px).
 * Replaces mouse-centric GrapesJS drag handles on phones so owners can scroll naturally,
 * switch between the 3 Template Engines in 1 tap, and open structured bottom sheets to edit.
 */
export function MobilePreviewPane() {
  const { blueprint, businessName, templateId, nicheId, setActiveModuleModal } = useEditor();

  const activeBp = useMemo(() => {
    if (blueprint) return blueprint;
    return createDefaultBlueprint({ name: businessName, templateId, nicheId });
  }, [blueprint, businessName, templateId, nicheId]);

  const rendered = useMemo(
    () => renderTemplateEngine(templateId, activeBp),
    [templateId, activeBp]
  );

  const mediaCount = activeBp.mediaVault?.length || 0;
  const serviceCount = activeBp.modules?.services?.items?.length || 0;
  const hasWhatsapp = Boolean((activeBp.modules?.whatsapp?.phoneNumber || activeBp.profile?.whatsapp || '').trim());
  const allReady = mediaCount > 0 && serviceCount > 0 && hasWhatsapp;

  const fontUrl = TEMPLATE_ENGINES[rendered.templateId]?.googleFontsUrl;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F1F5F9] lg:hidden">
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      {/* Guided Quick-Setup Checklist Banner (auto-collapses once complete) */}
      {!allReady && (
        <div className="mx-3 mt-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D5771]">
              Quick Mobile Setup
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              {[mediaCount > 0, serviceCount > 0, hasWhatsapp].filter(Boolean).length}/3 done
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveModuleModal('media')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                mediaCount > 0
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Instagram className="w-3.5 h-3.5 text-pink-600" />
                {mediaCount > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <span className="text-[10px] font-bold block leading-tight">
                {mediaCount > 0 ? `${mediaCount} Photos` : '1. Add Photos'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModuleModal('services')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                serviceCount > 0
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Scissors className="w-3.5 h-3.5 text-amber-600" />
                {serviceCount > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <span className="text-[10px] font-bold block leading-tight">
                {serviceCount > 0 ? `${serviceCount} Services` : '2. Add Rates'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModuleModal('whatsapp')}
              className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                hasWhatsapp
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                {hasWhatsapp && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
              <span className="text-[10px] font-bold block leading-tight">
                {hasWhatsapp ? 'WA Linked' : '3. WhatsApp'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Live Native-Scroll Mobile Website Preview */}
      <div className="m-3 rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white flex-1">
        <div
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: rendered.fullHtml }}
        />
      </div>
    </div>
  );
}
