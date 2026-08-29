'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { HeroCanvasBackground } from '@/components/ui/HeroCanvasBackground';
import {
  Camera,
  Palette,
  Store,
  Utensils,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Plus,
  Zap,
  Instagram,
  Rocket,
  Sparkles,
  Layers,
  FileCode,
  DollarSign,
  Phone,
  Loader2,
  Check,
  Globe,
  Music,
} from 'lucide-react';

import { AuthGate, WizardSummaryData } from '@/components/auth/AuthGate';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { SUPPORTED_CURRENCIES, CurrencyCode, MediaVaultAsset, ServiceItem } from '@/core/blueprint-schema';
import { InstagramImporter, InstagramImportResult } from '@/services/importer/instagram-importer';

interface CategoryOption {
  id: string;
  name: string;
  sub: string;
  icon: React.ElementType;
  recommendedTemplate: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'Makeup Artists & Beauty',
    name: 'Makeup Artists & Beauty',
    sub: 'Salons, bridal artists, spas, skincare',
    icon: Zap,
    recommendedTemplate: 'BeautyPro Studio Suite',
  },
  {
    id: 'Music Producers & Sound Studios',
    name: 'Music Producers & Sound Studios',
    sub: 'Recording studios, beat catalogs, mixing engineers, DJs',
    icon: Music,
    recommendedTemplate: 'SoundStage & Beat Studio',
  },
  {
    id: 'Fashion & Retail',
    name: 'Fashion & Retail',
    sub: 'Boutiques, apparel stores, makers',
    icon: Store,
    recommendedTemplate: 'Vogue Boutique & Catalog',
  },
  {
    id: 'Event Planning & Design',
    name: 'Event Planning & Design',
    sub: 'Wedding planners, decorators, caterers',
    icon: Utensils,
    recommendedTemplate: 'Couture Events & Planning',
  },
  {
    id: 'Photography & Media',
    name: 'Photography & Media',
    sub: 'Studios, portrait artists, videographers',
    icon: Camera,
    recommendedTemplate: 'Luxe Portrait & Studio Gallery',
  },
  {
    id: 'Creative Studio & Art',
    name: 'Creative Studio & Art',
    sub: 'Designers, brand agencies, artisans',
    icon: Palette,
    recommendedTemplate: 'Modern Creative Agency',
  },
];

const CURRENCY_OPTIONS: CurrencyCode[] = ['USD', 'NGN', 'GBP', 'EUR', 'CAD', 'AUD', 'AED', 'KES', 'ZAR'];

interface TemplateOption {
  id: string;
  name: string;
  tagline: string;
  category: string;
  imageUrl: string;
  type: 'ai_recommendation' | 'marketplace' | 'blank_canvas';
}

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [businessName, setBusinessName] = useState('Glory Beauty Studio');
  const [selectedCategory, setSelectedCategory] = useState<string>('Makeup Artists & Beauty');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('BeautyPro Studio Suite');

  // Social & Ingestion state
  const [instagramHandleInput, setInstagramHandleInput] = useState('');
  const [isIngestingInstagram, setIsIngestingInstagram] = useState(false);
  const [instagramResult, setInstagramResult] = useState<InstagramImportResult | null>(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  // AI Business Intelligence state
  const [aiAnalysis, setAiAnalysis] = useState<{
    nicheDetected: string;
    confidenceScore: number;
    recommendedTemplate: string;
    customTagline: string;
    generatedServices: any[];
    whatsappHook: string;
  } | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  const hasInitializedRef = useRef(false);

  const triggerAiAnalysis = useCallback(
    async (handle: string, bName: string, cat: string, cur: CurrencyCode, caps: string[]) => {
      setIsAnalyzingAi(true);
      try {
        const res = await fetch('/api/ai/analyze-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            handle,
            businessName: bName,
            category: cat,
            currency: cur,
            captions: caps,
          }),
        });
        if (res.ok) {
          const analysis = await res.json();
          setAiAnalysis(analysis);
          if (analysis.recommendedTemplate) {
            setSelectedTemplate(analysis.recommendedTemplate);
          }
        }
      } catch (e) {
        console.error('[AI Analysis Error]:', e);
      } finally {
        setIsAnalyzingAi(false);
      }
    },
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-sync state from URL query on initial mount (e.g. returning from Instagram OAuth callback)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const templateFromUrl = searchParams.get('template');
    const categoryFromUrl = searchParams.get('category');
    const nameFromUrl = searchParams.get('name');
    const currencyFromUrl = searchParams.get('currency') as CurrencyCode | null;
    const instagramFromUrl = searchParams.get('instagram');
    const stepFromUrl = searchParams.get('step');

    if (templateFromUrl) setSelectedTemplate(templateFromUrl);
    if (categoryFromUrl) setSelectedCategory(categoryFromUrl);
    if (nameFromUrl) setBusinessName(nameFromUrl);
    if (currencyFromUrl && CURRENCY_OPTIONS.includes(currencyFromUrl)) setSelectedCurrency(currencyFromUrl);
    if (instagramFromUrl) {
      setInstagramHandleInput(instagramFromUrl);
      InstagramImporter.ingestProfile(instagramFromUrl, currencyFromUrl || 'USD').then((data: InstagramImportResult) => {
        setInstagramResult(data);
        const caps = data.mediaVault.map((m) => m.caption || '').filter(Boolean);
        triggerAiAnalysis(instagramFromUrl, data.businessName, categoryFromUrl || 'Makeup Artists & Beauty', currencyFromUrl || 'USD', caps);
      });
    }
    if (stepFromUrl) {
      const parsedStep = parseInt(stepFromUrl, 10);
      if (parsedStep >= 1 && parsedStep <= 4) {
        setStep(parsedStep as 1 | 2 | 3 | 4);
      }
    }
  }, [searchParams, triggerAiAnalysis]);

  // When category changes, auto-suggest the best matching template
  const handleCategorySelect = (cat: CategoryOption) => {
    setSelectedCategory(cat.id);
    setSelectedTemplate(cat.recommendedTemplate);
  };

  // Instagram Ingestion Handler
  const handleIngestInstagram = async () => {
    if (!instagramHandleInput.trim()) return;
    setIsIngestingInstagram(true);
    try {
      const res = await fetch('/api/import/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: instagramHandleInput.trim(),
          currency: selectedCurrency,
        }),
      });

      if (res.ok) {
        const data: InstagramImportResult = await res.json();
        setInstagramResult(data);
        if (data.businessName && businessName === 'Glory Beauty Studio') {
          setBusinessName(data.businessName);
        }
        if (data.suggestedTemplate) {
          setSelectedTemplate(data.suggestedTemplate);
        }
        if (data.whatsapp && !whatsappPhone) {
          setWhatsappPhone(data.whatsapp);
          setWhatsappConnected(true);
        }
        const caps = data.mediaVault.map((m) => m.caption || '').filter(Boolean);
        triggerAiAnalysis(data.handle, data.businessName, selectedCategory, selectedCurrency, caps);
      }
    } catch (err) {
      console.error('[Onboarding] Instagram Ingestion Error:', err);
    } finally {
      setIsIngestingInstagram(false);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    } else {
      router.push('/');
    }
  };

  // Step 3 Templates List
  const matchingCat = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const aiRecommendedTemplateName = matchingCat.recommendedTemplate;

  const marketplaceTemplates: TemplateOption[] = [
    {
      id: 'ai-match',
      name: aiRecommendedTemplateName,
      tagline: `AI tailored layout engineered for ${selectedCategory}`,
      category: selectedCategory,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      type: 'ai_recommendation',
    },
    {
      id: 'prod_fashion',
      name: 'Vogue Boutique & Catalog',
      tagline: 'Modular apparel catalog with direct WhatsApp checkout',
      category: 'Fashion & Retail',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
      type: 'marketplace',
    },
    {
      id: 'prod_events',
      name: 'Couture Events & Planning',
      tagline: 'Luxury dark gold aesthetic with package calculator',
      category: 'Event Planning',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      type: 'marketplace',
    },
    {
      id: 'prod_photo',
      name: 'Luxe Portrait & Studio Gallery',
      tagline: 'Minimalist high-contrast gallery with booking inquiry',
      category: 'Photography',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      type: 'marketplace',
    },
    {
      id: 'prod_music',
      name: 'SoundStage & Beat Studio',
      tagline: 'Audio portfolio, beat store & studio session booking',
      category: 'Music & Audio Studio',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
      type: 'marketplace',
    },
    {
      id: 'blank-canvas',
      name: 'Blank Canvas (Start from Scratch)',
      tagline: 'Clean slate with minimalist navigation & responsive container',
      category: 'Custom Design',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      type: 'blank_canvas',
    },
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FFFFFF] text-[#1A202C] flex flex-col justify-between relative overflow-hidden pb-8">
      {/* Background Particle Mesh Canvas */}
      <HeroCanvasBackground />

      {/* Radial Dot Grid Background Mask */}
      <div className="absolute inset-0 bg-[radial-gradient(#0D5771_0.65px,transparent_0.65px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      {/* Returning User Quick Resume Banner */}
      {session?.user && (
        <div className="w-full max-w-xl mx-auto px-6 pt-4 relative z-10">
          <div className="bg-[#0D5771]/10 border border-[#0D5771]/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#1A202C] font-medium">
                Signed in as <strong>{session.user.name || session.user.email}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-xl bg-[#0D5771] text-white font-bold text-[11px] hover:bg-[#083D50] transition-colors shadow-sm"
              >
                Go to Dashboard →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sleek Top Progress Indicator */}
      <div className="w-full max-w-xl mx-auto px-6 pt-3 pb-2 relative z-10">
        <div className="flex items-center justify-between text-xs font-mono font-bold text-[#0D5771] mb-1.5">
          <span>STEP {step} OF 4</span>
          <span className="uppercase text-[#64748B]">
            {step === 1 && 'Brand & Currency'}
            {step === 2 && 'Social & Media Vault'}
            {step === 3 && 'Choose Starter Blueprint'}
            {step === 4 && 'Save & Launch'}
          </span>
        </div>
        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#0D5771] to-[#3498E3] h-full transition-all duration-500 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-2 flex flex-col relative z-10 pb-28">
        {step === 4 ? (
          <AuthGate
            wizardSummary={{
              businessName: businessName.trim() || 'My Business Studio',
              category: selectedCategory,
              currency: selectedCurrency,
              template: selectedTemplate,
              whatsapp: whatsappPhone,
              instagramHandle: instagramResult?.handle || (instagramHandleInput.trim().replace(/^@/, '') || undefined),
            }}
          />
        ) : (
          <>
            {/* ── STEP 1: Brand & Category & Currency ── */}
            {step === 1 && (
              <div className="w-full space-y-4 animate-in fade-in duration-300">
                <div className="text-center space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
                    Let's Name &amp; Position Your Brand
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Tell us what you do so we can configure your business parameters and currency.
                  </p>
                </div>

                {/* Business Name Input */}
                <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 shadow-sm space-y-3">
                  <div>
                    <label className="text-xs font-bold text-[#0D5771] uppercase tracking-wider block mb-1.5 font-mono">
                      Business / Brand Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Glory Beauty Studio"
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0D5771] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1A202C] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5771]/20 transition-all"
                      suppressHydrationWarning
                      autoFocus
                    />
                  </div>

                  {/* Currency Picker */}
                  <div>
                    <label className="text-xs font-bold text-[#0D5771] uppercase tracking-wider block mb-1.5 font-mono">
                      Operating Currency
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CURRENCY_OPTIONS.map((code) => {
                        const info = SUPPORTED_CURRENCIES[code];
                        const isSelected = selectedCurrency === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            suppressHydrationWarning
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedCurrency(code);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#0D5771] text-white shadow-sm ring-2 ring-[#0D5771]/20 scale-[1.03]'
                                : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#1A202C]'
                            }`}
                          >
                            <span>{info.symbol} {code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider block font-mono">
                    Select Your Business Category
                  </label>
                  <div className="space-y-2">
                    {CATEGORIES.map((cat) => {
                      const IconComp = cat.icon;
                      const isSelected = selectedCategory === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => handleCategorySelect(cat)}
                          className={`w-full p-3.5 rounded-2xl cursor-pointer text-left flex items-center justify-between transition-all duration-200 ${
                            isSelected
                              ? 'bg-[#FFFFFF] border-2 border-[#0D5771] shadow-md shadow-[#0D5771]/10'
                              : 'bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                isSelected ? 'bg-[#0D5771] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-xs text-[#1A202C] font-display">{cat.name}</h3>
                              <p className="text-[10px] text-[#64748B] mt-0.5">{cat.sub}</p>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0D5771] flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Social Presence & Media Ingestion ── */}
            {step === 2 && (
              <div className="w-full space-y-4 animate-in fade-in duration-300">
                <div className="text-center space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
                    Connect Your Media &amp; Channels
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Pull high-resolution photo assets and enable instant WhatsApp booking with 1 click.
                  </p>
                </div>

                {/* Instagram Ingestion Spotlight */}
                <SpotlightCard className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-sm">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1A202C]">Instagram Media Ingestion</h3>
                        <p className="text-[11px] text-[#64748B]">Extract photos, bio, and portfolio assets</p>
                      </div>
                    </div>
                    {instagramResult && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Connected
                      </span>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleIngestInstagram();
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">@</span>
                      <input
                        type="text"
                        value={instagramHandleInput}
                        onChange={(e) => setInstagramHandleInput(e.target.value)}
                        placeholder="yourbrand (e.g. official_bram_)"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-pink-500 rounded-xl pl-8 pr-3 py-2 text-xs text-[#1A202C] focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isIngestingInstagram || !instagramHandleInput.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isIngestingInstagram ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Ingesting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Simulate</span>
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/api/auth/instagram?name=${encodeURIComponent(businessName)}&category=${encodeURIComponent(selectedCategory)}&currency=${encodeURIComponent(selectedCurrency)}`;
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Instagram className="w-4 h-4" />
                      <span>Authorize &amp; Import Real Instagram Posts (Meta OAuth)</span>
                    </button>
                  </div>

                  {/* Ingestion Results Preview */}
                  {instagramResult && (
                    <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-200/70 text-xs text-[#1A202C] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-pink-900">@{instagramResult.handle}</span>
                        <span className="text-pink-700 font-mono font-bold">{instagramResult.mediaVault.length} Photos Ingested</span>
                      </div>
                      <p className="text-[11px] text-pink-800 italic">"{instagramResult.tagline}"</p>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {instagramResult.mediaVault.slice(0, 4).map((m) => (
                          <img
                            key={m.id}
                            src={m.url}
                            alt={m.name}
                            className="w-12 h-12 rounded-lg object-cover border border-pink-300"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </SpotlightCard>

                {/* WhatsApp Phone Card */}
                <SpotlightCard className="p-4 sm:p-5 rounded-2xl bg-[#FFFFFF] border border-[#E2E8F0] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white shadow-sm">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1A202C]">WhatsApp Booking &amp; Orders</h3>
                        <p className="text-[11px] text-[#64748B]">Enables direct WhatsApp checkout &amp; appointment booking</p>
                      </div>
                    </div>
                    {whatsappConnected && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={whatsappPhone}
                        onChange={(e) => {
                          setWhatsappPhone(e.target.value);
                          setWhatsappConnected(Boolean(e.target.value.trim()));
                        }}
                        placeholder="e.g. +1 800 555 4526 or +234 800 123 4567"
                        className="w-full bg-[#F8FAFC] border border-[#CBD5E1] focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A202C] focus:outline-none"
                      />
                    </div>
                  </div>
                </SpotlightCard>

                {/* Skip Link */}
                <button
                  onClick={() => handleNext()}
                  className="w-full p-2.5 rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] flex items-center justify-center gap-2 text-[#64748B] transition-all text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>I'll connect socials later — continue</span>
                </button>
              </div>
            )}

            {/* ── STEP 3: Starter Blueprint Selection (AI Recommendation, Marketplace, Blank Canvas) ── */}
            {step === 3 && (
              <div className="w-full space-y-4 animate-in fade-in duration-300">
                <div className="text-center space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
                    Choose Your Starter Blueprint
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Pick an AI-tailored starter, browse marketplace templates, or start with a blank canvas.
                  </p>
                </div>

                {/* AI Niche Breakdown & Strategy Card */}
                {aiAnalysis && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0D5771]/10 via-[#3498E3]/10 to-transparent border border-[#0D5771]/30 shadow-sm space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#0D5771] text-white">
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#0D5771]">
                          AI Niche Match ({Math.round(aiAnalysis.confidenceScore * 100)}% Confidence)
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                        Tailored for @{instagramResult?.handle || instagramHandleInput || 'creator'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#1A202C] font-display">
                        {aiAnalysis.nicheDetected}
                      </h3>
                      <p className="text-xs text-[#64748B] mt-0.5 italic">
                        "{aiAnalysis.customTagline}"
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[#0D5771]/10 flex items-center justify-between text-[11px] text-[#0D5771] font-medium">
                      <span>✨ Pre-configured {aiAnalysis.generatedServices.length} custom service packages ({selectedCurrency})</span>
                      <span className="font-bold">Recommended: {aiAnalysis.recommendedTemplate}</span>
                    </div>
                  </div>
                )}

                <div className="max-h-[360px] overflow-y-auto custom-scrollbar pr-1 space-y-2.5">
                  {marketplaceTemplates.map((tpl) => {
                    const isSelected = selectedTemplate === tpl.name;
                    return (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.name)}
                        className={`p-3.5 rounded-2xl cursor-pointer text-left flex items-center justify-between gap-3 transition-all relative overflow-hidden ${
                          isSelected
                            ? 'bg-[#FFFFFF] border-2 border-[#0D5771] shadow-md shadow-[#0D5771]/10'
                            : 'bg-[#F8FAFC] border border-[#E2E8F0] hover:border-slate-300'
                        }`}
                      >
                        {tpl.type === 'ai_recommendation' && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>AI MATCH</span>
                          </div>
                        )}

                        {tpl.type === 'blank_canvas' && (
                          <div className="absolute top-0 right-0 bg-slate-600 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
                            <FileCode className="w-2.5 h-2.5" />
                            <span>CLEAN SLATE</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={tpl.imageUrl}
                            alt={tpl.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-xs text-[#1A202C] font-display truncate">
                                {tpl.name}
                              </h3>
                            </div>
                            <p className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">
                              {tpl.tagline}
                            </p>
                            <span className="inline-block mt-1 text-[9px] font-mono font-semibold px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#0D5771]">
                              {tpl.category}
                            </span>
                          </div>
                        </div>

                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-[#0D5771] flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Bar (steps 1, 2, 3) */}
      {step < 4 && (
        <div className="fixed bottom-6 left-0 w-full z-40 px-6 flex justify-center pointer-events-none">
          <div className="max-w-xl w-full bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#E2E8F0] p-3 rounded-2xl flex justify-between items-center gap-4 shadow-lg shadow-[#0D5771]/10 pointer-events-auto">
            <button
              onClick={handleBack}
              suppressHydrationWarning
              className="px-5 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C] hover:bg-[#F1F5F9] font-bold text-xs transition-colors cursor-pointer"
            >
              Back
            </button>

            <button
              onClick={handleNext}
              suppressHydrationWarning
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#3498E3]/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>{step === 3 ? 'Review & Launch →' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
