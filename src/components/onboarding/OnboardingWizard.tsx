'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
} from 'lucide-react';

import { AuthGate } from '@/components/auth/AuthGate';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface CategoryOption {
  id: string;
  name: string;
  sub: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Beauty & Wellness', name: 'Makeup Artists & Beauty', sub: 'Salons, makeup artists, spas, fitness', icon: Zap },
  { id: 'Fashion & Retail', name: 'Fashion & Retail', sub: 'Boutiques, online stores, makers', icon: Store },
  { id: 'Event Planning', name: 'Event Planning & Design', sub: 'Planners, caterers, venue decorators', icon: Utensils },
  { id: 'Photography', name: 'Photography & Media', sub: 'Studios, freelancers, videographers', icon: Camera },
  { id: 'Creative Studio', name: 'Creative Studio & Art', sub: 'Designers, agencies, artists', icon: Palette },
];

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('Beauty & Wellness');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('Modern Business Template');
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [businessName, setBusinessName] = useState('');

  useEffect(() => {
    const templateFromUrl = searchParams.get('template');
    if (templateFromUrl) {
      setSelectedTemplate(templateFromUrl);
      setStep(4);
    }
  }, [searchParams]);

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
    } else {
      const nameParam = encodeURIComponent(businessName.trim() || 'My Business');
      const catParam = encodeURIComponent(selectedCategory);
      const tplParam = encodeURIComponent(selectedTemplate);
      router.push(`/editor?importName=${nameParam}&category=${catParam}&template=${tplParam}`);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#FFFFFF] text-[#1A202C] flex flex-col justify-between relative overflow-hidden pb-16">
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
            {step === 1 && 'Business Category'}
            {step === 2 && 'Social Presence'}
            {step === 3 && 'Business Name'}
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
      <main className="flex-1 max-w-xl w-full mx-auto px-6 py-4 flex flex-col justify-center relative z-10 mb-14">
        {step === 4 ? (
          <AuthGate
            wizardSummary={{
              category: selectedCategory,
              template: selectedTemplate,
              instagramHandle: instagramConnected ? 'connected_account' : undefined,
            }}
          />
        ) : (
          <>
            {/* Step 1: What do you do? */}
            {step === 1 && (
              <div className="w-full space-y-4 animate-in fade-in duration-300">
                <div className="text-center space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
                    What do you do?
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Select your primary business category to customize your experience.
                  </p>
                </div>

                <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto custom-scrollbar pr-2 py-1 space-y-2.5">
                  {CATEGORIES.map((cat) => {
                    const IconComp = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <SpotlightCard
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full p-4 rounded-2xl cursor-pointer text-left flex items-center justify-between transition-all duration-200 ${
                          isSelected
                            ? 'bg-[#FFFFFF] border-[#0D5771] shadow-md shadow-[#0D5771]/10'
                            : 'bg-[#F7FAFC] border-[#E2E8F0] hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-[#0D5771] text-white' : 'bg-[#F1F5F9] text-[#64748B]'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#1A202C] font-display">{cat.name}</h3>
                            <p className="text-[11px] text-[#64748B] mt-0.5">{cat.sub}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-[#0D5771] flex-shrink-0" />}
                      </SpotlightCard>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Connect your presence */}
            {step === 2 && (
              <div className="w-full space-y-4 animate-in fade-in duration-300">
                <div className="text-center space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
                    Where do we find you?
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                    Connect your social accounts or website so we can automatically pull your best photos and business details.
                  </p>
                </div>

                <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto custom-scrollbar pr-2 py-1 space-y-3">
                  <SpotlightCard
                    onClick={() => setInstagramConnected(!instagramConnected)}
                    className={`w-full p-4 rounded-2xl cursor-pointer text-left flex items-center justify-between transition-all ${
                      instagramConnected
                        ? 'bg-[#FFFFFF] border-pink-500 shadow-sm'
                        : 'bg-[#F7FAFC] border-[#E2E8F0] hover:border-pink-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white">
                        <Instagram className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1A202C] font-display">
                          {instagramConnected ? 'Instagram Connected' : 'Connect Instagram'}
                        </h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">Import photos, portfolio gallery, and bio</p>
                      </div>
                    </div>
                    {instagramConnected ? (
                      <CheckCircle2 className="w-5 h-5 text-pink-600" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    )}
                  </SpotlightCard>

                  <SpotlightCard
                    onClick={() => setWhatsappConnected(!whatsappConnected)}
                    className={`w-full p-4 rounded-2xl cursor-pointer text-left flex items-center justify-between transition-all ${
                      whatsappConnected
                        ? 'bg-[#FFFFFF] border-emerald-500 shadow-sm'
                        : 'bg-[#F7FAFC] border-[#E2E8F0] hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center text-white">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#1A202C] font-display">
                          {whatsappConnected ? 'WhatsApp Connected' : 'Connect WhatsApp'}
                        </h3>
                        <p className="text-[11px] text-[#64748B] mt-0.5">Enable instant booking & customer chat</p>
                      </div>
                    </div>
                    {whatsappConnected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    )}
                  </SpotlightCard>

                  <button
                    onClick={() => handleNext()}
                    className="w-full p-3 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] flex items-center justify-center gap-2 text-[#64748B] transition-all text-xs font-semibold"
                    suppressHydrationWarning
                  >
                    <Plus className="w-4 h-4" />
                    <span>I'll do this later — continue for now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Name your space */}
            {step === 3 && (
              <div className="w-full space-y-4 animate-in fade-in duration-300">
                <div className="text-center space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-[#1A202C]">
                    Let's name your space
                  </h1>
                  <p className="text-xs sm:text-sm text-[#64748B]">
                    Enter your business or brand name. You can change this anytime.
                  </p>
                </div>

                <SpotlightCard className="p-6 space-y-4 relative overflow-hidden bg-[#FFFFFF] border-[#E2E8F0] shadow-lg">
                  <BorderBeam size={180} duration={8} colorFrom="#0D5771" colorTo="#3498E3" />
                  <div>
                    <label className="text-xs font-bold text-[#0D5771] uppercase tracking-wider block mb-2 font-mono">
                      Business / Brand Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Glory Beauty Studio"
                      className="w-full bg-[#F7FAFC] border border-[#E2E8F0] focus:border-[#0D5771] rounded-2xl px-5 h-13 text-base font-semibold text-[#1A202C] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D5771]/20 shadow-sm transition-all"
                      suppressHydrationWarning
                      autoFocus
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-start gap-2.5 text-xs text-[#64748B]">
                    <Zap className="w-4 h-4 text-[#0D5771] flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      We use this name to draft your initial digital business home and setup your branding parameters.
                    </p>
                  </div>
                </SpotlightCard>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Action Bar (hide on Step 4 since AuthGate has its own Google CTA) */}
      {step < 4 && (
        <div className="fixed bottom-10 left-0 w-full z-40 px-6 flex justify-center pointer-events-none">
          <div className="max-w-xl w-full bg-[#FFFFFF]/95 backdrop-blur-xl border border-[#E2E8F0] p-3 rounded-2xl flex justify-between items-center gap-4 shadow-lg shadow-[#0D5771]/10 pointer-events-auto">
            <button
              onClick={handleBack}
              className="px-6 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C] hover:bg-[#F1F5F9] font-bold text-xs transition-colors"
              suppressHydrationWarning
            >
              Back
            </button>

            <button
              onClick={handleNext}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-[#0D5771] to-[#3498E3] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-[#3498E3]/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
              suppressHydrationWarning
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
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
