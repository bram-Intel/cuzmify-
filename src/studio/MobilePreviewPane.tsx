'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Instagram,
  Scissors,
  Phone,
  CheckCircle2,
  Lock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  Image as ImageIcon,
  UploadCloud,
  Type,
  Check,
  Loader2,
  Crosshair,
  Copy,
  ArrowUp,
  Play,
} from 'lucide-react';
import { useEditor } from './engine/EditorContext';
import { StudioLoader } from './StudioLoader';
import { renderTemplateEngine, TEMPLATE_ENGINES, TEMPLATE_ENGINE_LIST } from '@/core/template-engines';
import { createDefaultBlueprint, type MediaVaultAsset } from '@/core/blueprint-schema';
import {
  getAssetPosterUrl,
  getAssetRenderSource,
  isVideoMediaUrl,
  resolveAssetMediaKind,
} from '@/core/media-utils';
import { compressImageFileToWebP } from '@/lib/image-compress';
import {
  applyMobileImageReplacement,
  applyMobileTextEdit,
  findEditableMobileTextElement,
  resolveMobileImageTarget,
  resolveMobileTextTarget,
  type MobileImageTarget,
  type MobileTextTarget,
} from './mobile-preview-edit';
import {
  buildElementSnapshotFromDom,
  copyTextToClipboard,
  formatMcpElementReference,
  type CapturedElementSnapshot,
} from './mcp-target-clipboard';
import { AIPanel } from './ai/AIPanel';

/**
 * Memoized HTML container so local modal/drawer/input state updates never re-parse or flash preview DOM nodes.
 */
const MemoizedMobileSiteHtml = React.memo(function MemoizedMobileSiteHtml({
  html,
  className,
  rootRef,
  onClick,
  onDoubleClick,
  onTouchStart,
  onTouchEnd,
}: {
  html: string;
  className: string;
  rootRef?: React.RefObject<HTMLDivElement | null>;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
}) {
  const internalRef = useRef<HTMLDivElement | null>(null);

  const assignRef = (node: HTMLDivElement | null) => {
    internalRef.current = node;
    if (rootRef) {
      rootRef.current = node;
    }
  };

  // Ensure mobile browsers / iOS Safari auto-start muted inline video loops after dangerouslySetInnerHTML
  React.useEffect(() => {
    const container = internalRef.current;
    if (!container) return;
    const videos = Array.from(container.querySelectorAll('video'));
    const cleanups: Array<() => void> = [];
    for (const v of videos) {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      v.loop = true;
      v.autoplay = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      const tryPlay = () => {
        if (v.paused) void v.play().catch(() => {});
      };
      tryPlay();
      v.addEventListener('loadeddata', tryPlay);
      cleanups.push(() => v.removeEventListener('loadeddata', tryPlay));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return (
    <div
      ref={assignRef}
      className={className}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onSubmit={(e) => e.preventDefault()}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

/**
 * Touch-safe, 60fps Mobile Owner Studio (<1024px).
 * Supports direct 1-tap image swapping from the Media Vault (or phone upload),
 * double-tap inline text editing, AND 1-tap "Copy Element for MCP" for any div/img/text/section.
 */
export function MobilePreviewPane() {
  const {
    blueprint,
    businessName,
    projectId,
    templateId,
    nicheId,
    isPreviewMode,
    isHydratingSite,
    isRefreshing,
    activeModuleModal,
    service,
    handleTemplateSwitch,
    handleSave,
    handleRefreshSite,
    setActiveModuleModal,
    setSaveToast,
  } = useEditor();

  const [checklistCollapsed, setChecklistCollapsed] = useState(false);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);

  // Mobile quick-edit sheets
  const [activeImageTarget, setActiveImageTarget] = useState<MobileImageTarget | null>(null);
  const [activeImageEl, setActiveImageEl] = useState<HTMLImageElement | HTMLVideoElement | null>(null);
  const [activeTextTarget, setActiveTextTarget] = useState<MobileTextTarget | null>(null);
  const [activeTextEl, setActiveTextEl] = useState<HTMLElement | null>(null);
  const [textDraft, setTextDraft] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Mobile Pick-to-Copy Element mode (for copying ANY div, section, button, img, or text for external MCP agents)
  const [pickToCopyMode, setPickToCopyMode] = useState(false);
  const [pickedDomEl, setPickedDomEl] = useState<HTMLElement | null>(null);
  const [pickedSnapshot, setPickedSnapshot] = useState<CapturedElementSnapshot | null>(null);
  const [copiedBanner, setCopiedBanner] = useState(false);

  const previewRootRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTapRef = useRef<{ el: HTMLElement | null; time: number }>({ el: null, time: 0 });
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTouchTapRef = useRef<{ el: HTMLElement | null; x: number; y: number; time: number }>({
    el: null,
    x: 0,
    y: 0,
    time: 0,
  });
  const lastTouchEditOpenedAtRef = useRef<number>(0);

  const activeBp = useMemo(() => {
    if (blueprint) return blueprint;
    return createDefaultBlueprint({ name: businessName, templateId, nicheId });
  }, [blueprint, businessName, templateId, nicheId]);

  const lastRenderedRef = useRef<ReturnType<typeof renderTemplateEngine> | null>(null);
  const isCoveredByModal = Boolean(activeModuleModal);

  const rendered = useMemo(() => {
    // When full-screen modal (e.g. Services / Photos / Brand) covers the mobile preview,
    // defer template HTML string regeneration until the user returns to the preview.
    if (isCoveredByModal && lastRenderedRef.current) {
      return lastRenderedRef.current;
    }
    const next = renderTemplateEngine(templateId, activeBp, { siteId: projectId });
    lastRenderedRef.current = next;
    return next;
  }, [templateId, activeBp, projectId, isCoveredByModal]);

  const mediaVault = activeBp.mediaVault || [];
  const vaultAssets = mediaVault.filter((m) => Boolean(getAssetRenderSource(m)));
  const mediaCount = mediaVault.length;
  const serviceCount = activeBp.modules?.services?.items?.length || 0;
  const hasWhatsapp = Boolean((activeBp.modules?.whatsapp?.phoneNumber || activeBp.profile?.whatsapp || '').trim());
  const doneSteps = [mediaCount > 0, serviceCount > 0, hasWhatsapp].filter(Boolean).length;
  const allReady = doneSteps === 3;

  const cleanSlug = (businessName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28) || 'studio';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
  const previewDomainLabel = rootDomain ? `${cleanSlug}.${rootDomain}` : `cuzmify.vercel.app/s/${cleanSlug}`;
  const fontUrl = TEMPLATE_ENGINES[rendered.templateId]?.googleFontsUrl;

  const clearPickedHighlight = (el?: HTMLElement | null) => {
    const target = el ?? pickedDomEl;
    if (target) target.removeAttribute('data-cz-mobile-picked');
  };

  const selectElementForCopy = (el: HTMLElement) => {
    clearPickedHighlight();
    el.setAttribute('data-cz-mobile-picked', 'true');
    setPickedDomEl(el);
    setPickedSnapshot(
      buildElementSnapshotFromDom(el, {
        siteId: projectId,
        blueprint: activeBp,
        viewport: 'mobile',
      })
    );
    setCopiedBanner(false);
  };

  const copyDomElementToClipboard = async (el: HTMLElement | null) => {
    if (!el) return;
    const snap = buildElementSnapshotFromDom(el, {
      siteId: projectId,
      blueprint: activeBp,
      viewport: 'mobile',
    });
    const ok = await copyTextToClipboard(formatMcpElementReference(snap));
    if (ok) {
      setCopiedBanner(true);
      setSaveToast(`📋 Copied <${snap.tagName}> target for external MCP agent!`);
      setTimeout(() => setCopiedBanner(false), 1800);
      setTimeout(() => setSaveToast(null), 2600);
    }
  };

  const commitBlueprintUpdate = (nextBp: typeof activeBp, toastMsg: string) => {
    if (!service) return;
    const syncedBp = { ...nextBp, templateId };
    service.applyExternalBlueprint(syncedBp, projectId);
    void handleSave(true);
    setSaveToast(`✦ ${toastMsg}`);
    setTimeout(() => setSaveToast(null), 2400);
  };

  const openTextEditorForElement = (rawEl: HTMLElement, point?: { clientX: number; clientY: number }) => {
    const resolved = resolveMobileTextTarget(rawEl, activeBp, templateId, point);
    if (!resolved) return;
    lastTouchEditOpenedAtRef.current = Date.now();
    setActiveImageTarget(null);
    setActiveImageEl(null);
    setActiveTextEl(findEditableMobileTextElement(rawEl, point) || rawEl);
    setActiveTextTarget(resolved);
    setTextDraft(resolved.value);
  };

  const findClickedImage = (target: HTMLElement): HTMLImageElement | HTMLVideoElement | null => {
    if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
      return target as HTMLImageElement | HTMLVideoElement;
    }
    const mediaChild = target.querySelector('img, video');
    if (mediaChild && target.children.length <= 2) {
      return mediaChild as HTMLImageElement | HTMLVideoElement;
    }
    return null;
  };

  const handlePreviewTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handlePreviewTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || pickToCopyMode || e.changedTouches.length !== 1) return;

    const t = e.changedTouches[0];
    const moved = Math.hypot(t.clientX - start.x, t.clientY - start.y);
    const heldMs = Date.now() - start.time;
    // Ignore scroll pans or long-presses
    if (moved > 14 || heldMs > 400) return;

    const hitEl =
      (typeof document !== 'undefined'
        ? (document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null)
        : null) || (e.target as HTMLElement | null);
    if (!hitEl || !previewRootRef.current?.contains(hitEl)) return;
    if (hitEl.closest('input, select, textarea')) return;
    if (findClickedImage(hitEl)) return;

    const point = { clientX: t.clientX, clientY: t.clientY };
    const fieldEl = findEditableMobileTextElement(hitEl, point);
    if (!fieldEl) return;

    const now = Date.now();
    const prev = lastTouchTapRef.current;
    const dt = now - prev.time;
    const tapDist = Math.hypot(t.clientX - prev.x, t.clientY - prev.y);

    if (dt >= 35 && dt <= 550 && (prev.el === fieldEl || tapDist <= 28)) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      lastTouchTapRef.current = { el: null, x: 0, y: 0, time: 0 };
      lastTapRef.current = { el: null, time: 0 };
      lastTouchEditOpenedAtRef.current = now;
      openTextEditorForElement(fieldEl, point);
    } else {
      lastTouchTapRef.current = { el: fieldEl, x: t.clientX, y: t.clientY, time: now };
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget) return;

    if (rawTarget.closest('a, button, form')) {
      e.preventDefault();
    }

    if (Date.now() - lastTouchEditOpenedAtRef.current < 600) {
      return;
    }

    // Pick-to-Copy mode: tapping ANY element (div, section, img, button, h1, span) selects it to copy for MCP
    if (pickToCopyMode) {
      e.stopPropagation();
      if (previewRootRef.current && rawTarget !== previewRootRef.current) {
        selectElementForCopy(rawTarget);
      }
      return;
    }

    if (rawTarget.closest('input, select, textarea')) return;

    // 1. Single-tap on an image or video opens the Vault media swap sheet immediately
    const imgEl = findClickedImage(rawTarget);
    if (imgEl) {
      e.preventDefault();
      e.stopPropagation();
      const target = resolveMobileImageTarget(imgEl, activeBp);
      setActiveTextTarget(null);
      setActiveTextEl(null);
      setActiveImageEl(imgEl);
      setActiveImageTarget(target);
      return;
    }

    // 2. Click double-tap detection (<500ms on same editable element) for desktop/mouse/stylus
    const point = { clientX: e.clientX, clientY: e.clientY };
    const fieldEl = findEditableMobileTextElement(rawTarget, point);
    if (!fieldEl) return;

    const now = Date.now();
    const isSameField = lastTapRef.current.el === fieldEl;
    const withinWindow = now - lastTapRef.current.time <= 500;

    if (isSameField && withinWindow) {
      lastTapRef.current = { el: null, time: 0 };
      e.stopPropagation();
      openTextEditorForElement(fieldEl, point);
    } else {
      lastTapRef.current = { el: fieldEl, time: now };
    }
  };

  const handlePreviewDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pickToCopyMode) return;
    const rawTarget = e.target as HTMLElement | null;
    if (!rawTarget || rawTarget.tagName === 'IMG' || rawTarget.tagName === 'VIDEO') return;
    if (rawTarget.closest('a, button')) e.preventDefault();
    const point = { clientX: e.clientX, clientY: e.clientY };
    const fieldEl = findEditableMobileTextElement(rawTarget, point);
    if (!fieldEl) return;
    lastTapRef.current = { el: null, time: 0 };
    openTextEditorForElement(fieldEl, point);
  };

  const handleStepToParent = () => {
    if (!pickedDomEl || !previewRootRef.current) return;
    const parent = pickedDomEl.parentElement;
    if (parent && parent !== previewRootRef.current && previewRootRef.current.contains(parent)) {
      selectElementForCopy(parent);
    }
  };

  const handlePickVaultAsset = (asset: MediaVaultAsset) => {
    if (!activeImageTarget) return;
    const { blueprint: nextBp, summary } = applyMobileImageReplacement(activeBp, activeImageTarget, asset);
    commitBlueprintUpdate(nextBp, summary);
    setActiveImageTarget(null);
    setActiveImageEl(null);
  };

  const handleUploadNewPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImageTarget) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('Media file exceeds 15MB. Please pick a smaller image or video.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const isVideo = file.type.startsWith('video/');
      const dataUrl = isVideo
        ? await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(file);
          })
        : await compressImageFileToWebP(file, 1200, 0.8);
      const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
      const defaultName = isVideo ? 'Uploaded Video' : 'Uploaded Photo';
      const cleanName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : defaultName;
      const uploadedAsset: MediaVaultAsset = {
        id: `mv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        url: dataUrl,
        thumbnailUrl: isVideo ? undefined : dataUrl,
        name: cleanName,
        type:
          activeImageTarget.role === 'hero'
            ? 'hero'
            : isVideo
              ? 'video'
              : activeImageTarget.role === 'service'
                ? 'service'
                : 'gallery',
        mediaKind: isVideo ? 'video' : 'image',
        mimeType: file.type || undefined,
        source: 'upload',
        addedAt: new Date().toISOString(),
      };
      const { blueprint: nextBp, summary } = applyMobileImageReplacement(activeBp, activeImageTarget, uploadedAsset);
      commitBlueprintUpdate(nextBp, summary);
      setActiveImageTarget(null);
      setActiveImageEl(null);
    } catch {
      alert('Could not process media file.');
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
    setActiveTextEl(null);
  };

  const pickedImgChild = pickedDomEl ? findClickedImage(pickedDomEl) : null;
  const pickedEditableField = pickedDomEl ? resolveMobileTextTarget(pickedDomEl, activeBp, templateId) : null;

  // Full-screen interactive Live Preview on Mobile when bottom "Preview" button is tapped
  if (isPreviewMode) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white lg:hidden">
        {fontUrl && <link rel="stylesheet" href={fontUrl} />}
        {isHydratingSite || !blueprint ? (
          <StudioLoader
            title="Initializing Cuzmify Studio"
            subtitle="Loading your live mobile preview…"
            className="flex-1 min-h-[360px]"
          />
        ) : (
          <MemoizedMobileSiteHtml
            html={rendered.fullHtml}
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
          />
        )}
      </div>
    );
  }

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
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-3 space-y-3">
        {/* 2. Guided Setup Card (only once hydrated so 0/3 never flashes over ready sites) */}
        {!isHydratingSite && blueprint && !allReady && (
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

        {/* 3. Framed Live Website Preview with Tap-Photo, Double-Tap Text & Copy MCP Target */}
        <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-white">
          {/* Mini Browser Address Bar */}
          <div className="h-9 bg-slate-50 border-b border-slate-200 px-2.5 flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-mono text-slate-600 truncate min-w-0">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{previewDomainLabel}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = !pickToCopyMode;
                  setPickToCopyMode(next);
                  if (!next) {
                    clearPickedHighlight();
                    setPickedDomEl(null);
                    setPickedSnapshot(null);
                  } else {
                    setActiveImageTarget(null);
                    setActiveTextTarget(null);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                  pickToCopyMode
                    ? 'bg-[#0D5771] text-white border-[#0D5771] shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-[#0D5771]/40'
                }`}
                title="Tap any div, image, button, or section to copy its MCP reference"
              >
                <Crosshair className="w-3 h-3" />
                <span>{pickToCopyMode ? 'Picking' : 'Copy Target'}</span>
              </button>

              <button
                type="button"
                onClick={() => void handleRefreshSite()}
                disabled={isRefreshing}
                title="Refresh preview with latest Desktop or MCP changes"
                className="px-2 py-1 rounded-lg bg-[#0D5771]/10 hover:bg-[#0D5771]/18 text-[#0D5771] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-60"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Lightweight Touch Editing Hint Bar */}
          {pickToCopyMode ? (
            <div className="px-3 py-1.5 bg-[#0D5771] text-white flex items-center justify-center gap-2 text-[10px] font-mono font-bold">
              <Crosshair className="w-3 h-3 text-amber-300 shrink-0" />
              <span>Copy Target Mode · Tap any div, photo, button, or section</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-[#0D5771]/5 border-b border-slate-100 flex items-center justify-center gap-3 text-[10px] font-mono text-[#0D5771]">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3 shrink-0" />
                <span>Tap media to swap</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <Type className="w-3 h-3 shrink-0" />
                <span>Double-tap text to edit</span>
              </span>
            </div>
          )}

          {/* Interactive Live Rendered Site (shows signature StudioLoader while hydrating user DB data) */}
          {isHydratingSite || !blueprint ? (
            <StudioLoader
              title="Initializing Cuzmify Studio"
              subtitle="Syncing photos, services & design tokens…"
              className="min-h-[420px]"
            />
          ) : (
            <>
              <style>{`
                .cz-mobile-editable-preview {
                  touch-action: pan-y;
                  overflow-x: hidden;
                  max-width: 100%;
                  -webkit-user-select: none;
                  user-select: none;
                  -webkit-touch-callout: none;
                }
                .cz-mobile-editable-preview * {
                  touch-action: manipulation;
                }
                .cz-mobile-editable-preview form input,
                .cz-mobile-editable-preview form select,
                .cz-mobile-editable-preview form textarea {
                  pointer-events: none;
                }
                .cz-mobile-editable-preview img,
                .cz-mobile-editable-preview video {
                  cursor: pointer;
                }
                .cz-mobile-editable-preview [data-cuzmify-field],
                .cz-mobile-editable-preview [data-cuzmify-slot],
                .cz-mobile-editable-preview [data-cuzmify-type="custom-section"],
                .cz-mobile-editable-preview [data-cuzmify-type="faq"],
                .cz-mobile-editable-preview [data-cuzmify-type="testimonials"] {
                  cursor: text;
                }
                .cz-mobile-editable-preview [data-cz-mobile-picked="true"] {
                  outline: 2px solid #0D5771 !important;
                  outline-offset: 2px !important;
                  box-shadow: 0 0 0 4px rgba(13, 87, 113, 0.2) !important;
                }
              `}</style>
              <MemoizedMobileSiteHtml
                rootRef={previewRootRef}
                html={rendered.fullHtml}
                className="cz-mobile-editable-preview"
                onClick={handlePreviewClick}
                onDoubleClick={handlePreviewDoubleClick}
                onTouchStart={handlePreviewTouchStart}
                onTouchEnd={handlePreviewTouchEnd}
              />
            </>
          )}
        </div>
      </div>

      {/* ── SLICK MOBILE TRAY: PICKED ELEMENT COPY FOR EXTERNAL MCP ── */}
      {pickToCopyMode && pickedSnapshot && (
        <div className="fixed inset-x-0 bottom-16 z-[100000] p-3 pointer-events-none flex justify-center">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-3.5 space-y-2.5 pointer-events-auto animate-in slide-in-from-bottom duration-150">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-[#0D5771]/10 text-[#0D5771] text-[11px] font-mono font-bold shrink-0">
                  &lt;{pickedSnapshot.tagName}{pickedSnapshot.id ? `#${pickedSnapshot.id}` : ''}&gt;
                </span>
                <span className="text-[11px] font-mono text-slate-500 truncate">
                  {pickedSnapshot.selector}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearPickedHighlight();
                  setPickedDomEl(null);
                  setPickedSnapshot(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pickedSnapshot.text && (
              <p className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 line-clamp-2">
                &ldquo;{pickedSnapshot.text}&rdquo;
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleStepToParent}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                title="Select parent wrapper div or section"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Parent</span>
              </button>

              {pickedImgChild && (
                <button
                  type="button"
                  onClick={() => {
                    clearPickedHighlight();
                    setPickToCopyMode(false);
                    setActiveImageEl(pickedImgChild);
                    setActiveImageTarget(resolveMobileImageTarget(pickedImgChild, activeBp));
                    setPickedDomEl(null);
                    setPickedSnapshot(null);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                >
                  {pickedImgChild.tagName === 'VIDEO' ? 'Swap Video' : 'Swap Media'}
                </button>
              )}

              {pickedEditableField && (
                <button
                  type="button"
                  onClick={() => {
                    clearPickedHighlight();
                    setPickToCopyMode(false);
                    if (pickedDomEl) openTextEditorForElement(pickedDomEl);
                    setPickedDomEl(null);
                    setPickedSnapshot(null);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                >
                  Edit Text
                </button>
              )}

              <button
                type="button"
                onClick={() => copyDomElementToClipboard(pickedDomEl)}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  copiedBanner
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0D5771] hover:bg-[#083D50] text-white shadow-sm'
                }`}
              >
                {copiedBanner ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBanner ? 'Copied for MCP!' : 'Copy Target for MCP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SLICK MOBILE BOTTOM SHEET 1: VAULT IMAGE PICKER ── */}
      {activeImageTarget && (
        <div
          className="fixed inset-0 z-[100001] bg-slate-950/60 backdrop-blur-[2px] flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => {
            setActiveImageTarget(null);
            setActiveImageEl(null);
          }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-4 pb-6 space-y-4 animate-in slide-in-from-bottom duration-200 max-h-[82vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Pill & Header */}
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto shrink-0" />
            <div className="flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
                  {activeImageTarget.currentSrc &&
                    (activeImageTarget.mediaKind === 'video' || isVideoMediaUrl(activeImageTarget.currentSrc) ? (
                      <video
                        src={activeImageTarget.currentSrc}
                        muted
                        loop
                        autoPlay
                        playsInline
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activeImageTarget.currentSrc}
                        alt={activeImageTarget.label}
                        className="w-full h-full object-cover"
                      />
                    ))}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[#0D5771] font-bold">
                    {activeImageTarget.mediaKind === 'video' ? 'Replace Video' : 'Replace Photo'}
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{activeImageTarget.label}</h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyDomElementToClipboard(activeImageEl)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Copy target element for external MCP agent"
                >
                  <Copy className="w-3.5 h-3.5 text-[#0D5771]" />
                  <span>Copy MCP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageTarget(null);
                    setActiveImageEl(null);
                  }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Phone Upload CTA */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
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
              <span>{isUploadingPhoto ? 'Uploading…' : 'Upload Photo or Video from Phone'}</span>
            </button>

            {/* Media Vault Grid */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                  Media Vault ({vaultAssets.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageTarget(null);
                    setActiveImageEl(null);
                    setActiveModuleModal('media');
                  }}
                  className="text-[11px] font-bold text-[#0D5771] cursor-pointer"
                >
                  Open Full Vault →
                </button>
              </div>

              {vaultAssets.length === 0 ? (
                <div className="py-8 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  No photos or videos in your Media Vault yet. Upload one above!
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 pb-1">
                  {vaultAssets.map((asset) => {
                    const mediaSrc = getAssetRenderSource(asset);
                    const poster = getAssetPosterUrl(asset);
                    const kind = resolveAssetMediaKind(asset);
                    const isCurrent =
                      activeImageTarget.currentSrc === mediaSrc ||
                      activeImageTarget.currentSrc === asset.url ||
                      (Boolean(poster) && activeImageTarget.currentSrc === poster) ||
                      (activeImageTarget.assetId && activeImageTarget.assetId === asset.id);
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handlePickVaultAsset(asset)}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all cursor-pointer bg-slate-900 ${
                          isCurrent
                            ? 'border-[#0D5771] ring-2 ring-[#0D5771]/25'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {kind === 'video' ? (
                          poster ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={poster} alt={asset.name} className="w-full h-full object-cover opacity-85" />
                          ) : (
                            <video src={mediaSrc} muted playsInline preload="metadata" className="w-full h-full object-cover opacity-85" />
                          )
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={mediaSrc} alt={asset.name} className="w-full h-full object-cover" />
                        )}
                        {kind === 'video' && (
                          <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/75 text-white text-[9px] font-mono font-bold inline-flex items-center gap-0.5">
                            <Play className="w-2.5 h-2.5 fill-white" />
                            <span>VID</span>
                          </span>
                        )}
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
          onClick={() => {
            if (Date.now() - lastTouchEditOpenedAtRef.current < 400) return;
            setActiveTextTarget(null);
            setActiveTextEl(null);
          }}
        >
          <form
            onSubmit={handleSaveTextEdit}
            className="w-full max-w-lg bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-4 pb-6 space-y-3 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto" />
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#0D5771] font-bold">
                  Inline Edit
                </p>
                <h3 className="text-sm font-bold text-slate-900 truncate">{activeTextTarget.label}</h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => copyDomElementToClipboard(activeTextEl)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  title="Copy target element for external MCP agent"
                >
                  <Copy className="w-3.5 h-3.5 text-[#0D5771]" />
                  <span>Copy MCP</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTextTarget(null);
                    setActiveTextEl(null);
                  }}
                  className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
                onClick={() => {
                  setActiveTextTarget(null);
                  setActiveTextEl(null);
                }}
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
