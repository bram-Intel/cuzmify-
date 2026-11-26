import { describe, expect, it } from 'vitest';
import { createDefaultBlueprint } from '@/core/blueprint-schema';
import { applyMobileImageReplacement, applyMobileTextEdit } from '@/studio/mobile-preview-edit';
import {
  buildElementSnapshotFromSelection,
  formatMcpElementReference,
  sanitizeHtmlSnippetForMcp,
} from '@/studio/mcp-target-clipboard';

describe('Mobile Live Preview Quick-Edit Mutations', () => {
  it('swaps hero, service, and portfolio images cleanly from Media Vault without duplication', () => {
    const bp = createDefaultBlueprint({
      name: 'Brandy Queen',
      templateId: 'editorial-atelier',
      mediaVault: [
        { id: 'mv-1', url: 'https://example.com/1.webp', name: 'Hero 1', type: 'hero', source: 'upload', addedAt: '' },
        { id: 'mv-2', url: 'https://example.com/2.webp', name: 'Look 2', type: 'gallery', source: 'upload', addedAt: '' },
        { id: 'mv-3', url: 'https://example.com/3.webp', name: 'Look 3', type: 'gallery', source: 'upload', addedAt: '' },
      ],
    });
    bp.modules.services.items = [
      {
        id: 'srv-1',
        name: 'Bridal Glam',
        price: 150000,
        priceMode: 'fixed',
        locationType: 'in_studio',
        description: 'Full luxury bridal look',
        enabled: true,
      },
    ];

    // 1. Swap Hero Cover Photo with mv-3
    const heroRes = applyMobileImageReplacement(
      bp,
      { role: 'hero', assetId: 'mv-1', label: 'Hero Cover Photo', currentSrc: 'https://example.com/1.webp' },
      bp.mediaVault[2]
    );
    expect(heroRes.blueprint.mediaVault[0].id).toBe('mv-3');
    expect(heroRes.blueprint.mediaVault[0].type).toBe('hero');
    expect(heroRes.blueprint.mediaVault).toHaveLength(3);

    // 2. Swap Portfolio slot #2 (mv-2) with mv-1
    const galRes = applyMobileImageReplacement(
      bp,
      { role: 'gallery', assetId: 'mv-2', label: 'Portfolio: Look 2', currentSrc: 'https://example.com/2.webp' },
      bp.mediaVault[0]
    );
    expect(galRes.blueprint.mediaVault.map((m) => m.id)).toEqual(['mv-2', 'mv-1', 'mv-3']);

    // 3. Attach mv-2 to Service Card srv-1
    const srvRes = applyMobileImageReplacement(
      bp,
      { role: 'service', serviceId: 'srv-1', label: 'Bridal Glam Photo', currentSrc: '' },
      bp.mediaVault[1]
    );
    expect(srvRes.blueprint.modules.services.items[0].imageUrl).toBe('https://example.com/2.webp');
  });

  it('applies inline mobile text edits cleanly across profile, customCopy, service title, and price', () => {
    const bp = createDefaultBlueprint({ name: 'Old Studio', templateId: 'editorial-atelier' });
    bp.modules.services.items = [
      {
        id: 'srv-1',
        name: 'Soft Glam',
        price: 0,
        priceMode: 'quote',
        locationType: 'in_studio',
        description: 'Everyday soft glam',
        enabled: true,
      },
    ];

    const r1 = applyMobileTextEdit(
      bp,
      { kind: 'profile', key: 'name', label: 'Business Name', value: 'Old Studio', multiline: false },
      'Brandy Queen Atelier'
    );
    expect(r1.blueprint.profile.name).toBe('Brandy Queen Atelier');

    const r2 = applyMobileTextEdit(
      r1.blueprint,
      { kind: 'copy', key: 'headline', label: 'Hero Headline', value: '', multiline: true },
      'Timeless Bridal Glamour'
    );
    expect(r2.blueprint.customCopy?.headline).toBe('Timeless Bridal Glamour');

    const r3 = applyMobileTextEdit(
      r2.blueprint,
      { kind: 'service_price', serviceId: 'srv-1', label: 'Soft Glam Price', value: '0', multiline: false },
      '75000'
    );
    expect(r3.blueprint.modules.services.items[0].price).toBe(75000);
    expect(r3.blueprint.modules.services.items[0].priceMode).toBe('fixed');
  });

  it('formats crisp external MCP target clipboard references and strips bloated base64 URIs', () => {
    const bp = createDefaultBlueprint({ name: 'Brandy Queen', templateId: 'editorial-atelier' });
    const rawHtml =
      '<div data-cuzmify-target-id="srv-9"><img src="data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=" /><h3>Bridal Glam</h3></div>';

    const sanitized = sanitizeHtmlSnippetForMcp(rawHtml);
    expect(sanitized).toContain('[uploaded-image-data]');
    expect(sanitized).not.toContain('UklGRh4AAABX');

    const snap = buildElementSnapshotFromSelection(
      null,
      {
        id: 'srv-9',
        tagName: 'div',
        text: 'Bridal Glam',
        htmlSnippet: rawHtml,
      },
      { siteId: 'site_123', blueprint: bp, viewport: 'mobile' }
    );
    expect(snap).not.toBeNull();
    const formatted = formatMcpElementReference({
      ...snap!,
      sectionId: 'services',
      cuzmifyTargetId: 'srv-9',
      selector: '#services [data-cuzmify-target-id="srv-9"]',
    });
    expect(formatted).toContain('[Cuzmify MCP Target Element]');
    expect(formatted).toContain('siteId="site_123"');
    expect(formatted).toContain('viewport="mobile"');
    expect(formatted).toContain('upsert_service_package(id="srv-9")');
    expect(formatted).toContain('[uploaded-image-data]');
  });
});
