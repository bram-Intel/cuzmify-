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
      { accentColor: '#D97706', buttonRadius: 'sharp', fontMood: 'bold_display' },
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
    expect(rendered.fullHtml).toContain('Flawless bridal morning glam!');
    expect(rendered.fullHtml).toContain('Do you travel outside Lagos?');
    expect(rendered.fullHtml).not.toContain('id="portfolio"');
  });

  it('signs and verifies user-scoped MCP Bearer tokens safely', () => {
    const token = generateUserMcpToken('user_abc_123');
    expect(verifyUserMcpToken(token)).toBe('user_abc_123');
    expect(verifyUserMcpToken(`${token}tampered`)).toBeNull();
  });
});
