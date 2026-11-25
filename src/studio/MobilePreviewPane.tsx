'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Instagram,
  Scissors,
  Phone,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Image as ImageIcon,
  UploadCloud,
  Type,
  Check,
  Loader2,
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import { renderTemplateEngine, TEMPLATE_ENGINES, TEMPLATE_ENGINE_LIST } from '@/core/template-engines';
import { createDefaultBlueprint, type MediaVaultAsset } from '@/core/blueprint-schema';
import { compressImageFileToWebP } from '@/lib/image-compress';
import {
  applyMobileImageReplacement,
  applyMobileTextEdit,
  resolveMobileImageTarget,
  resolveMobileTextTarget,
  type MobileImageTarget,
  type MobileTextTarget,
} from './mobile-preview-edit';
import { AIPanel } from './ai/AIPanel';

/**
 * Touch-safe, 60fps Mobile Owner Studio (<1024px).
 * Supports direct 1-tap image swapping from the Media Vault (or phone upload)
 * and double-tap inline text editing via slick mobile bottom sheets.
 */
export function MobilePreviewPane() {
  const {
    blueprint,
    businessName,
    projectId,
    templateId,
    nicheId,
    service,
    handleTemplateSwitch,
    handleSave,
    setActiveModuleModal,
    setSaveToast,
  } = useEditor();

  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);

  // Mobile quick-edit sheets
  const [activeImageTarget, setActiveImageTarget] = useState<MobileImageTarget | null>(null);
  const [activeTextTarget, setActiveTextTarget] = useState<MobileTextTarget | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<{ el: HTMLElement | null; time: number }>({ el: null, time: 0 });

  const activeBp = useMemo(() => {
    if (blueprint) return blueprint;
    return createDefaultBlueprint({ name: businessName, templateId, nicheId });
  }, [blueprint, businessName, templateId, nicheId]);

  const rendered = useMemo(
    () => renderTemplateEngine(templateId, activeBp, { siteId: projectId }),
    [templateId, activeBp, projectId]
  );

  const mediaVault = activeBp.mediaVault || [];
  const imageAssets = mediaVault.filter((m) => m.type !== 'video' && Boolean(m.thumbnailUrl || m.url));
  const mediaCount = mediaVault.length;
  const serviceCount = activeBp.modules?.services?.items?.length || 0;
  const hasWhatsapp = Boolean((activeBp.modules?.whatsapp?.phoneNumber || activeBp.profile?.whatsapp || '').trim());
  const doneSteps = [mediaCount > 0, serviceCount > 0, hasWhatsapp].filter(Boolean).length;
  const allReady = doneSteps === 3;

  const cleanSlug = (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28) || 'studio';
  const fontUrl = TEMPLATE_ENGINES[rendered.templateId]?.googleFontsUrl;

  const commitBlueprintUpdate = (nextBp: typeof activeBp, toastMsg: string) => {
    if (!service) return;
    service.applyExternalBlueprint(nextBp, projectId);
    void handleSave(true);
    setSaveToast(`✦ ${toastMsg}`);
    setTimeout(() => setSaveToast(null), 2400);
  };

  const openTextEditorForElement = (rawEl: HTMLElement) => {
    const resolved = resolveMobileTextTarget(rawEl, activeBp);
    if (!resolved) return;
    setActiveImageTarget(null);
    setActiveTextTarget(resolved);
    setTextDraft(resolved.value);
  };

  const findClickedImage = (target: HTMLElement): HTMLImageElement | null => {
    if (target.tagName === 'IMG') return target as HTMLImageElement;
    // Handle containers wrapping images (e.g. .cz-hero-media or aspect-ratio boxes)
    const imgChild = target.querySelector('img');
    if (imgChild && target.children.length <= 2) return imgChild as HTMLImageElement;
    return null;
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget) return;

    // Prevent links/buttons inside preview from navigating while editing on mobile
    if (rawTarget.closest('a, button, form')) {
      e.preventDefault();
    }

    // Ignore form inputs so user isn't surprised
    if (rawTarget.closest('input, select, textarea')) return;

    // 1. Single-tap on an image opens the Vault image swap sheet immediately
    const imgEl = findClickedImage(rawTarget);
    if (imgEl) {
      e.stopPropagation();
      const target = resolveMobileImageTarget(imgEl, activeBp);
      setActiveTextTarget(null);
      setActiveImageTarget(target);
      return;
    }

    // 2. Touch/click double-tap detection (<360ms on same field) for slick mobile inline text edit
    const fieldEl = rawTarget.closest('[data-cuzmify-field]') as HTMLElement | null;
    if (!fieldEl) return;

    const now = Date.now();
    const isSameField = lastTapRef.current.el === fieldEl;
    const withinWindow = now - lastTapRef.current.time <= 360;

    if (isSameField && withinWindow) {
      lastTapRef.current = { el: null, time: 0 };
      e.stopPropagation();
      openTextEditorForElement(fieldEl);
    } else {
      lastTapRef.current = { el: fieldEl, time: now };
    }
  };

  const handlePreviewDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget || rawTarget.tagName === 'IMG') return;
    if (rawTarget.closest('a, button')) e.preventDefault();
    const fieldEl = rawTarget.closest('[data-cuzmify-field]') as HTMLElement | null;
    if (!fieldEl) return;
    lastTapRef.current = { el: null, time: 0 };
    openTextEditorForElement(fieldEl);
  };

  const handlePickVaultAsset = (asset: MediaVaultAsset) => {
    if (!activeImageTarget) return;
    const { blueprint: nextBp, summary } = applyMobileImageReplacement(activeBp, activeImageTarget, asset);
    commitBlueprintUpdate(nextBp, summary);
    setActiveImageTarget(null);
  };

  const handleUploadNewPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImageTarget) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Photo exceeds 15MB. Please pick a smaller image.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const dataUrl = await compressImageFileToWebP(file, 1200, 0.8);
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
      const cleanName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : 'Uploaded Photo';
      const uploadedAsset: MediaVaultAsset = {
        id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: dataUrl,
        thumbnailUrl: dataUrl,
        name: cleanName,
        type: activeImageTarget.role === 'hero' ? 'hero' : activeImageTarget.role === 'service' ? 'service' : 'gallery',
        source: 'upload',
        addedAt: new Date().toISOString(),
      };
      const { blueprint: nextBp, summary } = applyMobileImageReplacement(activeBp, activeImageTarget, uploadedAsset);
      commitBlueprintUpdate(nextBp, summary);
      setActiveImageTarget(null);
    } catch {
      alert('Could not process photo.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveTextEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTextTarget) return;
    const { blueprint: nextBp, summary } = applyMobileTextEdit(activeBp, activeTextTarget, textDraft);
    commitBlueprintUpdate(nextBp, summary);
    setActiveTextTarget(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#F1F5F9] lg:hidden">
      {fontUrl && <link rel="stylesheet" href={fontUrl} />}

      {/* 1. Dedicated Mobile Style Switcher + AI Assistant Trigger */}
      <div className="bg-white border-b border-slate-200 px-3 py-2 shrink-0 flex items-center gap-2">
        <div className="flex-1 grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
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

        <button
          type="button"
          onClick={() => setMobileAiOpen(!mobileAiOpen)}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer border ${
            mobileAiOpen
              ? 'bg-[#0D5771] text-white border-[#0D5771]'
              : 'bg-[#0D5771]/8 text-[#0D5771] border-[#0D5771]/20'
          }`}
          title="Open AI Website Assistant"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI</span>
        </button>
      </div>

      {/* Collapsible Mobile AI Assistant Sheet */}
      {mobileAiOpen && (
        <div className="bg-slate-50 border-b border-slate-200 p-3 shrink-0">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-bold text-[#0D5771] uppercase tracking-wider font-mono">
              AI Website Assistant
            </span>
            <button
              type="button"
              onClick={() => setMobileAiOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Close</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <AIPanel />
        </div>
      )}

      {/* Scrollable Workspace Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 2. Guided Setup Card */}
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

        {/* 3. Framed Live Website Preview with Tap-Photo & Double-Tap Text Editing */}
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

          {/* Lightweight Touch Editing Hint Bar */}
          <div className="px-3 py-1.5 bg-[#0D5771]/5 border-b border-slate-100 flex items-center justify-center gap-3 text-[10px] font-mono text-[#0D5771]">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3 shrink-0" />
              <span>Tap photo to swap</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1">
              <Type className="w-3 h-3 shrink-0" />
              <span>Double-tap text to edit</span>
            </span>
          </div>

          {/* Interactive Live Rendered Site */}
          <style>{`
            .cz-mobile-editable-preview img {
              cursor: pointer;
              touch-action: manipulation;
            }
            .cz-mobile-editable-preview [data-cuzmify-field] {
              cursor: text;
              touch-action: manipulation;
            }
          `}</style>
          <div
            className="cz-mobile-editable-preview"
            onClick={handlePreviewClick}
            onDoubleClick={handlePreviewDoubleClick}
            onSubmit={(e) => e.preventDefault()}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: rendered.fullHtml }}
          />
        </div>
      </div>

      {/* ── SLICK MOBILE BOTTOM SHEET 1: VAULT IMAGE PICKER ── */}
      {activeImageTarget && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-950/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setActiveImageTarget(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-4 pb-6 space-y-4 animate-in slide-in-from-bottom duration-200 max-h-[82vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Pill & Header */}
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto shrink-0" />
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                  {activeImageTarget.currentSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeImageTarget.currentSrc}
                      alt={activeImageTarget.label}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#0D5771] font-bold">
                    Replace Photo
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{activeImageTarget.label}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveImageTarget(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Phone Upload CTA */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadNewPhoto}
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-2xl bg-[#0D5771] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#083D50] transition-all cursor-pointer shrink-0 disabled:opacity-60"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>{isUploadingPhoto ? 'Uploading…' : 'Upload New Photo from Phone'}</span>
            </button>

            {/* Media Vault Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Media Vault ({imageAssets.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageTarget(null);
                    setActiveModuleModal('media');
                  }}
                  className="text-[11px] font-bold text-[#0D5771] cursor-pointer"
                >
                  Open Full Vault →
                </button>
              </div>

              {imageAssets.length === 0 ? (
                <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No photos in your Media Vault yet. Upload one above!
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 pb-1">
                  {imageAssets.map((asset) => {
                    const thumb = asset.thumbnailUrl || asset.url;
                    const isCurrent =
                      activeImageTarget.currentSrc === thumb ||
                      activeImageTarget.currentSrc === asset.url ||
                      (activeImageTarget.assetId && activeImageTarget.assetId === asset.id);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handlePickVaultAsset(asset)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-[#0D5771] ring-2 ring-[#0D5771]/25'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb} alt={asset.name} className="w-full h-full object-cover" />
                        {isCurrent && (
                          <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0D5771] text-white flex items-center justify-center shadow-sm">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SLICK MOBILE BOTTOM SHEET 2: DOUBLE-TAP TEXT EDITOR ── */}
      {activeTextTarget && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-950/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setActiveTextTarget(null)}
        >
          <form
            onSubmit={handleSaveTextEdit}
            className="w-full max-w-lg bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-4 pb-6 space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#0D5771] font-bold">
                  Inline Edit
                </p>
                <h3 className="text-sm font-bold text-slate-900">{activeTextTarget.label}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTextTarget(null)}
                className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeTextTarget.multiline ? (
              <textarea
                autoFocus
                rows={3}
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-[#0D5771] text-slate-900"
              />
            ) : (
              <input
                autoFocus
                type={activeTextTarget.kind === 'service_price' ? 'number' : 'text'}
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-[#0D5771] text-slate-900"
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTextTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-[#0D5771] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-[#083D50] transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply &amp; Save</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
