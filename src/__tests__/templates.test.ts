import { describe, it, expect } from 'vitest';
import { createDefaultBlueprint } from '@/core/blueprint-schema';
import { NICHE_LIST, resolveNicheBlueprint } from '@/core/niche-blueprints';
import { renderTemplateEngine, scopeCssToTemplate, TEMPLATE_ENGINE_LIST } from '@/core/template-engines';

describe('Niche Blueprints & Lossless Multi-Template Engine', () => {
  it('resolves all service vendor niches without inventing fake prices', () => {
    expect(NICHE_LIST.length).toBeGreaterThanOrEqual(5);
    expect(resolveNicheBlueprint('Photographer').id).toBe('photography_media');
    expect(resolveNicheBlueprint('Caterers & Chefs').id).toBe('catering_cakes');
    expect(resolveNicheBlueprint('Event Planning').id).toBe('events_planning');
    expect(resolveNicheBlueprint('Fashion Designer').id).toBe('design_fashion');
    expect(resolveNicheBlueprint('Makeup Artist').id).toBe('beauty_makeup');
  });

  it('switches across all 3 Template Engines with 100% lossless preservation of user content', () => {
    const bp = createDefaultBlueprint({
      name: 'Kemi Celebrations',
      tagline: 'Luxury Lagos Event Styling & Floral Architecture',
      nicheId: 'events_planning',
      currency: 'NGN',
      city: 'Lagos',
      whatsapp: '2348031234567',
      instagramHandle: 'kemicelebrations',
      mediaVault: [
        {
          id: 'ig-1',
          url: '/api/media/ig?mediaId=101&handle=kemicelebrations',
          name: 'Floral Canopy',
          type: 'hero',
          source: 'instagram',
          addedAt: new Date().toISOString(),
        },
        {
          id: 'ig-2',
          url: '/api/media/ig?mediaId=102&handle=kemicelebrations',
          name: 'Reception Hall',
          type: 'gallery',
          source: 'instagram',
          addedAt: new Date().toISOString(),
        },
      ],
      services: [
        {
          id: 'srv-1',
          name: 'Intimate Dinner Styling',
          price: 450000,
          priceMode: 'starting_at',
          locationType: 'on_location',
          description: 'Table florals, candles & custom menu cards',
          enabled: true,
        },
        {
          id: 'srv-2',
          name: 'Full Wedding Production',
          price: 0,
          priceMode: 'quote',
          locationType: 'on_location',
          description: 'Bespoke end-to-end production',
          enabled: true,
        },
      ],
    });

    const outputs = TEMPLATE_ENGINE_LIST.map((tpl) => renderTemplateEngine(tpl.id, bp, { siteId: 'site_test_1' }));

    // All 3 outputs must have genuinely distinct markup roots & stylesheets
    expect(outputs[0].fullHtml).toContain('data-cuzmify-template="editorial-atelier"');
    expect(outputs[1].fullHtml).toContain('data-cuzmify-template="noir-showcase"');
    expect(outputs[2].fullHtml).toContain('data-cuzmify-template="modern-studio"');

    // Every single template preserves 100% of owner content & pricing modes without inventing fake data
    for (const out of outputs) {
      expect(out.fullHtml).toContain('Kemi Celebrations');
      expect(out.fullHtml).toContain('Luxury Lagos Event Styling &amp; Floral Architecture');
      expect(out.fullHtml).toContain('Intimate Dinner Styling');
      expect(out.fullHtml).toContain('From ₦450,000');
      expect(out.fullHtml).toContain('Full Wedding Production');
      expect(out.fullHtml).toContain('Custom Quote');
      expect(out.fullHtml).toContain('mediaId=101');
      expect(out.fullHtml).toContain('mediaId=102');
      expect(out.fullHtml).toContain('Request an Event Quote');
      // Never leak old hardcoded makeup defaults
      expect(out.fullHtml).not.toContain('Royal Bridal Suite');
      expect(out.fullHtml).not.toContain('Los Angeles');
    }
  });

  it('scopes customCss strictly inside [data-cuzmify-template] so AI/MCP styles never leak into Studio UI', () => {
    const bp = createDefaultBlueprint({ name: 'How', templateId: 'noir-showcase' });
    bp.templateDesignOverrides = {
      'noir-showcase': {
        customCss: `
          body::after { content: ""; position: fixed; inset: 0; }
          button, a { box-shadow: 0 0 18px cyan; text-transform: uppercase; }
          @media (min-width: 768px) { h2 { letter-spacing: 0.1em; } }
          * { font-family: monospace; }
        `,
      },
    };

    const rendered = renderTemplateEngine('noir-showcase', bp);
    expect(rendered.css).toContain('[data-cuzmify-template="noir-showcase"]::after');
    expect(rendered.css).toContain('[data-cuzmify-template="noir-showcase"] button');
    expect(rendered.css).toContain('[data-cuzmify-template="noir-showcase"] a');
    expect(rendered.css).toContain('@media (min-width: 768px){[data-cuzmify-template="noir-showcase"] h2');
    expect(rendered.css).toContain('[data-cuzmify-template="noir-showcase"], [data-cuzmify-template="noir-showcase"] *');
    expect(rendered.css).not.toMatch(/(^|[}\n])\s*body::after/);
    expect(rendered.css).not.toMatch(/(^|[}\n])\s*button\b/);

    const scoped = scopeCssToTemplate('h1, .card { color: cyan; }', '[data-cuzmify-template="noir-showcase"]');
    expect(scoped).toBe('[data-cuzmify-template="noir-showcase"] h1, [data-cuzmify-template="noir-showcase"] .card{ color: cyan; }');
  });
});
