import { describe, expect, it } from 'vitest';
import { createDefaultBlueprint } from '@/core/blueprint-schema';
import { renderTemplateEngine } from '@/core/template-engines';
import { FREE_PLAN_SERVICE_LIMIT } from '@/lib/billing-constants';
import {
  CUZMIFY_MCP_TOOLS,
  executeBlueprintMcpTool,
  toGeminiFunctionDeclarations,
} from '@/lib/mcp/cuzmify-tools';
import { generateUserMcpToken, verifyUserMcpToken } from '@/lib/mcp/mcp-auth';

describe('Cuzmify MCP Tool Registry & Execution', () => {
  it('exposes full autonomous MCP schemas and Gemini function declarations including publish & enquiries', () => {
    expect(CUZMIFY_MCP_TOOLS.length).toBeGreaterThanOrEqual(16);
    const decls = toGeminiFunctionDeclarations(true);
    expect(decls.some((d) => d.name === 'upsert_service_package')).toBe(true);
    expect(decls.some((d) => d.name === 'customize_template_copy')).toBe(true);
    expect(decls.some((d) => d.name === 'customize_template_design')).toBe(true);
    expect(decls.some((d) => d.name === 'toggle_section_visibility')).toBe(true);
    expect(decls.some((d) => d.name === 'publish_site')).toBe(true);
    expect(decls.some((d) => d.name === 'list_enquiries')).toBe(true);
  });

  it('adds and updates services without inventing prices and respects free tier limits', () => {
    let bp = createDefaultBlueprint({ name: 'Tolu Artistry', currency: 'NGN', nicheId: 'beauty_makeup' });

    // Quote service (no price)
    const r1 = executeBlueprintMcpTool(
      'upsert_service_package',
      { name: 'Destination Bridal Quote', price: 0, priceMode: 'quote' },
      bp,
      { plan: 'free' }
    );
    expect(r1.ok).toBe(true);
    expect(r1.blueprint.modules.services.items[0].priceMode).toBe('quote');
    bp = r1.blueprint;

    // Fill up to FREE_PLAN_SERVICE_LIMIT
    for (let i = 2; i <= FREE_PLAN_SERVICE_LIMIT; i++) {
      const res = executeBlueprintMcpTool(
        'upsert_service_package',
        { name: `Package ${i}`, price: 25000 * i, priceMode: 'starting_at' },
        bp,
        { plan: 'free' }
      );
      expect(res.ok).toBe(true);
      bp = res.blueprint;
    }

    // Exceeding free tier fails cleanly on free plan, succeeds on pro
    const blocked = executeBlueprintMcpTool(
      'upsert_service_package',
      { name: 'VIP Package 5', price: 150000 },
      bp,
      { plan: 'free' }
    );
    expect(blocked.ok).toBe(false);

    const allowedPro = executeBlueprintMcpTool(
      'upsert_service_package',
      { name: 'VIP Package 5', price: 150000 },
      bp,
      { plan: 'pro' }
    );
    expect(allowedPro.ok).toBe(true);
  });

  it('switches template styles losslessly while keeping services and promotes hero photo', () => {
    let bp = createDefaultBlueprint({
      name: 'Kemi Events',
      currency: 'NGN',
      mediaVault: [
        { id: 'img-1', url: 'https://example.com/1.webp', name: 'Shot 1', type: 'hero', source: 'upload', addedAt: '' },
        { id: 'img-2', url: 'https://example.com/2.webp', name: 'Shot 2', type: 'gallery', source: 'upload', addedAt: '' },
      ],
    });
    bp = executeBlueprintMcpTool('upsert_service_package', { name: 'Full Decor', price: 450000 }, bp).blueprint;

    const switched = executeBlueprintMcpTool('switch_template_style', { templateId: 'noir-showcase' }, bp);
    expect(switched.ok).toBe(true);
    expect(switched.blueprint.templateId).toBe('noir-showcase');
    expect(switched.blueprint.modules.services.items).toHaveLength(1);

    const promoted = executeBlueprintMcpTool('promote_media_to_hero', { photoNumber: 2 }, switched.blueprint);
    expect(promoted.ok).toBe(true);
    expect(promoted.blueprint.mediaVault[0].id).toBe('img-2');
    expect(promoted.blueprint.mediaVault[0].type).toBe('hero');
  });

  it('customizes template copy, design tokens, section visibility, testimonials, and FAQs cleanly across engines', () => {
    let bp = createDefaultBlueprint({
      name: 'Zainab Atelier',
      templateId: 'editorial-atelier',
      mediaVault: [
        { id: 'img-1', url: 'https://example.com/hero.webp', name: 'Hero', type: 'hero', source: 'upload', addedAt: '' },
        { id: 'img-2', url: 'https://example.com/work.webp', name: 'Work', type: 'gallery', source: 'upload', addedAt: '' },
      ],
    });

    bp = executeBlueprintMcpTool(
      'upsert_service_package',
      { name: 'Soft Bridal Glam', price: 85000, priceMode: 'fixed' },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool(
      'customize_template_copy',
      { primaryCta: 'Reserve Your Slot', servicesHeading: 'Curated Rate Card' },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool(
      'customize_template_design',
      {
        accentColor: '#D97706',
        buttonRadius: 'sharp',
        fontMood: 'bold_display',
        pagePaddingX: 'spacious',
        sectionSpacing: 'compact',
        heroImageAspect: 'square',
        heroImageMaxHeight: 340,
        heroImageShape: 'rounded',
        heroImageFit: 'contain',
        galleryColumns: 2,
      },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool(
      'upsert_testimonial',
      { clientName: 'Amaka O.', quote: 'Flawless bridal morning glam!', roleOrEvent: 'Lagos Wedding' },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool(
      'upsert_faq',
      { question: 'Do you travel outside Lagos?', answer: 'Yes, worldwide bridal travel is available.' },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool(
      'toggle_section_visibility',
      { section: 'portfolio', visible: false },
      bp
    ).blueprint;

    const rendered = renderTemplateEngine('editorial-atelier', bp);
    expect(rendered.fullHtml).toContain('Reserve Your Slot');
    expect(rendered.fullHtml).toContain('Curated Rate Card');
    expect(rendered.css).toContain('--cz-accent:#D97706');
    expect(rendered.css).toContain('border-radius:4px');
    expect(rendered.css).toContain('padding-left:32px');
    expect(rendered.css).toContain('padding-top:32px');
    expect(rendered.css).toContain('max-height:340px');
    expect(rendered.css).toContain('object-fit:contain');
    expect(rendered.css).toContain('grid-template-columns:repeat(2,1fr)');
    expect(rendered.css).not.toContain('padding:40px 0 56px');
    expect(rendered.fullHtml).toContain('cz-hero-media');
    expect(rendered.fullHtml).toContain('Flawless bridal morning glam!');
    expect(rendered.fullHtml).toContain('Do you travel outside Lagos?');
    expect(rendered.fullHtml).not.toContain('id="portfolio"');
  });

  it('isolates designOverrides per template and preserves custom tweaks when switching or resetting', () => {
    let bp = createDefaultBlueprint({ name: 'Brandy Queen', templateId: 'editorial-atelier' });

    bp = executeBlueprintMcpTool(
      'customize_template_design',
      { accentColor: '#9A6B4C', heroImageMaxHeight: 280, heroImageFit: 'contain' },
      bp
    ).blueprint;

    // Switching to modern-studio loads native clean defaults without leaking editorial overrides
    bp = executeBlueprintMcpTool('switch_template_style', { templateId: 'modern-studio' }, bp).blueprint;
    expect(bp.designOverrides).toEqual({});
    const modernRendered = renderTemplateEngine('modern-studio', bp);
    expect(modernRendered.css).not.toContain('max-height:280px');

    // Resetting modern-studio does NOT wipe editorial-atelier's saved tweaks
    bp = executeBlueprintMcpTool('customize_template_design', { resetToDefaults: true }, bp).blueprint;
    bp = executeBlueprintMcpTool('switch_template_style', { templateId: 'editorial-atelier' }, bp).blueprint;
    expect(bp.designOverrides?.heroImageMaxHeight).toBe(280);
    expect(bp.designOverrides?.heroImageFit).toBe('contain');
    const editorialRendered = renderTemplateEngine('editorial-atelier', bp);
    expect(editorialRendered.css).toContain('max-height:280px');
  });

  it('isolates mobile/tablet/desktop overrides cleanly and supports heroLayout, servicesLayout, reorder_sections, and custom sections', () => {
    let bp = createDefaultBlueprint({
      name: 'Zara Glam',
      templateId: 'editorial-atelier',
      mediaVault: [
        { id: 'img-1', url: 'https://example.com/hero.webp', name: 'Hero', type: 'hero', source: 'upload', addedAt: '' },
        { id: 'img-2', url: 'https://example.com/work.webp', name: 'Work', type: 'gallery', source: 'upload', addedAt: '' },
      ],
    });
    bp = executeBlueprintMcpTool('upsert_service_package', { name: 'Bridal Look', price: 120000 }, bp).blueprint;

    // Isolated Mobile override
    bp = executeBlueprintMcpTool(
      'customize_template_design',
      {
        device: 'mobile',
        heroTextAlign: 'center',
        heroImageMaxHeight: 220,
        galleryColumns: 1,
        fontScale: 'compact',
      },
      bp
    ).blueprint;

    // Isolated Desktop override
    bp = executeBlueprintMcpTool(
      'customize_template_design',
      {
        device: 'desktop',
        heroTextAlign: 'left',
        galleryColumns: 4,
      },
      bp
    ).blueprint;

    // Structural layouts + section reorder + custom info section
    bp = executeBlueprintMcpTool(
      'customize_template_design',
      { heroLayout: 'centered', servicesLayout: 'compact_menu' },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool(
      'upsert_custom_section',
      {
        title: 'Studio Hours & Policy',
        layout: 'hours_info',
        items: [
          { label: 'Tue – Sat', detail: '9:00 AM – 7:00 PM' },
          { label: 'Booking Deposit', detail: '50% secures appointment date' },
        ],
      },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool(
      'reorder_sections',
      { order: ['hero', 'custom', 'portfolio', 'services', 'booking'] },
      bp
    ).blueprint;

    const rendered = renderTemplateEngine('editorial-atelier', bp);
    expect(rendered.css).toContain('@media (max-width:767px){');
    expect(rendered.css).toContain('max-height:220px');
    expect(rendered.css).toContain('@media (min-width:1024px){');
    expect(rendered.css).toContain('grid-template-columns:repeat(4,1fr)');
    expect(rendered.fullHtml).toContain('Studio Hours &amp; Policy');
    expect(rendered.fullHtml).toContain('9:00 AM – 7:00 PM');
    // Verify custom order puts custom-section before portfolio & services
    const customIdx = rendered.fullHtml.indexOf('data-cuzmify-type="custom-section"');
    const portfolioIdx = rendered.fullHtml.indexOf('id="portfolio"');
    const servicesIdx = rendered.fullHtml.indexOf('id="services"');
    expect(customIdx).toBeGreaterThan(-1);
    expect(portfolioIdx).toBeGreaterThan(customIdx);
    expect(servicesIdx).toBeGreaterThan(portfolioIdx);
  });

  it('provides full zero-browser visual & structural inspection (contrast, breakpoints, rendered/skipped sections & QA findings)', () => {
    let bp = createDefaultBlueprint({
      name: 'Brandy Queen',
      templateId: 'editorial-atelier',
      mediaVault: [
        {
          id: 'img-1',
          url: 'data:image/png;base64,iVBORw0KGgo=',
          name: 'Cuzmify meta icon 1024',
          type: 'hero',
          source: 'upload',
          width: 1024,
          height: 1024,
          addedAt: '',
        },
      ],
    });
    bp = executeBlueprintMcpTool(
      'customize_template_design',
      { device: 'mobile', servicesColumns: 2, heroImageFit: 'cover' },
      bp
    ).blueprint;
    bp = executeBlueprintMcpTool('upsert_service_package', { name: 'Bridal Look', price: 0 }, bp).blueprint;

    const inspected = executeBlueprintMcpTool(
      'inspect_rendered_page',
      { includeHtml: true, includeCss: true },
      bp,
      {
        siteMeta: {
          id: 'site_1',
          status: 'draft',
          subdomain: 'brandyqueen',
          enquiriesCount: 2,
          accountSites: [{ id: 'site_1', name: 'Brandy Queen', subdomain: 'brandyqueen', status: 'draft', templateId: 'editorial-atelier' }],
        },
      }
    );

    expect(inspected.ok).toBe(true);
    const d: any = inspected.data;
    expect(d.contrastAudit.textOnBackground).toBeGreaterThan(10);
    expect(d.effectiveDesign.mobile.servicesColumns).toBe(2);
    expect(d.effectiveDesign.desktop.servicesColumns).toBe(1);
    expect(d.renderedSections.map((s: any) => s.id)).toEqual(['hero', 'services', 'portfolio', 'booking']);
    expect(d.skippedSections.some((s: any) => s.section === 'testimonials')).toBe(true);
    expect(d.mediaInventory[0].orientation).toBe('square');
    expect(d.mediaInventory[0].assignedRole).toBe('hero_cover');
    expect(d.qaFindings.some((f: any) => f.area === 'mobile_layout')).toBe(true);
    expect(d.qaFindings.some((f: any) => f.area === 'media')).toBe(true);
    expect(d.account.accountSites).toHaveLength(1);
    expect(d.html).toContain('Brandy Queen');
    expect(d.css).toContain('@media (max-width:767px)');

    // Also verify WhatsApp button displays the WhatsApp brand SVG once WhatsApp is linked
    const bpWithWa = executeBlueprintMcpTool('configure_whatsapp', { phoneNumber: '2348031234567' }, bp).blueprint;
    const renderedWithWa = renderTemplateEngine('editorial-atelier', bpWithWa);
    expect(renderedWithWa.html).toContain('<svg width="18" height="18"');
    expect(renderedWithWa.html).toContain('via WhatsApp');
  });

  it('signs and verifies user-scoped MCP Bearer tokens safely', () => {
    const token = generateUserMcpToken('user_abc_123');
    expect(verifyUserMcpToken(token)).toBe('user_abc_123');
    expect(verifyUserMcpToken(`${token}tampered`)).toBeNull();
  });
});
