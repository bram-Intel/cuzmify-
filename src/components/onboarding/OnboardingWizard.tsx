'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import {
  Camera,
  Palette,
  Utensils,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Zap,
  Instagram,
  Sparkles,
  Phone,
  Loader2,
  Check,
  MapPin,
  Calendar,
} from 'lucide-react';
import { AuthGate } from '@/components/auth/AuthGate';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SUPPORTED_CURRENCIES, type CurrencyCode, type MediaVaultAsset } from '@/core/blueprint-schema';
import { NICHE_LIST, resolveNicheBlueprint, type NicheId } from '@/core/niche-blueprints';
import { TEMPLATE_ENGINE_LIST, resolveTemplateEngineId, type TemplateEngineId } from '@/core/template-engines';
import { compressImageFileToWebP } from '@/lib/image-compress';
import { loadOnboardingDraftMedia, saveOnboardingDraftMedia } from '@/lib/onboarding-media-draft';
import { UploadCloud, X, Star } from 'lucide-react';

const CURRENCY_OPTIONS: CurrencyCode[] = ['NGN', 'USD', 'GBP', 'EUR', 'KES', 'ZAR', 'CAD', 'AED'];

const NICHE_ICONS: Record<NicheId, React.ElementType> = {
  beauty_makeup: Zap,
  photography_media: Camera,
  events_planning: Calendar,
  catering_cakes: Utensils,
  design_fashion: Palette,
  general_services: Sparkles,
};

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [businessName, setBusinessName] = useState('');
  const [nicheId, setNicheId] = useState<NicheId>('beauty_makeup');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('NGN');
  const [templateId, setTemplateId] = useState<TemplateEngineId>('editorial-atelier');
  const [city, setCity] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [mediaCount, setMediaCount] = useState<number>(0);
  const [uploadedAssets, setUploadedAssets] = useState<MediaVaultAsset[]>([]);
  const [isCompressingPhotos, setIsCompressingPhotos] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const categoryFromUrl = searchParams.get('category') || searchParams.get('nicheId');
    const templateFromUrl = searchParams.get('template') || searchParams.get('templateId');
    const nameFromUrl = searchParams.get('name');
    const currencyFromUrl = searchParams.get('currency') as CurrencyCode | null;
    const instagramFromUrl = searchParams.get('instagram');
    const mediaCountFromUrl = searchParams.get('mediaCount');
    const stepFromUrl = searchParams.get('step');
    const errFromUrl = searchParams.get('error');

    if (categoryFromUrl) {
      const resolved = resolveNicheBlueprint(categoryFromUrl);
      setNicheId(resolved.id);
      if (!templateFromUrl) setTemplateId(resolved.recommendedTemplate);
    }
    if (templateFromUrl) {
      setTemplateId(resolveTemplateEngineId(templateFromUrl));
    }
    if (nameFromUrl) setBusinessName(nameFromUrl);
    if (currencyFromUrl && CURRENCY_OPTIONS.includes(currencyFromUrl)) {
      setSelectedCurrency(currencyFromUrl);
    }
    if (instagramFromUrl) {
      setInstagramHandle(instagramFromUrl.replace(/^@/, ''));
    }
    if (mediaCountFromUrl) {
      setMediaCount(parseInt(mediaCountFromUrl, 10) || 0);
    }
    if (errFromUrl) {
      setOauthError(errFromUrl);
    }
    if (stepFromUrl) {
      const parsed = parseInt(stepFromUrl, 10);
      if (parsed >= 1 && parsed <= 4) setStep(parsed as 1 | 2 | 3 | 4);
    }
    const existingDrafts = loadOnboardingDraftMedia();
    if (existingDrafts.length > 0) {
      setUploadedAssets(existingDrafts);
    }
  }, [searchParams]);

  const handleGalleryPhotosSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsCompressingPhotos(true);
    try {
      const newlyCompressed: MediaVaultAsset[] = [];
      for (const file of files.slice(0, 8)) {
        if (!file.type.startsWith('image/')) continue;
        const webp = await compressImageFileToWebP(file, 850, 0.72);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').slice(0, 40) || 'Portfolio Shot';
        newlyCompressed.push({
          id: `mv-up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: webp,
          thumbnailUrl: webp,
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          type: 'gallery',
          source: 'upload',
          addedAt: new Date().toISOString(),
        });
      }
      if (newlyCompressed.length > 0) {
        const merged = [...uploadedAssets, ...newlyCompressed].slice(0, 10).map((a, idx) => ({
          ...a,
          type: (idx === 0 ? 'hero' : 'gallery') as MediaVaultAsset['type'],
        }));
        setUploadedAssets(merged);
        saveOnboardingDraftMedia(merged);
      }
    } finally {
      setIsCompressingPhotos(false);
      e.target.value = '';
    }
  };

  const handleSetDraftCover = (id: string) => {
    const chosen = uploadedAssets.find((a) => a.id === id);
    if (!chosen) return;
    const next = [chosen, ...uploadedAssets.filter((a) => a.id !== id)].map((a, idx) => ({
      ...a,
      type: (idx === 0 ? 'hero' : 'gallery') as MediaVaultAsset['type'],
    }));
    setUploadedAssets(next);
    saveOnboardingDraftMedia(next);
  };

  const handleRemoveDraftPhoto = (id: string) => {
    const next = uploadedAssets
      .filter((a) => a.id !== id)
      .map((a, idx) => ({ ...a, type: (idx === 0 ? 'hero' : 'gallery') as MediaVaultAsset['type'] }));
    setUploadedAssets(next);
    saveOnboardingDraftMedia(next);
  };

  const activeNiche = NICHE_LIST.find((n) => n.id === nicheId) || NICHE_LIST[0];

  const handleSelectNiche = (id: NicheId) => {
    setNicheId(id);
    const found = NICHE_LIST.find((n) => n.id === id);
    if (found) setTemplateId(found.recommendedTemplate);
  };

  const handleLaunchSignedIn = async () => {
    setIsCreatingSite(true);
    const finalName = businessName.trim() || (instagramHandle ? instagramHandle : 'My Studio');
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalName,
          category: activeNiche.label,
          nicheId: activeNiche.id,
          templateId,
          template: TEMPLATE_ENGINE_LIST.find((t) => t.id === templateId)?.name || 'Editorial Atelier',
          currency: selectedCurrency,
          whatsappPhone,
          instagramHandle: instagramHandle || undefined,
          ...(uploadedAssets.length > 0 ? { mediaVault: uploadedAssets } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok && data?.site?.id) {
        const params = new URLSearchParams({
          projectId: data.site.id,
          name: finalName,
          nicheId: activeNiche.id,
          templateId,
          currency: selectedCurrency,
          ...(whatsappPhone ? { whatsapp: whatsappPhone } : {}),
          ...(instagramHandle ? { instagram: instagramHandle } : {}),
        });
        router.push(`/studio?${params.toString()}`);
        return;
      }
    } catch (err) {
      console.error('[Onboarding Create Site Error]:', err);
    } finally {
      setIsCreatingSite(false);
    }
    // Fallback direct studio open
    router.push(
      `/studio?name=${encodeURIComponent(finalName)}&nicheId=${encodeURIComponent(activeNiche.id)}&templateId=${encodeURIComponent(templateId)}&currency=${encodeURIComponent(selectedCurrency)}`
    );
  };

  const handleNext = () => {
    if (step === 3) {
      if (session?.user) {
        handleLaunchSignedIn();
      } else {
        setStep(4);
      }
      return;
    }
    if (step < 4) setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    else router.push('/');
  };

  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#FFFFFF] text-[#1A202C] flex flex-col justify-between relative overflow-hidden pb-8">
      <HeroCanvasBackground />

      {session?.user && step < 4 && (
        <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-3 relative z-10">
          <div className="bg-[#0D5771]/8 border border-[#0D5771]/20 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs">
            <span className="text-[#1A202C] truncate">
              Signed in as <strong>{session.user.name || session.user.email}</strong>
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-xl bg-[#0D5771] text-white font-bold text-[11px] shrink-0"
            >
              My Sites →
            </Link>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-3 pb-2 relative z-10">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#0D5771] mb-1.5">
          <span>STEP {Math.min(step, 3)} OF 3</span>
          <span className="uppercase text-[#64748B]">
            {step === 1 && '1. Brand & Niche'}
            {step === 2 && '2. Instagram & WhatsApp'}
            {step >= 3 && '3. Choose Your Look'}
          </span>
        </div>
        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#0D5771] to-[#3498E3] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
          />
        </div>
      </div>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-2 flex flex-col relative z-10 pb-28">
        {step === 4 ? (
          <AuthGate
            wizardSummary={{
              businessName: businessName.trim() || (instagramHandle ? instagramHandle : 'My Studio'),
              category: activeNiche.label,
              currency: selectedCurrency,
              template: templateId,
              whatsapp: whatsappPhone,
              instagramHandle: instagramHandle || undefined,
            }}
          />
        ) : (
          <>
            {/* ── STEP 1: Brand, Currency & Service Niche ── */}
            {step === 1 && (
              <div className="w-full space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h1 className="text-2xl font-extrabold font-display text-[#1A202C]">
                    Tell Us About Your Business
                  </h1>
                  <p className="text-xs text-[#64748B]">
                    Takes under 2 minutes on your phone. We only use your real details—never fake prices.
                  </p>
                </div>

                <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 shadow-2xs space-y-3.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#0D5771] uppercase tracking-wider block mb-1.5 font-mono">
                      Business / Brand Name *
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Tolu Artistry, Kemi Events, Studio Noir"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D5771] focus:bg-white rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1A202C] placeholder-slate-400 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#0D5771] uppercase tracking-wider block mb-1.5 font-mono">
                      City / Location (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Lagos, Abuja, London"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D5771] focus:bg-white rounded-xl pl-8 pr-3.5 py-2 text-xs text-[#1A202C] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#0D5771] uppercase tracking-wider block mb-1.5 font-mono">
                      Currency
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CURRENCY_OPTIONS.map((code) => {
                        const info = SUPPORTED_CURRENCIES[code];
                        const isSelected = selectedCurrency === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setSelectedCurrency(code)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0D5771] text-white shadow-xs'
                                : 'bg-[#F1F5F9] text-[#64748B] hover:text-[#1A202C]'
                            }`}
                          >
                            {info.symbol} {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block font-mono">
                    What Type of Vendor Are You?
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {NICHE_LIST.map((niche) => {
                      const IconComp = NICHE_ICONS[niche.id] || Sparkles;
                      const isSelected = nicheId === niche.id;
                      return (
                        <button
                          key={niche.id}
                          type="button"
                          onClick={() => handleSelectNiche(niche.id)}
                          className={`w-full p-3.5 rounded-2xl cursor-pointer text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-[#FFFFFF] border-2 border-[#0D5771] shadow-sm'
                              : 'bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-[#0D5771] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-xs text-[#1A202C] font-display">{niche.label}</h3>
                              <p className="text-[11px] text-[#64748B] truncate">{niche.subtitle}</p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0D5771] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Instagram Connect & WhatsApp ── */}
            {step === 2 && (
              <div className="w-full space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h1 className="text-2xl font-extrabold font-display text-[#1A202C]">
                    Connect Instagram &amp; WhatsApp
                  </h1>
                  <p className="text-xs text-[#64748B]">
                    Import your real portfolio posts automatically and receive structured client enquiries on WhatsApp.
                  </p>
                </div>

                {oauthError && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    Instagram connection didn&apos;t complete—make sure your IG account is switched to a free <strong>Creator</strong> or <strong>Business</strong> account, or continue and upload photos directly from your phone.
                  </div>
                )}

                <SpotlightCard className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white shrink-0">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1A202C]">Import Real Instagram Work</h3>
                        <p className="text-[11px] text-[#64748B]">Pulls your photos, multi-slide carousels &amp; reels</p>
                      </div>
                    </div>
                    {instagramHandle && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> @{instagramHandle}
                      </span>
                    )}
                  </div>

                  {instagramHandle && mediaCount > 0 && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold">
                      ✓ Imported {mediaCount} real assets from @{instagramHandle}. They&apos;ll appear straight in your portfolio!
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams({
                        name: businessName || 'My Studio',
                        category: activeNiche.id,
                        currency: selectedCurrency,
                      });
                      window.location.href = `/api/auth/instagram?${params.toString()}`;
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Instagram className="w-4 h-4" />
                    <span>{instagramHandle ? 'Reconnect / Refresh Instagram' : 'Connect Instagram (Official OAuth)'}</span>
                  </button>

                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Requires a whitelisted Instagram <strong>Creator</strong> or <strong>Business</strong> account while in Beta, or upload your photos directly below.
                  </p>
                </SpotlightCard>

                {/* Alternative First-Class Option: Direct Multi-Photo Gallery Upload */}
                <SpotlightCard className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0D5771]/10 flex items-center justify-center text-[#0D5771] shrink-0">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1A202C]">Upload Photos From Phone Gallery</h3>
                        <p className="text-[11px] text-[#64748B]">Pick 1–8 portfolio shots directly (auto-compressed WebP)</p>
                      </div>
                    </div>
                    {uploadedAssets.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                        {uploadedAssets.length} Ready
                      </span>
                    )}
                  </div>

                  <input
                    ref={galleryInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryPhotosSelected}
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={isCompressingPhotos}
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-dashed border-[#0D5771]/50 text-[#0D5771] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isCompressingPhotos ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Optimizing photos for fast loading…</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadedAssets.length > 0 ? '+ Add More Gallery Photos' : 'Choose Photos From Device'}</span>
                      </>
                    )}
                  </button>

                  {uploadedAssets.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 pt-1">
                      {uploadedAssets.map((asset, idx) => (
                        <div key={asset.id} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                          {idx === 0 ? (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#0D5771] text-white text-[8px] font-mono font-bold">
                              COVER
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetDraftCover(asset.id)}
                              title="Set as hero cover image"
                              className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[8px] font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              <Star className="w-2.5 h-2.5 text-amber-300" />
                              Cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftPhoto(asset.id)}
                            title="Remove photo"
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </SpotlightCard>

                <SpotlightCard className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1A202C]">WhatsApp Enquiry Number</h3>
                      <p className="text-[11px] text-[#64748B]">Clients send booking dates &amp; package choices here</p>
                    </div>
                  </div>

                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="e.g. 2348031234567 (include country code)"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-emerald-500 focus:bg-white rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold text-[#1A202C] focus:outline-none"
                    />
                  </div>
                </SpotlightCard>
              </div>
            )}

            {/* ── STEP 3: Choose From the 3 Real Lossless Template Engines ── */}
            {step === 3 && (
              <div className="w-full space-y-4 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h1 className="text-2xl font-extrabold font-display text-[#1A202C]">
                    Pick Your Website Look
                  </h1>
                  <p className="text-xs text-[#64748B]">
                    Every look is mobile-first. You can switch between all 3 anytime in 1 tap without losing your photos or services.
                  </p>
                </div>

                <div className="space-y-3">
                  {TEMPLATE_ENGINE_LIST.map((tpl) => {
                    const isSelected = templateId === tpl.id;
                    const isRec = activeNiche.recommendedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setTemplateId(tpl.id)}
                        className={`w-full p-4 rounded-2xl cursor-pointer text-left flex items-center justify-between gap-4 transition-all relative ${
                          isSelected
                            ? 'bg-[#FFFFFF] border-2 border-[#0D5771] shadow-md'
                            : 'bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Color Palette Preview Tile */}
                          <div
                            className="w-14 h-14 rounded-xl border border-black/10 flex flex-col justify-between p-2 shrink-0 shadow-2xs"
                            style={{ backgroundColor: tpl.swatches[0] }}
                          >
                            <div className="flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tpl.swatches[1] }} />
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tpl.swatches[2] }} />
                            </div>
                            <div className="h-1.5 w-8 rounded-full opacity-80" style={{ backgroundColor: tpl.swatches[1] }} />
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-[#1A202C] font-display">{tpl.name}</h3>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                                {tpl.vibe}
                              </span>
                              {isRec && (
                                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  ★ Best for {activeNiche.shortLabel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#64748B] leading-snug">{tpl.tagline}</p>
                          </div>
                        </div>

                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-[#0D5771] shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {step < 4 && (
        <div className="fixed bottom-4 left-0 w-full z-40 px-4 sm:px-6 flex justify-center pointer-events-none">
          <div className="max-w-xl w-full bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#E2E8F0] p-3 rounded-2xl flex justify-between items-center gap-3 shadow-lg pointer-events-auto">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C] font-bold text-xs cursor-pointer"
            >
              Back
            </button>

            <button
              type="button"
              disabled={isCreatingSite || (step === 1 && !businessName.trim())}
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isCreatingSite ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Building Your Site…</span>
                </>
              ) : (
                <>
                  <span>{step === 3 ? 'Generate My Website →' : 'Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const OnboardingWizard: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFFFF]" />}>
      <WizardContent />
    </Suspense>
  );
};
