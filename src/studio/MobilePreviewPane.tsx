'use client';

import React, { useMemo, useState } from 'react';
import { Instagram, Scissors, Phone, CheckCircle2, Lock, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import { renderTemplateEngine, TEMPLATE_ENGINES, TEMPLATE_ENGINE_LIST } from '@/core/template-engines';
import { createDefaultBlueprint } from '@/core/blueprint-schema';

/**
 * Touch-safe, 60fps Mobile Owner Studio (<1024px).
 * Gives phone creators a dedicated 1-tap Website Style Bar, a collapsible 3-step setup guide,
 * and a framed live scrollable preview of their actual site without mouse-only drag handles.
 */
export function MobilePreviewPane() {
  const {
    blueprint,
    businessName,
    projectId,
    templateId,
    nicheId,
    handleTemplateSwitch,
    setActiveModuleModal,
  } = useEditor();

  const [checklistCollapsed, setChecklistCollapsed] = useState(false);

  const activeBp = useMemo(() => {
    if (blueprint) return blueprint;
    return createDefaultBlueprint({ name: businessName, templateId, nicheId });
  }, [blueprint, businessName, templateId, nicheId]);

  const rendered = useMemo(
    () => renderTemplateEngine(templateId, activeBp, { siteId: projectId }),
    [templateId, activeBp, projectId]
  );

  const mediaCount = activeBp.mediaVault?.length || 0;
  const serviceCount = activeBp.modules?.services?.items?.length || 0;
  const hasWhatsapp = Boolean((activeBp.modules?.whatsapp?.phoneNumber || activeBp.profile?.whatsapp || '').trim());
  const doneSteps = [mediaCount > 0, serviceCount > 0, hasWhatsapp].filter(Boolean).length;
  const allReady = doneSteps === 3;

  const cleanSlug = (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28) || 'studio';
  const fontUrl = TEMPLATE_ENGINES[rendered.templateId]?.googleFontsUrl;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F1F5F9] lg:hidden">
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      {/* 1. Dedicated Mobile Style Switcher Strip — Thumb-Friendly & Zero Crowding */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 shrink-0 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
          Style
        </span>
        <div className="flex-1 max-w-xs grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
          {TEMPLATE_ENGINE_LIST.map((tpl) => {
            const isSelected = templateId === tpl.id;
            const shortName =
              tpl.id === 'editorial-atelier' ? 'Editorial' : tpl.id === 'noir-showcase' ? 'Noir' : 'Modern';
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleTemplateSwitch(tpl.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSelected ? 'bg-white text-[#0D5771] shadow-2xs' : 'text-slate-600'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0"
                  style={{ backgroundColor: tpl.swatches[0] === '#09090B' ? '#09090B' : tpl.swatches[2] }}
                />
                <span className="truncate">{shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Workspace Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 2. Guided Setup Card (Collapsible so preview gets full room) */}
        {!allReady && (
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
            <button
              type="button"
              onClick={() => setChecklistCollapsed(!checklistCollapsed)}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A] font-display">
                  Quick Website Setup
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#0D5771]/10 text-[#0D5771] text-[10px] font-mono font-bold">
                  {doneSteps}/3 ready
                </span>
              </div>
              {checklistCollapsed ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {!checklistCollapsed && (
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setActiveModuleModal('media')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    mediaCount > 0
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Instagram className="w-4 h-4 text-pink-600" />
                    {mediaCount > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-xs font-bold block leading-tight">
                    {mediaCount > 0 ? `${mediaCount} Photos` : 'Add Photos'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModuleModal('services')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    serviceCount > 0
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Scissors className="w-4 h-4 text-amber-600" />
                    {serviceCount > 0 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-xs font-bold block leading-tight">
                    {serviceCount > 0 ? `${serviceCount} Packages` : 'Add Rates'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModuleModal('whatsapp')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    hasWhatsapp
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    {hasWhatsapp && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                  <span className="text-xs font-bold block leading-tight">
                    {hasWhatsapp ? 'WA Linked' : 'WhatsApp'}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Framed Live Website Preview */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-white">
          {/* Mini Browser Address Bar */}
          <div className="h-9 bg-slate-50 border-b border-slate-200 px-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-mono text-slate-600 truncate min-w-0">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">cuzmify.vercel.app/s/{cleanSlug}</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModuleModal('profile')}
              className="px-2.5 py-1 rounded-lg bg-[#0D5771]/10 text-[#0D5771] text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Edit Info</span>
            </button>
          </div>

          {/* Live Rendered Site */}
          <div
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: rendered.fullHtml }}
          />
        </div>
      </div>
    </div>
  );
}
