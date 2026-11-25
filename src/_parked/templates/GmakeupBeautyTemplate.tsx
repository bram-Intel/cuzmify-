'use client';

import React, { useState } from 'react';
import { AIThemeConfig } from '@/core/types';
import { EditableText } from '@/components/editor/EditableText';
import { EditableImage } from '@/components/editor/EditableImage';
import {
  Sparkles,
  Star,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Award,
  Phone,
} from 'lucide-react';

export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.88 0-3.64-.507-5.16-1.39l-.37-.215-3.83.998 1.025-3.732-.238-.376c-.977-1.545-1.492-3.33-1.492-5.163 0-5.32 4.33-9.65 9.664-9.65 5.33 0 9.664 4.33 9.664 9.65 0 5.323-4.334 9.653-9.663 9.653m0-21.344c-6.444 0-11.69 5.245-11.69 11.691 0 2.062.536 4.07 1.554 5.845l-1.65 6.02 6.16-1.614c1.71 1.002 3.673 1.53 5.626 1.53 6.444 0 11.69-5.246 11.69-11.692 0-6.446-5.246-11.69-11.69-11.69" />
  </svg>
);

interface GmakeupBeautyTemplateProps {
  config: AIThemeConfig;
  onChangeConfig?: (newConfig: AIThemeConfig) => void;
  businessName: string;
  onChangeBusinessName?: (newName: string) => void;
  activeModules: string[];
}

export const GmakeupBeautyTemplate: React.FC<GmakeupBeautyTemplateProps> = ({
  config,
  onChangeConfig,
  businessName,
  onChangeBusinessName,
  activeModules,
}) => {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string>('Royal Bridal Suite Experience');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');

  const [heroImg, setHeroImg] = useState('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80');
  const [aboutImg, setAboutImg] = useState('https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80');

  const [galleryItems, setGalleryItems] = useState([
    {
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
      title: 'Couture Bridal Glam',
      category: 'Bridal',
    },
    {
      url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
      title: 'Vogue Editorial Look',
      category: 'Editorial',
    },
    {
      url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
      title: 'Red Carpet Hollywood Waves',
      category: 'Hairstyling',
    },
    {
      url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
      title: 'Smokey Velvet Evening Glam',
      category: 'Special Occasion',
    },
    {
      url: 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800&auto=format&fit=crop&q=80',
      title: 'Minimalist Dewy Skin',
      category: 'Soft Glam',
    },
    {
      url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800&auto=format&fit=crop&q=80',
      title: 'High-Gloss Runway Artistry',
      category: 'Editorial',
    },
  ]);

  const [services, setServices] = useState(
    config.featuredServices && config.featuredServices.length > 0
      ? config.featuredServices.map((s, idx) => ({
          id: `s_${idx}`,
          category: idx === 0 ? 'Bridal' : idx === 1 ? 'Soft Glam' : 'Specialty',
          title: s.title,
          price: s.price,
          duration: '90 mins',
          description: s.description,
          perks: ['Professional HD finish', 'Long-lasting seal', 'Custom lash application'],
        }))
      : [
          {
            id: 's1',
            category: 'Bridal',
            title: 'Royal Bridal Suite Experience',
            price: '$380',
            duration: '150 mins',
            description: 'Bespoke bridal transformation including pre-wedding trial session, HD 24hr airbrushing, premium silk lashes, body glow, and emergency touch-up kit.',
            perks: ['Pre-wedding trial included', 'HD Airbrushing & 24hr lock', 'Luxury lip touch-up kit'],
          },
          {
            id: 's2',
            category: 'Soft Glam',
            title: 'Signature Red Carpet Soft Glam',
            price: '$190',
            duration: '75 mins',
            description: 'Radiant skin-focused makeup with soft contouring, neutral warm tones, bespoke lash application, and hydration prep.',
            perks: ['Camera-ready HD finish', 'Custom mink lash strip', 'Luminous skin prep'],
          },
          {
            id: 's3',
            category: 'Hairstyling',
            title: 'Hollywood Waves & Crown Updo',
            price: '$230',
            duration: '90 mins',
            description: 'Signature red-carpet Hollywood waves or intricate updo with scalp prep, heat protection, and long-lasting shine seal.',
            perks: ['Heat protectant seal', 'Volumizing texture spray', 'Pin setting for 18hr hold'],
          },
          {
            id: 's4',
            category: 'Masterclass',
            title: 'Private 1-on-1 Pro Masterclass',
            price: '$480',
            duration: '3.5 Hours',
            description: 'Intensive hands-on training covering shade matching, skin prep, airbrushing, contouring, and client acquisition strategies.',
            perks: ['Certificate of completion', 'Full product list & vendor guide', '1-on-1 hands-on practice'],
          },
        ]
  );

  const isLight = config.style === 'bram-light' || config.style === 'minimal';
  const bgColor = isLight ? '#FFFFFF' : '#071A24';
  const surfaceColor = isLight ? '#F7FAFC' : '#0D2A38';
  const textColor = isLight ? '#1A202C' : '#FFFFFF';
  const subtextColor = isLight ? '#64748B' : '#94A3B8';
  const borderColor = isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)';
  const primaryBrand = isLight ? '#0D5771' : config.secondaryColor || '#F59E0B';

  const filteredServices =
    activeTab === 'ALL'
      ? services
      : services.filter((s) => s.category.toUpperCase() === activeTab.toUpperCase());

  const handleWhatsAppBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = '1234567890';
    const msg = `Hi ${businessName || 'Gmakeup Studio'}! I would like to book a session.\n\n*Service:* ${selectedService}\n*Name:* ${clientName || 'Valued Client'}\n*Preferred Date:* ${bookingDate || 'As soon as possible'}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const updateHeadline = (newText: string) => {
    if (onChangeConfig) onChangeConfig({ ...config, heroHeadline: newText });
  };

  const updateSubheadline = (newText: string) => {
    if (onChangeConfig) onChangeConfig({ ...config, heroSubheadline: newText });
  };

  const updateBusinessName = (newName: string) => {
    if (onChangeBusinessName) onChangeBusinessName(newName);
  };

  const updateServiceTitle = (index: number, newTitle: string) => {
    const updated = [...services];
    updated[index].title = newTitle;
    setServices(updated);

    if (onChangeConfig && config.featuredServices) {
      const updatedSrvs = [...config.featuredServices];
      if (updatedSrvs[index]) updatedSrvs[index].title = newTitle;
      onChangeConfig({ ...config, featuredServices: updatedSrvs });
    }
  };

  const updateServicePrice = (index: number, newPrice: string) => {
    const updated = [...services];
    updated[index].price = newPrice;
    setServices(updated);

    if (onChangeConfig && config.featuredServices) {
      const updatedSrvs = [...config.featuredServices];
      if (updatedSrvs[index]) updatedSrvs[index].price = newPrice;
      onChangeConfig({ ...config, featuredServices: updatedSrvs });
    }
  };

  const updateServiceDesc = (index: number, newDesc: string) => {
    const updated = [...services];
    updated[index].description = newDesc;
    setServices(updated);

    if (onChangeConfig && config.featuredServices) {
      const updatedSrvs = [...config.featuredServices];
      if (updatedSrvs[index]) updatedSrvs[index].description = newDesc;
      onChangeConfig({ ...config, featuredServices: updatedSrvs });
    }
  };

  return (
    <div
      className="w-full min-h-full transition-all duration-300 font-sans text-left"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
      }}
    >
      {/* ── 1. TOP ANNOUNCEMENT BAR ────────────────────────────────────────────── */}
      <div className="bg-[#083D50] text-white px-6 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-amber-300 font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Gmakeup Luxury Artistry
          </span>
          <span className="hidden md:inline text-slate-300">📍 Available for On-Location & International Weddings</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-300" /> +1 (800) 555-GLAM</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <WhatsAppIcon className="w-4 h-4 text-[#25D366]" /> WhatsApp Active
          </span>
        </div>
      </div>

      {/* ── 2. STICKY NAVBAR ─────────────────────────────────────────────────── */}
      <nav
        className="px-6 py-4 flex items-center justify-between border-b backdrop-blur-xl sticky top-0 z-30"
        style={{ backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(7, 26, 36, 0.9)', borderColor }}
      >
        <div className="flex items-center gap-3 shrink-0">
          <span
            className="font-extrabold text-xl tracking-wide uppercase"
            style={{ color: primaryBrand, fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
          >
            <EditableText
              value={businessName || 'GMAKEUP STUDIO'}
              onChange={updateBusinessName}
              tagName="span"
            />
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-mono text-[9px] font-bold uppercase whitespace-nowrap border border-amber-500/20">
            PRO CERTIFIED
          </span>
        </div>

        <div className="hidden md:flex items-center gap-7 text-xs font-bold uppercase tracking-wider" style={{ color: subtextColor }}>
          <a href="#about" className="hover:text-amber-500 transition-colors">About Us</a>
          <a href="#services" className="hover:text-amber-500 transition-colors">Services</a>
          <a href="#portfolio" className="hover:text-amber-500 transition-colors">Portfolio</a>
          <a href="#booking" className="hover:text-amber-500 transition-colors flex items-center gap-1">
            <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" /> Booking
          </a>
        </div>

        <a
          href="#booking"
          className="px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.03] flex items-center gap-2"
          style={{ backgroundColor: primaryBrand, color: '#FFFFFF' }}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Session</span>
        </a>
      </nav>

      {/* ── 3. HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="px-6 py-12 sm:py-24 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-bold text-amber-700">4.98 Rating</span>
            <span className="text-slate-400">•</span>
            <span>500+ Clients Transformed</span>
          </div>

          <h1
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12]"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
          >
            <EditableText
              value={config.heroHeadline || 'Elevating High-Fashion & Bridal Elegance'}
              onChange={updateHeadline}
              multiline
              tagName="span"
            />
          </h1>

          <p className="text-sm sm:text-base leading-relaxed max-w-xl" style={{ color: subtextColor }}>
            <EditableText
              value={config.heroSubheadline || 'World-class beauty artistry, flawless 24hr airbrushing, and bespoke styling for brides, red carpet events, and luxury photoshoots.'}
              onChange={updateSubheadline}
              multiline
              tagName="span"
            />
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
            <a
              href="#booking"
              className="px-7 py-3.5 rounded-2xl font-bold text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              style={{ backgroundColor: primaryBrand, color: '#FFFFFF' }}
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Instant Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <button
              onClick={handleWhatsAppBooking}
              className="px-6 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-[#25D366] hover:bg-[#1ebd5b] text-white flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#25D366]/20"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>WhatsApp Direct Chat</span>
            </button>
          </div>

          <div className="flex items-center gap-6 pt-3 text-[11px]" style={{ color: subtextColor }}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Sanitized & HD Products</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Award-Winning Makeup Team</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative rounded-3xl overflow-hidden border shadow-2xl group" style={{ borderColor }}>
            <EditableImage
              src={heroImg}
              alt="Gmakeup Hero Glam"
              onChangeImage={setHeroImg}
              className="w-full h-[440px] object-cover object-center transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-5 left-5 right-5 p-4 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white space-y-1 z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Royal Bridal Glam</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold uppercase">
                  Available This Week
                </span>
              </div>
              <p className="text-[11px] text-slate-300">24hr Airbrushing • Silk Lashes • Skin Glow</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. ABOUT US SECTION ──────────────────────────────────────────────── */}
      <section id="about" className="px-6 py-16 border-t" style={{ backgroundColor: surfaceColor, borderColor }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border shadow-xl" style={{ borderColor }}>
              <EditableImage
                src={aboutImg}
                alt="About Gmakeup Studio"
                onChangeImage={setAboutImg}
                className="w-full h-[360px] object-cover object-center"
              />
            </div>
          </div>
          <div className="lg:col-span-7 space-y-5 text-left">
            <span className="text-xs font-bold uppercase tracking-widest font-mono text-amber-500">About Our Studio</span>
            <h2
              className="text-2xl sm:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
            >
              Mastering the Art of Flawless Transformation
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: subtextColor }}>
              At {businessName || 'Gmakeup Studio'}, we believe every face tells a unique story. With over a decade of experience in bridal, editorial runway, and celebrity glam, our certified artists combine high-end techniques with luxury skin prep to enhance your natural beauty.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor }}>
              <div>
                <span className="text-2xl font-black font-mono text-emerald-500">12+</span>
                <p className="text-[11px]" style={{ color: subtextColor }}>Years Experience</p>
              </div>
              <div>
                <span className="text-2xl font-black font-mono text-emerald-500">1.5k+</span>
                <p className="text-[11px]" style={{ color: subtextColor }}>Brides Transformed</p>
              </div>
              <div>
                <span className="text-2xl font-black font-mono text-emerald-500">100%</span>
                <p className="text-[11px]" style={{ color: subtextColor }}>Client Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. SERVICES CATALOG & PRICING MENU ────────────────────────────── */}
      <section id="services" className="px-6 py-16 border-t max-w-6xl mx-auto space-y-8 text-center" style={{ borderColor }}>
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest font-mono text-amber-500">Services & Pricing</span>
          <h2
            className="text-2xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
          >
            Curated Beauty Experiences
          </h2>
          <p className="text-xs sm:text-sm max-w-lg mx-auto" style={{ color: subtextColor }}>
            Click any service title, price, or description to edit directly on screen!
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {['ALL', 'Bridal', 'Soft Glam', 'Hairstyling', 'Masterclass'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-[#0D5771] text-white shadow-md'
                  : 'bg-white/80 border border-[#E2E8F0] text-[#64748B] hover:text-[#1A202C]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {filteredServices.map((srv, idx) => (
            <div
              key={srv.id}
              className="p-6 rounded-2xl border transition-all hover:shadow-lg flex flex-col justify-between space-y-4"
              style={{ backgroundColor: surfaceColor, borderColor }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {srv.category}
                    </span>
                    <h3 className="text-base font-bold mt-2 font-display">
                      <EditableText
                        value={srv.title}
                        onChange={(newVal) => updateServiceTitle(idx, newVal)}
                        tagName="span"
                      />
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-500 font-mono">
                      <EditableText
                        value={srv.price}
                        onChange={(newVal) => updateServicePrice(idx, newVal)}
                        tagName="span"
                      />
                    </span>
                    <span className="block text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 inline" /> {srv.duration}
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: subtextColor }}>
                  <EditableText
                    value={srv.description}
                    onChange={(newVal) => updateServiceDesc(idx, newVal)}
                    multiline
                    tagName="span"
                  />
                </p>

                <div className="space-y-1.5 pt-1">
                  {srv.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: subtextColor }}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor }}>
                <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                  <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" /> Booking Ready
                </span>
                <a
                  href="#booking"
                  onClick={() => setSelectedService(srv.title)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5 shadow-sm"
                  style={{ backgroundColor: primaryBrand, color: '#FFFFFF' }}
                >
                  <span>Select Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. PORTFOLIO GALLERY ────────────────────────────────────────────── */}
      <section id="portfolio" className="px-6 py-16 border-t text-center space-y-8" style={{ backgroundColor: surfaceColor, borderColor }}>
        <div className="max-w-6xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest font-mono text-amber-500">Live Work Portfolio</span>
          <h2
            className="text-2xl sm:text-4xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
          >
            Recent Makeup Artistry
          </h2>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {galleryItems.map((item, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden border shadow-sm aspect-[4/5]" style={{ borderColor }}>
              <EditableImage
                src={item.url}
                alt={item.title}
                onChangeImage={(newUrl) => {
                  const copy = [...galleryItems];
                  copy[i].url = newUrl;
                  setGalleryItems(copy);
                }}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-left text-white z-10">
                <span className="text-[10px] font-mono uppercase text-amber-300">{item.category}</span>
                <p className="text-sm font-bold">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. INTERACTIVE WHATSAPP BOOKING SECTION ──────────────────────────── */}
      <section id="booking" className="px-6 py-20 border-t max-w-4xl mx-auto text-left" style={{ borderColor }}>
        <div className="p-8 sm:p-12 rounded-3xl border shadow-2xl relative overflow-hidden" style={{ backgroundColor: surfaceColor, borderColor }}>
          <div className="space-y-3 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest font-mono text-[#25D366] flex items-center gap-1.5">
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" /> WhatsApp Direct Booking Concierge
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', 'Cormorant Garamond', serif" }}
            >
              Book Your Glam Session
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: subtextColor }}>
              Fill in your preferred details below to dispatch an instant WhatsApp booking request directly to our studio coordinator.
            </p>
          </div>

          <form onSubmit={handleWhatsAppBooking} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold block mb-1.5">Your Full Name</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-3 rounded-xl border bg-white/90 text-xs text-[#1A202C] focus:outline-none focus:border-[#0D5771]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold block mb-1.5">Preferred Session Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border bg-white/90 text-xs text-[#1A202C] focus:outline-none focus:border-[#0D5771]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1.5">Selected Service Package</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border bg-white/90 text-xs text-[#1A202C] focus:outline-none focus:border-[#0D5771]"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title} ({s.price})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl font-bold text-sm bg-[#25D366] hover:bg-[#1ebd5b] text-white flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-[#25D366]/20"
            >
              <WhatsAppIcon className="w-5 h-5 text-white" />
              <span>Send Instant WhatsApp Booking Request</span>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};
