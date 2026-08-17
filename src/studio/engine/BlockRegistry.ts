/**
 * BlockRegistry — registers all draggable section blocks in GrapesJS.
 * These appear in the Left Panel "Add" tab as droppable page sections.
 */
import type { Editor } from 'grapesjs';

const HERO_BLOCK_HTML = `
<section data-cuzmify-type="hero" style="position:relative;min-height:80vh;display:flex;align-items:center;background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);padding:80px 48px;font-family:'Plus Jakarta Sans',sans-serif;">
  <div style="max-width:640px;">
    <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);margin-bottom:24px;">
      <span style="color:#F59E0B;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Beauty Studio</span>
    </div>
    <h1 data-cuzmify-field="headline" style="font-size:clamp(2rem,5vw,3.5rem);font-weight:800;color:#FFFFFF;line-height:1.12;margin-bottom:20px;font-family:'Playfair Display',serif;">Elevating High-Fashion &amp; Bridal Elegance</h1>
    <p data-cuzmify-field="subheadline" style="font-size:1.05rem;color:#94A3B8;line-height:1.7;margin-bottom:36px;">World-class beauty artistry, flawless 24hr airbrushing, and bespoke styling for brides and red carpet events.</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap;">
      <a href="#booking" style="padding:14px 28px;border-radius:14px;background:#0D5771;color:#fff;font-weight:700;font-size:0.875rem;text-decoration:none;display:inline-flex;align-items:center;gap:8px;">Book Your Session →</a>
      <a href="https://wa.me/1234567890" style="padding:14px 24px;border-radius:14px;background:#25D366;color:#fff;font-weight:700;font-size:0.875rem;text-decoration:none;">WhatsApp Us</a>
    </div>
  </div>
  <div style="position:absolute;right:48px;top:50%;transform:translateY(-50%);width:420px;height:520px;border-radius:24px;overflow:hidden;display:none;">
    <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80" alt="Hero" style="width:100%;height:100%;object-fit:cover;"/>
  </div>
</section>`;

const SERVICES_BLOCK_HTML = `
<section data-cuzmify-type="services" style="padding:80px 48px;background:#F7FAFC;font-family:'Plus Jakarta Sans',sans-serif;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:56px;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0D5771;font-family:monospace;">Services &amp; Pricing</span>
      <h2 data-cuzmify-field="section-title" style="font-size:2.25rem;font-weight:800;color:#1A202C;margin:12px 0;font-family:'Playfair Display',serif;">Curated Beauty Experiences</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      <div style="background:#fff;border-radius:20px;padding:28px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,0.05);">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#F59E0B;padding:4px 10px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">Bridal</span>
        <h3 style="font-size:1.1rem;font-weight:700;color:#1A202C;margin:14px 0 8px;">Royal Bridal Suite Experience</h3>
        <p style="font-size:0.8rem;color:#64748B;line-height:1.65;margin-bottom:20px;">Bespoke bridal transformation including pre-wedding trial, HD airbrushing, silk lashes and touchup kit.</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">$380</span>
          <span style="font-size:11px;color:#94A3B8;">150 mins</span>
        </div>
      </div>
      <div style="background:#fff;border-radius:20px;padding:28px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,0.05);">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#F59E0B;padding:4px 10px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">Soft Glam</span>
        <h3 style="font-size:1.1rem;font-weight:700;color:#1A202C;margin:14px 0 8px;">Red Carpet Soft Glam</h3>
        <p style="font-size:0.8rem;color:#64748B;line-height:1.65;margin-bottom:20px;">Radiant skin-focused makeup with soft contouring, neutral warm tones, lash application, and hydration prep.</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">$190</span>
          <span style="font-size:11px;color:#94A3B8;">75 mins</span>
        </div>
      </div>
      <div style="background:#fff;border-radius:20px;padding:28px;border:1px solid #E2E8F0;box-shadow:0 4px 24px rgba(0,0,0,0.05);">
        <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:#F59E0B;padding:4px 10px;border-radius:999px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);">Masterclass</span>
        <h3 style="font-size:1.1rem;font-weight:700;color:#1A202C;margin:14px 0 8px;">Private 1-on-1 Pro Masterclass</h3>
        <p style="font-size:0.8rem;color:#64748B;line-height:1.65;margin-bottom:20px;">Intensive hands-on training covering shade matching, airbrushing, contouring, and client acquisition.</p>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:1.5rem;font-weight:900;color:#10B981;font-family:monospace;">$480</span>
          <span style="font-size:11px;color:#94A3B8;">3.5 Hours</span>
        </div>
      </div>
    </div>
  </div>
</section>`;

const GALLERY_BLOCK_HTML = `
<section data-cuzmify-type="gallery" style="padding:80px 48px;background:#0F172A;font-family:'Plus Jakarta Sans',sans-serif;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:48px;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#F59E0B;font-family:monospace;">Portfolio</span>
      <h2 style="font-size:2.25rem;font-weight:800;color:#fff;margin:12px 0;font-family:'Playfair Display',serif;">Recent Artistry</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
      <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;"><img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>
      <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;"><img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>
      <div style="border-radius:16px;overflow:hidden;aspect-ratio:4/5;"><img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80" alt="" style="width:100%;height:100%;object-fit:cover;"/></div>
    </div>
  </div>
</section>`;

const BOOKING_BLOCK_HTML = `
<section data-cuzmify-type="booking" id="booking" style="padding:80px 48px;background:#F7FAFC;font-family:'Plus Jakarta Sans',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:48px;border-radius:28px;border:1px solid #E2E8F0;box-shadow:0 20px 60px rgba(0,0,0,0.08);">
    <div style="margin-bottom:32px;">
      <span style="font-size:11px;font-weight:700;text-transform:uppercase;color:#25D366;letter-spacing:0.1em;font-family:monospace;">WhatsApp Booking</span>
      <h2 style="font-size:1.75rem;font-weight:800;color:#1A202C;margin:10px 0 8px;font-family:'Playfair Display',serif;">Book Your Session</h2>
      <p style="font-size:0.8rem;color:#64748B;">Send us a direct WhatsApp booking request instantly.</p>
    </div>
    <div style="display:flex;flex-direction:column;gap:14px;">
      <input type="text" placeholder="Your Full Name" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #E2E8F0;font-size:0.85rem;outline:none;box-sizing:border-box;"/>
      <input type="date" style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #E2E8F0;font-size:0.85rem;outline:none;box-sizing:border-box;"/>
      <select style="width:100%;padding:14px 16px;border-radius:12px;border:1px solid #E2E8F0;font-size:0.85rem;outline:none;background:#fff;box-sizing:border-box;">
        <option>Royal Bridal Suite ($380)</option>
        <option>Red Carpet Soft Glam ($190)</option>
        <option>Masterclass ($480)</option>
      </select>
      <a href="https://wa.me/1234567890" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:16px;border-radius:14px;background:#25D366;color:#fff;font-weight:700;font-size:0.9rem;text-decoration:none;margin-top:8px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.88 0-3.64-.507-5.16-1.39l-.37-.215-3.83.998 1.025-3.732-.238-.376c-.977-1.545-1.492-3.33-1.492-5.163 0-5.32 4.33-9.65 9.664-9.65 5.33 0 9.664 4.33 9.664 9.65 0 5.323-4.334 9.653-9.663 9.653m0-21.344c-6.444 0-11.69 5.245-11.69 11.691 0 2.062.536 4.07 1.554 5.845l-1.65 6.02 6.16-1.614c1.71 1.002 3.673 1.53 5.626 1.53 6.444 0 11.69-5.246 11.69-11.692 0-6.446-5.246-11.69-11.69-11.69"/></svg>
        Send WhatsApp Booking
      </a>
    </div>
  </div>
</section>`;

const TESTIMONIALS_BLOCK_HTML = `
<section data-cuzmify-type="testimonials" style="padding:80px 48px;background:#fff;font-family:'Plus Jakarta Sans',sans-serif;">
  <div style="max-width:1100px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:48px;">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#0D5771;font-family:monospace;">Testimonials</span>
      <h2 style="font-size:2rem;font-weight:800;color:#1A202C;margin:12px 0;font-family:'Playfair Display',serif;">What Our Clients Say</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
      <div style="padding:28px;background:#F7FAFC;border-radius:20px;border:1px solid #E2E8F0;">
        <div style="display:flex;gap:4px;margin-bottom:14px;">${'★'.repeat(5).split('').map(() => '<span style="color:#F59E0B;font-size:16px;">★</span>').join('')}</div>
        <p style="font-size:0.875rem;color:#334155;line-height:1.7;margin-bottom:20px;">"Absolutely stunning work. My bridal look was exactly what I dreamed of. I felt like royalty on my wedding day!"</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#0D5771,#3498E3);"></div>
          <div><p style="font-size:0.875rem;font-weight:700;color:#1A202C;">Sarah K.</p><p style="font-size:11px;color:#94A3B8;">Bride, Lagos</p></div>
        </div>
      </div>
      <div style="padding:28px;background:#F7FAFC;border-radius:20px;border:1px solid #E2E8F0;">
        <div style="display:flex;gap:4px;margin-bottom:14px;">${'★'.repeat(5).split('').map(() => '<span style="color:#F59E0B;font-size:16px;">★</span>').join('')}</div>
        <p style="font-size:0.875rem;color:#334155;line-height:1.7;margin-bottom:20px;">"The masterclass was worth every naira. I now have my own client base and full professional kit. Game changer!"</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#F59E0B,#FBBF24);"></div>
          <div><p style="font-size:0.875rem;font-weight:700;color:#1A202C;">Amara O.</p><p style="font-size:11px;color:#94A3B8;">MUA Student, Abuja</p></div>
        </div>
      </div>
      <div style="padding:28px;background:#F7FAFC;border-radius:20px;border:1px solid #E2E8F0;">
        <div style="display:flex;gap:4px;margin-bottom:14px;">${'★'.repeat(5).split('').map(() => '<span style="color:#F59E0B;font-size:16px;">★</span>').join('')}</div>
        <p style="font-size:0.875rem;color:#334155;line-height:1.7;margin-bottom:20px;">"My editorial shoot photos came out breathtaking. The makeup held for 10+ hours under studio lights. Phenomenal!"</p>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#10B981,#34D399);"></div>
          <div><p style="font-size:0.875rem;font-weight:700;color:#1A202C;">Temi R.</p><p style="font-size:11px;color:#94A3B8;">Model, Port Harcourt</p></div>
        </div>
      </div>
    </div>
  </div>
</section>`;

const CTA_BLOCK_HTML = `
<section style="padding:80px 48px;background:linear-gradient(135deg,#0D5771 0%,#0F172A 100%);text-align:center;font-family:'Plus Jakarta Sans',sans-serif;">
  <div style="max-width:640px;margin:0 auto;">
    <h2 style="font-size:2rem;font-weight:800;color:#fff;margin-bottom:16px;font-family:'Playfair Display',serif;">Ready to Transform Your Look?</h2>
    <p style="font-size:1rem;color:#94A3B8;margin-bottom:36px;">Join 1,500+ clients who trust us for their most important moments.</p>
    <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
      <a href="#booking" style="padding:16px 36px;border-radius:14px;background:#F59E0B;color:#000;font-weight:800;font-size:0.9rem;text-decoration:none;">Book Now</a>
      <a href="https://wa.me/1234567890" style="padding:16px 28px;border-radius:14px;background:#25D366;color:#fff;font-weight:700;font-size:0.9rem;text-decoration:none;">Chat on WhatsApp</a>
    </div>
  </div>
</section>`;

export const BLOCK_HTML_MAP: Record<string, string> = {
  'cuzmify-hero': HERO_BLOCK_HTML,
  'cuzmify-services': SERVICES_BLOCK_HTML,
  'cuzmify-gallery': GALLERY_BLOCK_HTML,
  'cuzmify-booking': BOOKING_BLOCK_HTML,
  'cuzmify-testimonials': TESTIMONIALS_BLOCK_HTML,
  'cuzmify-cta': CTA_BLOCK_HTML,
};

export class BlockRegistry {
  static register(editor: Editor): void {
    editor.Blocks.add('cuzmify-hero', {
      id: 'cuzmify-hero',
      label: 'Hero Section',
      category: 'Sections',
      media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M7 8h6M7 12h4"/></svg>`,
      content: HERO_BLOCK_HTML,
      activate: true,
    });

    editor.Blocks.add('cuzmify-services', {
      id: 'cuzmify-services',
      label: 'Services & Pricing',
      category: 'Sections',
      media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>`,
      content: SERVICES_BLOCK_HTML,
    });

    editor.Blocks.add('cuzmify-gallery', {
      id: 'cuzmify-gallery',
      label: 'Portfolio Gallery',
      category: 'Sections',
      media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
      content: GALLERY_BLOCK_HTML,
    });

    editor.Blocks.add('cuzmify-booking', {
      id: 'cuzmify-booking',
      label: 'WhatsApp Booking',
      category: 'Sections',
      media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.88 0-3.64-.507-5.16-1.39l-.37-.215-3.83.998 1.025-3.732-.238-.376c-.977-1.545-1.492-3.33-1.492-5.163 0-5.32 4.33-9.65 9.664-9.65 5.33 0 9.664 4.33 9.664 9.65 0 5.323-4.334 9.653-9.663 9.653m0-21.344c-6.444 0-11.69 5.245-11.69 11.691 0 2.062.536 4.07 1.554 5.845l-1.65 6.02 6.16-1.614c1.71 1.002 3.673 1.53 5.626 1.53 6.444 0 11.69-5.246 11.69-11.692 0-6.446-5.246-11.69-11.69-11.69"/></svg>`,
      content: BOOKING_BLOCK_HTML,
    });

    editor.Blocks.add('cuzmify-testimonials', {
      id: 'cuzmify-testimonials',
      label: 'Testimonials',
      category: 'Sections',
      media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>`,
      content: TESTIMONIALS_BLOCK_HTML,
    });

    editor.Blocks.add('cuzmify-cta', {
      id: 'cuzmify-cta',
      label: 'Call to Action',
      category: 'Sections',
      media: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
      content: CTA_BLOCK_HTML,
    });
  }
}
