'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEditor } from './engine/EditorContext';
import { EditorService } from './engine/EditorService';
import { Monitor, Lock, Sparkles } from 'lucide-react';
import { RESPONSIVE_CORE_CSS } from '@/core/responsive-core';

// Initial HTML loaded into GrapesJS canvas on first load
const INITIAL_HTML = `
  <!-- ANNOUNCEMENT BAR -->
  <div style="background:#083D50;color:#fff;padding:10px 24px;font-size:11px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;font-family:monospace;">
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <span style="color:#FCD34D;font-weight:700;">✦ Gmakeup Luxury Artistry</span>
      <span style="color:#94A3B8;">📍 Available for On-Location &amp; International Weddings</span>
    </div>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <span>📞 +1 (800) 555-GLAM</span>
      <span style="color:#4ADE80;font-weight:700;">💬 WhatsApp Active</span>
    </div>
  </div>

  <!-- NAVBAR -->
  <nav data-cuzmify-type="navbar" data-brand="Gmakeup Studio" style="padding:16px 32px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.97);border-bottom:1px solid #E2E8F0;position:sticky;top:0;z-index:30;backdrop-filter:blur(12px);">
    <div style="display:flex;align-items:center;gap:12px;">
      <span data-cuzmify-field="business-name" class="brand-name" style="font-size:1.25rem;font-weight:900;color:#0D5771;letter-spacing:0.04em;text-transform:uppercase;font-family:'Playfair Display',serif;">GMAKEUP STUDIO</span>
      <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:3px 10px;border-radius:999px;background:rgba(245,158,11,0.12);color:#D97706;border:1px solid rgba(245,158,11,0.2);">PRO CERTIFIED</span>
    </div>
    <div class="nav-links" style="display:flex;align-items:center;gap:28px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#64748B;">
      <a href="#about" style="text-decoration:none;color:inherit;">About Us</a>
      <a href="#services" style="text-decoration:none;color:inherit;">Services</a>
      <a href="#portfolio" style="text-decoration:none;color:inherit;">Portfolio</a>
      <a href="#booking" style="text-decoration:none;color:inherit;">Booking</a>
    </div>
    <a data-cuzmify-action="whatsapp:booking" data-cuzmify-target-id="srv-bridal-suite" href="#booking" class="nav-cta" style="padding:10px 20px;border-radius:10px;background:#0D5771;color:#fff;font-size:11px;font-weight:700;text-decoration:none;white-space:nowrap;">Book Session</a>
  </nav>

  <!-- HERO -->
  <section data-cuzmify-type="hero" style="padding:80px 48px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;align-items:center;background:#fff;max-width:1200px;margin:0 auto;box-sizing:border-box;">
    <div>
      <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);margin-bottom:24px;">
        <span style="color:#F59E0B;font-size:11px;">★★★★★</span>
        <span style="color:#B45309;font-size:11px;font-weight:700;">4.98 Rating</span>
        <span style="color:#9CA3AF;font-size:11px;">• 500+ Clients</span>
      </div>
      <h1 data-cuzmify-field="headline" style="font-size:clamp(1.85rem,4.5vw,3.25rem);font-weight:900;color:#1A202C;line-height:1.15;margin-bottom:20px;font-family:'Playfair Display','Cormorant Garamond',serif;">Elevating High-Fashion &amp; Bridal Elegance</h1>
      <p data-cuzmify-field="subheadline" style="font-size:1rem;color:#64748B;line-height:1.75;margin-bottom:36px;max-width:540px;">World-class beauty artistry, flawless 24hr airbrushing, and bespoke styling for brides, red carpet events, and luxury photoshoots.</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">
        <a data-cuzmify-action="whatsapp:booking" data-cuzmify-target-id="srv-bridal-suite" href="#booking" style="padding:14px 28px;border-radius:14px;background:#0D5771;color:#fff;font-weight:700;font-size:0.875rem;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">✦ Instant Appointment →</a>
        <a data-cuzmify-action="whatsapp:general" href="https://wa.me/18005554526" style="padding:14px 24px;border-radius:14px;background:#25D366;color:#fff;font-weight:700;font-size:0.875rem;text-decoration:none;">WhatsApp Us</a>
      </div>
      <div style="display:flex;gap:24px;margin-top:24px;font-size:11px;color:#94A3B8;flex-wrap:wrap;">
        <span>✓ 100% Sanitized &amp; HD Products</span>
        <span>🏆 Award-Winning Team</span>
      </div>
    </div>
    <div style="position:relative;border-radius:24px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.15);">
      <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80" alt="Hero" style="width:100%;height:440px;object-fit:cover;"/>
      <div style="position:absolute;bottom:16px;left:16px;right:16px;padding:14px;border-radius:14px;background:rgba(0,0,0,0.7);backdrop-filter:blur(12px);color:#fff;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:700;">Royal Bridal Glam</span>
          <span style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;background:rgba(16,185,129,0.2);color:#34D399;text-transform:uppercase;">Available</span>
        </div>
        <p style="font-size:10px;color:#94A3B8;margin-top:4px;">24hr Airbrushing • Silk Lashes • Skin Glow</p>
      </div>
    </div>
  </section>

  <!-- ABOUT -->
  <section id="about" data-cuzmify-type="about" style="padding:80px 48px;background:#F7FAFC;max-width:1200px;margin:0 auto;box-sizing:border-box;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:48px;align-items:center;">
      <div style="border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.1);">
        <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80" alt="About" style="width:100%;height:360px;object-fit:cover;"/>
      </div>
      <div>
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#F59E0B;font-family:monospace;">About Our Studio</span>
        <h2 style="font-size:clamp(1.6rem,3.5vw,2.25rem);font-weight:800;color:#1A202C;margin:12px 0 16px;font-family:'Playfair Display',serif;">Mastering the Art of Flawless Transformation</h2>
        <p style="font-size:0.9rem;color:#64748B;line-height:1.8;margin-bottom:28px;">At Gmakeup Studio, we believe every face tells a unique story. With over a decade of experience in bridal, editorial runway, and celebrity glam, our certified artists combine high-end techniques with luxury skin prep.</p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding-top:24px;border-top:1px solid #E2E8F0;">
          <div><span style="display:block;font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">12+</span><span style="font-size:11px;color:#94A3B8;">Years Experience</span></div>
          <div><span style="display:block;font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">1.5k+</span><span style="font-size:11px;color:#94A3B8;">Brides Transformed</span></div>
          <div><span style="display:block;font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">100%</span><span style="font-size:11px;color:#94A3B8;">Client Satisfaction</span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- SERVICES -->
  <section id="services" data-cuzmify-type="services" style="padding:80px 48px;background:#fff;max-width:1200px;margin:0 auto;box-sizing:border-box;">
    <div style="max-width:1100px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:56px;">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#0D5771;font-family:monospace;">Services &amp; Pricing</span>
        <h2 data-cuzmify-field="section-title" style="font-size:clamp(1.75rem,3.5vw,2.25rem);font-weight:800;color:#1A202C;margin:12px 0;font-family:'Playfair Display',serif;">Curated Beauty Experiences</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
        <div style="padding:28px;border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,0.05);background:#fff;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
            <div><span style="font-size:9px;font-weight:700;text-transform:uppercase;color:#D97706;padding:3px 10px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">Bridal</span>
            <h3 style="font-size:1.05rem;font-weight:700;color:#1A202C;margin-top:10px;">Royal Bridal Suite Experience</h3></div>
            <span style="font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">$380</span>
          </div>
          <p style="font-size:0.8rem;color:#64748B;line-height:1.7;">Bespoke bridal transformation including pre-wedding trial, HD 24hr airbrushing, silk lashes and emergency touch-up kit.</p>
        </div>
        <div style="padding:28px;border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,0.05);background:#fff;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
            <div><span style="font-size:9px;font-weight:700;text-transform:uppercase;color:#D97706;padding:3px 10px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">Soft Glam</span>
            <h3 style="font-size:1.05rem;font-weight:700;color:#1A202C;margin-top:10px;">Red Carpet Soft Glam</h3></div>
            <span style="font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">$190</span>
          </div>
          <p style="font-size:0.8rem;color:#64748B;line-height:1.7;">Radiant skin-focused makeup with soft contouring, neutral warm tones, lash application and hydration prep.</p>
        </div>
        <div style="padding:28px;border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,0.05);background:#fff;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
            <div><span style="font-size:9px;font-weight:700;text-transform:uppercase;color:#D97706;padding:3px 10px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">Hairstyling</span>
            <h3 style="font-size:1.05rem;font-weight:700;color:#1A202C;margin-top:10px;">Hollywood Waves &amp; Crown Updo</h3></div>
            <span style="font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">$230</span>
          </div>
          <p style="font-size:0.8rem;color:#64748B;line-height:1.7;">Signature red-carpet Hollywood waves or intricate updo with scalp prep, heat protection and long-lasting shine seal.</p>
        </div>
        <div style="padding:28px;border-radius:20px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,0.05);background:#fff;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px;">
            <div><span style="font-size:9px;font-weight:700;text-transform:uppercase;color:#D97706;padding:3px 10px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">Masterclass</span>
            <h3 style="font-size:1.05rem;font-weight:700;color:#1A202C;margin-top:10px;">Private 1-on-1 Pro Masterclass</h3></div>
            <span style="font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">$480</span>
          </div>
          <p style="font-size:0.8rem;color:#64748B;line-height:1.7;">Intensive hands-on training covering shade matching, airbrushing, contouring, and client acquisition strategies.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- GALLERY -->
  <section id="portfolio" data-cuzmify-type="gallery" style="padding:80px 48px;background:#0F172A;box-sizing:border-box;">
    <div style="max-width:1100px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:48px;">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#F59E0B;font-family:monospace;">Live Work Portfolio</span>
        <h2 style="font-size:clamp(1.75rem,3.5vw,2rem);font-weight:800;color:#fff;margin:12px 0;font-family:'Playfair Display',serif;">Recent Makeup Artistry</h2>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;position:relative;"><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80" alt="Bridal" style="width:100%;height:100%;object-fit:cover;"/></div>
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;position:relative;"><img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80" alt="Editorial" style="width:100%;height:100%;object-fit:cover;"/></div>
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;position:relative;"><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80" alt="Hair" style="width:100%;height:100%;object-fit:cover;"/></div>
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;position:relative;"><img src="https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80" alt="Glam" style="width:100%;height:100%;object-fit:cover;"/></div>
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;position:relative;"><img src="https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=600&auto=format&fit=crop&q=80" alt="Minimal" style="width:100%;height:100%;object-fit:cover;"/></div>
        <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;position:relative;"><img src="https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=600&auto=format&fit=crop&q=80" alt="Runway" style="width:100%;height:100%;object-fit:cover;"/></div>
      </div>
    </div>
  </section>

  <!-- BOOKING -->
  <section id="booking" data-cuzmify-type="booking" style="padding:80px 48px;background:#F7FAFC;box-sizing:border-box;">
    <div style="max-width:560px;margin:0 auto;background:#fff;padding:48px 36px;border-radius:28px;border:1px solid #E2E8F0;box-shadow:0 20px 60px rgba(0,0,0,0.08);box-sizing:border-box;">
      <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#25D366;letter-spacing:0.1em;font-family:monospace;">WhatsApp Booking</span>
      <h2 style="font-size:clamp(1.5rem,3vw,1.75rem);font-weight:800;color:#1A202C;margin:10px 0 8px;font-family:'Playfair Display',serif;">Book Your Session</h2>
      <p style="font-size:0.85rem;color:#64748B;margin-bottom:28px;">Send us an instant WhatsApp booking request.</p>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <input type="text" placeholder="Your Full Name" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #E2E8F0;font-size:0.85rem;outline:none;box-sizing:border-box;"/>
        <input type="date" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #E2E8F0;font-size:0.85rem;outline:none;box-sizing:border-box;"/>
        <select data-cuzmify-type="service-select" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #E2E8F0;font-size:0.85rem;outline:none;background:#fff;box-sizing:border-box;">
          <option>Royal Bridal Suite ($380)</option>
          <option>Red Carpet Soft Glam ($190)</option>
          <option>Hollywood Waves ($230)</option>
          <option>Masterclass ($480)</option>
        </select>
        <a href="https://wa.me/1234567890" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;border-radius:14px;background:#25D366;color:#fff;font-weight:700;font-size:0.9rem;text-decoration:none;margin-top:4px;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.88 0-3.64-.507-5.16-1.39l-.37-.215-3.83.998 1.025-3.732-.238-.376c-.977-1.545-1.492-3.33-1.492-5.163 0-5.32 4.33-9.65 9.664-9.65 5.33 0 9.664 4.33 9.664 9.65 0 5.323-4.334 9.653-9.663 9.653m0-21.344c-6.444 0-11.69 5.245-11.69 11.691 0 2.062.536 4.07 1.554 5.845l-1.65 6.02 6.16-1.614c1.71 1.002 3.673 1.53 5.626 1.53 6.444 0 11.69-5.246 11.69-11.692 0-6.446-5.246-11.69-11.69-11.69"/></svg>
          Send WhatsApp Booking
        </a>
      </div>
    </div>
  </section>
`;

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    setService,
    setSaveState,
    setCanUndo,
    setCanRedo,
    setSelectedComponent,
    setActiveModuleModal,
    projectId,
    businessName,
    setBusinessName,
    theme,
    breakpoint,
    handleThemeChange,
  } = useEditor();

  const { data: session } = useSession();
  const currentUserId = session?.user?.id || session?.user?.email || 'guest';

  const cleanupRef = useRef<(() => void) | null>(null);
  const themeRef = useRef(theme);
  const businessNameRef = useRef(businessName);
  const userIdRef = useRef(currentUserId);
  const [isCanvasLoading, setIsCanvasLoading] = useState(true);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    businessNameRef.current = businessName;
  }, [businessName]);

  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  const domain = `${(businessName || 'glorybeauty').toLowerCase().replace(/\s+/g, '')}.cuzmify.com`;

  const initEditor = useCallback(async () => {
    if (!containerRef.current) return;

    const grapesjs = (await import('grapesjs')).default;

    const editor = grapesjs.init({
      container: containerRef.current,
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      avoidInlineStyle: false,
      keepUnusedStyles: true,
      panels: { defaults: [] },
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
          { id: 'mobile', name: 'Mobile', width: '390px', widthMedia: '480px' },
        ],
      },
      canvas: {
        styles: [
          'https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cinzel:wght@400..900&family=Cormorant+Garamond:ital,wght@0,300..700;1,300..700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:wght@100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Outfit:wght@100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Space+Grotesk:wght@300..700&family=Syne:wght@400..800&display=swap',
          'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        ],
      },
    });

    // Inject base reset stylesheet and attach keyboard shortcuts into iframe canvas
    editor.on('load', () => {
      const doc = editor.Canvas.getDocument();
      if (doc) {
        let style = doc.getElementById('cuzmify-base-css');
        if (!style) {
          style = doc.createElement('style');
          style.id = 'cuzmify-base-css';
          doc.head.appendChild(style);
        }
        style.innerHTML = RESPONSIVE_CORE_CSS;

        const handleCanvasKey = (e: KeyboardEvent) => {
          const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
          const isUndo = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
          const isRedo = (isMac ? (e.metaKey && e.shiftKey && e.key.toLowerCase() === 'z') || (e.metaKey && e.key.toLowerCase() === 'y') : (e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z'));

          if (isUndo) {
            e.preventDefault();
            service.undo();
            return;
          } else if (isRedo) {
            e.preventDefault();
            service.redo();
            return;
          }

          // Keyboard Arrow Nudging when element is selected and not editing inline text
          const activeEl = doc.activeElement as HTMLElement | null;
          const isTyping = activeEl && (activeEl.isContentEditable || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

          if (!isTyping && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const selected = editor.getSelected() as any;
            if (selected) {
              e.preventDefault();
              const delta = e.shiftKey ? 10 : 2;
              const currentTop = parseInt(service.getSelectedStyle('margin-top') || '0', 10) || 0;
              const currentLeft = parseInt(service.getSelectedStyle('margin-left') || '0', 10) || 0;

              if (e.key === 'ArrowUp') {
                service.updateSelectedStyle('margin-top', `${currentTop - delta}px`);
              } else if (e.key === 'ArrowDown') {
                service.updateSelectedStyle('margin-top', `${currentTop + delta}px`);
              } else if (e.key === 'ArrowLeft') {
                service.updateSelectedStyle('margin-left', `${currentLeft - delta}px`);
              } else if (e.key === 'ArrowRight') {
                service.updateSelectedStyle('margin-left', `${currentLeft + delta}px`);
              }
            }
          }
        };
        doc.addEventListener('keydown', handleCanvasKey);
      }
    });

    const service = new EditorService(editor, businessNameRef.current);

    // Override legacy GrapesJS asset manager to open Cuzmify's sleek Media Vault
    (editor.Commands as any).add('open-assets', {
      run() {
        setActiveModuleModal('media');
      },
    });

    editor.on('asset:select', (asset: any) => {
      const src = typeof asset === 'string' ? asset : (asset.get?.('src') || asset.src);
      if (src) {
        service.applyImageToSelected(src);
        service.addMediaAsset({
          url: src,
          name: asset.get?.('name') || 'Uploaded Media',
          type: 'gallery',
          source: 'upload',
        });
      }
      editor.Modal?.close();
    });

    editor.on('asset:custom', () => {
      setActiveModuleModal('media');
    });

    // 1. Instant 0ms SWR Hydration: Hydrate from LocalStorage or Default Template immediately
    const localRes = service.loadFromLocalStorage(projectId, userIdRef.current);
    if (localRes.loaded) {
      if (localRes.theme) handleThemeChange(localRes.theme as any);
      if (localRes.name) {
        setBusinessName(localRes.name);
        service.updateProfile({ name: localRes.name });
      } else if (businessNameRef.current) {
        service.updateProfile({ name: businessNameRef.current });
      }
      service.sanitizeCanvas();
      service.syncCanvasWithBlueprint();
      setIsCanvasLoading(false);
    } else {
      service.loadHtml(INITIAL_HTML, 'Initial Template', 'initial');
      if (businessNameRef.current) {
        service.updateProfile({ name: businessNameRef.current });
      }
      service.sanitizeCanvas();
      service.syncCanvasWithBlueprint();
      setIsCanvasLoading(false);
    }

    // 2. Background Cloud Database Sync (reconcile if cloud has newer data)
    service.loadFromDatabase(projectId).then((cloudRes) => {
      if (cloudRes.loaded) {
        if (cloudRes.theme) handleThemeChange(cloudRes.theme as any);
        if (cloudRes.name) {
          setBusinessName(cloudRes.name);
          service.updateProfile({ name: cloudRes.name });
        }
        service.sanitizeCanvas();
        service.syncCanvasWithBlueprint();
      }
      setIsCanvasLoading(false);
    });

    const unsubChange = service.onChanged(() => {
      setSaveState('unsaved');
      setCanUndo(service.canUndo());
      setCanRedo(service.canRedo());

      clearTimeout((globalThis as Record<string, unknown>).__cuzmifyAutoSave as ReturnType<typeof setTimeout>);
      (globalThis as Record<string, unknown>).__cuzmifyAutoSave = setTimeout(async () => {
        service.saveToLocalStorage(projectId, themeRef.current, userIdRef.current);
        await service.saveToDatabase(projectId, {
          businessName: businessNameRef.current,
          theme: themeRef.current,
        });
        setSaveState('saved');
      }, 1500);
    });

    const unsubSel = service.onSelectionChange((type) => {
      const traits = service.getSelectedComponentTraits();
      setSelectedComponent({ type, traits });
    });

    setService(service);
    if (typeof window !== 'undefined') {
      (window as any).__cuzmifyService = service;
      (window as any).__cuzmifyEditor = editor;
    }

    cleanupRef.current = () => {
      unsubChange();
      unsubSel();
      service.destroy();
    };
  }, [projectId, setService, setSaveState, setCanUndo, setCanRedo, setSelectedComponent, handleThemeChange]);

  useEffect(() => {
    initEditor();
    return () => {
      cleanupRef.current?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  return (
    <div className="relative flex-1 h-full bg-[#F1F5F9] overflow-hidden p-2 sm:p-4 flex flex-col items-center justify-center min-w-0">
      {/* Floating Window Container for Pristine UX */}
      <div className="w-full max-w-[1280px] h-full bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-[0_20px_60px_rgba(13,87,113,0.08)] flex flex-col overflow-hidden transition-all duration-200 relative">
        {/* Browser Top Bar Decorator */}
        <div className="h-8 bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 font-mono text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E2E8F0] text-[#64748B]">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>https://{domain}</span>
          </div>

          <div className="text-[#94A3B8] font-bold text-[9px] uppercase tracking-wider hidden sm:block">
            {breakpoint === 'mobile'
              ? '📱 Mobile Viewport (390px)'
              : breakpoint === 'tablet'
              ? '📱 Tablet Viewport (768px)'
              : '🖥️ Interactive Desktop Mode'}
          </div>
        </div>

        {/* Canvas Target */}
        <div className="flex-1 relative overflow-hidden bg-[#FFFFFF]">
          {isCanvasLoading && (
            <div className="absolute inset-0 z-40 bg-[#FFFFFF] flex flex-col items-center justify-center animate-in fade-in duration-200">
              <div className="flex flex-col items-center space-y-4 max-w-sm text-center px-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0D5771] to-teal-400 animate-spin opacity-70 blur-xs" />
                  <div className="absolute w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md border border-slate-100">
                    <Sparkles className="w-5 h-5 text-[#0D5771] animate-pulse" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-800 font-display tracking-tight uppercase">
                    Initializing Cuzmify Studio
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Hydrating visual canvas &amp; design tokens…
                  </p>
                </div>
                <div className="w-40 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-r from-[#0D5771] to-teal-400 animate-pulse" />
                </div>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
