'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Sparkles,
  Palette,
  Store,
  Utensils,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Plus,
  Lightbulb,
  X,
  Instagram,
} from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
  sub: string;
  icon: React.ElementType;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Photography', name: 'Photography', sub: 'Studios, freelancers, videographers', icon: Camera },
  { id: 'Beauty & Wellness', name: 'Beauty & Wellness', sub: 'Salons, makeup artists, spas, fitness', icon: Sparkles },
  { id: 'Creative Studio', name: 'Creative Studio', sub: 'Designers, agencies, artists', icon: Palette },
  { id: 'Retail', name: 'Retail & Fashion', sub: 'Boutiques, online stores, makers', icon: Store },
  { id: 'Hospitality', name: 'Hospitality & Food', sub: 'Cafes, restaurants, event planners', icon: Utensils },
];

export const OnboardingWizard: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('Beauty & Wellness');
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [businessName, setBusinessName] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as 2 | 3);
    } else {
      // Step 3 Finish -> Redirect to AI Editor with parameters
      const nameParam = encodeURIComponent(businessName.trim() || 'My Business');
      const catParam = encodeURIComponent(selectedCategory);
      router.push(`/editor?importName=${nameParam}&category=${catParam}`);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#071A24] text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#071A24]/90 backdrop-blur-md border-b border-[#1E3A4A]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-[#0D2A38] text-[#72B9F3] transition-colors flex items-center gap-1 text-sm font-semibold"
            suppressHydrationWarning
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="font-extrabold text-xl tracking-tight text-white font-display">
            CUZMIFY
          </div>

          <button
            onClick={() => router.push('/')}
            className="text-xs text-slate-400 hover:text-white transition-colors"
            suppressHydrationWarning
          >
            Save & Exit
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#0D2A38] h-1 max-w-5xl mx-auto">
          <div
            className="bg-gradient-to-r from-[#0D5771] via-[#3498E3] to-[#72B9F3] h-1 transition-all duration-500 rounded-r-full"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 max-w-xl w-full mx-auto px-6 pt-12 pb-32 flex flex-col items-center justify-center">
        {/* Step 1: What do you do? */}
        {step === 1 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold text-[#72B9F3] uppercase tracking-widest">
                Step 1 of 3
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                What do you do?
              </h1>
              <p className="text-sm text-slate-400">
                Select your primary business category to customize your experience.
              </p>
            </div>

            <div className="grid gap-3">
              {CATEGORIES.map((cat) => {
                const IconComp = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#0D2A38] border-[#3498E3] shadow-[0_0_20px_rgba(52,152,227,0.25)]'
                        : 'bg-[#0D2A38]/50 border-[#1E3A4A] hover:border-slate-700 hover:-translate-y-0.5'
                    }`}
                    suppressHydrationWarning
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#3498E3] text-slate-950' : 'bg-[#0A222E] text-[#72B9F3]'
                        }`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-white font-display">{cat.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{cat.sub}</p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-[#72B9F3] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Connect your presence */}
        {step === 2 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold text-[#72B9F3] uppercase tracking-widest">
                Step 2 of 3
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                Where do we find you?
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Connect your socials so we can automatically pull your best photos, reviews, and business details. We'll never post without asking.
              </p>
            </div>

            <div className="space-y-4">
              {/* Instagram */}
              <button
                onClick={() => setInstagramConnected(!instagramConnected)}
                className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  instagramConnected
                    ? 'bg-pink-500/10 border-pink-500/50 text-pink-300'
                    : 'bg-[#0D2A38]/60 border-[#1E3A4A] hover:border-pink-500/40'
                }`}
                suppressHydrationWarning
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white">
                    <Instagram className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white font-display">
                      {instagramConnected ? 'Instagram Connected' : 'Connect Instagram'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Import photos, portfolio, and bio</p>
                  </div>
                </div>
                {instagramConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-pink-400" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                )}
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => setWhatsappConnected(!whatsappConnected)}
                className={`w-full p-5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  whatsappConnected
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-[#0D2A38]/60 border-[#1E3A4A] hover:border-emerald-500/40'
                }`}
                suppressHydrationWarning
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white font-display">
                      {whatsappConnected ? 'WhatsApp Connected' : 'Connect WhatsApp'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Allow direct customer booking & inquiries</p>
                  </div>
                </div>
                {whatsappConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                )}
              </button>

              {/* Skip / Do later */}
              <button
                onClick={() => handleNext()}
                className="w-full p-4 rounded-2xl border border-dashed border-[#1E3A4A] bg-[#0A222E]/40 hover:bg-[#0A222E] flex items-center gap-3 text-slate-400 hover:text-white transition-all text-xs font-semibold"
                suppressHydrationWarning
              >
                <Plus className="w-4 h-4" />
                <span>I'll do this later — skip manual entry for now</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Name your space */}
        {step === 3 && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold text-[#72B9F3] uppercase tracking-widest">
                Step 3 of 3
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
                Let's name your space
              </h1>
              <p className="text-sm text-slate-400">
                You can always change this later.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Glory Beauty Studio"
                  className="w-full bg-[#0D2A38] border border-[#1E3A4A] focus:border-[#3498E3] rounded-2xl px-5 h-16 text-lg font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3498E3]/20 shadow-xl transition-all"
                  suppressHydrationWarning
                  autoFocus
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#0A222E] border border-[#1E3A4A] flex items-start gap-3 text-xs text-slate-300">
                <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  We use this name to draft the first version of your site and set up your initial branding elements. Don't overthink it!
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Action Bar */}
      <footer className="fixed bottom-0 left-0 w-full z-40 bg-[#071A24]/95 backdrop-blur-md border-t border-[#1E3A4A] p-4 flex justify-center">
        <div className="max-w-xl w-full flex justify-between items-center gap-4">
          <button
            onClick={handleBack}
            className="px-6 py-3.5 rounded-full border border-[#1E3A4A] text-slate-300 hover:text-white hover:bg-[#0D2A38] font-bold text-xs transition-colors"
            suppressHydrationWarning
          >
            Back
          </button>

          <button
            onClick={handleNext}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#0D5771] via-[#3498E3] to-[#72B9F3] hover:opacity-90 text-white font-bold text-xs shadow-xl shadow-[#3498E3]/25 flex items-center gap-2 transition-all hover:scale-[1.02]"
            suppressHydrationWarning
          >
            <span>{step === 3 ? 'Generate My Site' : 'Next'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
};
