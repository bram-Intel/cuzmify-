import { describe, expect, it } from 'vitest';
import { createDefaultBlueprint } from '@/core/blueprint-schema';
import { renderTemplateEngine } from '@/core/template-engines';
import { HistoryManager } from '@/studio/engine/HistoryManager';
import {
  applyMobileImageReplacement,
  applyMobileTextEdit,
  replaceTextInHtmlFragment,
} from '@/studio/mobile-preview-edit';
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

  it('swaps video reels in mobile quick-edit while preserving mediaKind and formats video MCP targets', () => {
    const bp = createDefaultBlueprint({
      name: 'Motion Lab',
      templateId: 'modern-studio',
      mediaVault: [
        { id: 'mv-img', url: 'https://example.com/cover.webp', name: 'Cover Still', type: 'hero', mediaKind: 'image', source: 'upload', addedAt: '' },
        { id: 'mv-vid', url: '/api/media/ig?mediaId=555&kind=video', thumbnailUrl: '/api/media/ig?mediaId=555', name: 'Reel Clip', type: 'video', mediaKind: 'video', source: 'instagram', addedAt: '' },
      ],
    });
    bp.modules.services.items = [
      {
        id: 'srv-vid',
        name: 'Promo Reel Shoot',
        price: 90000,
        priceMode: 'fixed',
        locationType: 'in_studio',
        description: 'Short-form studio video',
        enabled: true,
      },
    ];

    const heroVidSwap = applyMobileImageReplacement(
      bp,
      { role: 'hero', assetId: 'mv-img', label: 'Hero Cover Photo', currentSrc: 'https://example.com/cover.webp', mediaKind: 'image' },
      bp.mediaVault[1]
    );
    expect(heroVidSwap.summary).toBe('Updated hero cover video');
    expect(heroVidSwap.blueprint.mediaVault[0].type).toBe('hero');
    expect(heroVidSwap.blueprint.mediaVault[0].mediaKind).toBe('video');

    const srvVidSwap = applyMobileImageReplacement(
      bp,
      { role: 'service', serviceId: 'srv-vid', label: 'Promo Reel Shoot Photo', currentSrc: '', mediaKind: 'image' },
      bp.mediaVault[1]
    );
    expect(srvVidSwap.summary).toBe('Updated service video');
    expect(srvVidSwap.blueprint.modules.services.items[0].imageUrl).toBe('/api/media/ig?mediaId=555&kind=video');

    const vidSnippet = '<video src="data:video/mp4;base64,AAAAIGZ0eXBpc29t" autoplay muted loop></video>';
    expect(sanitizeHtmlSnippetForMcp(vidSnippet)).toContain('[uploaded-video-data]');

    const formattedVidTarget = formatMcpElementReference({
      siteId: 'site_vid_1',
      templateId: 'modern-studio',
      viewport: 'mobile',
      tagName: 'video',
      sectionId: 'hero',
      cuzmifyImgRole: 'hero',
      mediaKind: 'video',
      selector: '#hero video',
      imageSrc: '[embedded-vault-video role=hero]',
      posterSrc: '/api/media/ig?mediaId=555',
      htmlSnippet: sanitizeHtmlSnippetForMcp(vidSnippet),
    });
    expect(formattedVidTarget).toContain('mediaKind="video"');
    expect(formattedVidTarget).toContain('video: [embedded-vault-video role=hero]');
    expect(formattedVidTarget).toContain('poster: /api/media/ig?mediaId=555');
  });

  it('edits AI-injected footer slot text and custom section text without corrupting HTML attributes or entities', () => {
    const bp = createDefaultBlueprint({ name: 'Leba Studio', templateId: 'noir-showcase' });
    bp.templateInjections = {
      'noir-showcase': {
        footer:
          '<div class="cz-footer-wrap" style="padding:32px 20px;background:#09090B;"><h4 style="margin:0;">Leba Luxury Atelier</h4><p class="cz-copy">&copy; 2026 Leba &amp; Co. &bull; Lekki Phase 1</p></div>',
      },
    };
    bp.customSections = [
      {
        id: 'sec-hours',
        title: 'Studio Hours',
        eyebrow: 'Visit Us',
        layout: 'hours_info',
        items: [{ label: 'Tue – Sat', detail: '9:00 AM – 7:00 PM' }],
      },
    ];

    const footerEdit = applyMobileTextEdit(
      bp,
      {
        kind: 'slot_text',
        slot: 'footer',
        originalText: '© 2026 Leba & Co. • Lekki Phase 1',
        occurrenceIndex: 0,
        label: 'Footer Text',
        value: '© 2026 Leba & Co. • Lekki Phase 1',
        multiline: false,
      },
      '© 2026 Leba Beauty • Victoria Island, Lagos'
    );

    const updatedFooter = footerEdit.blueprint.templateInjections?.['noir-showcase']?.footer || '';
    expect(updatedFooter).toContain('Victoria Island, Lagos');
    expect(updatedFooter).toContain('class="cz-footer-wrap"');
    expect(updatedFooter).toContain('class="cz-copy"');

    const secEdit = applyMobileTextEdit(
      footerEdit.blueprint,
      {
        kind: 'custom_section',
        sectionId: 'sec-hours',
        part: 'item_detail',
        itemIndex: 0,
        label: 'Item Detail',
        value: '9:00 AM – 7:00 PM',
        multiline: true,
      },
      '10:00 AM – 8:00 PM'
    );
    expect(secEdit.blueprint.customSections?.[0].items?.[0].detail).toBe('10:00 AM – 8:00 PM');

    const frag = replaceTextInHtmlFragment(
      '<a href="https://instagram.com/leba" class="leba">Follow <strong>Leba</strong></a>',
      'Follow Leba',
      'Follow @lebabeauty'
    );
    expect(frag.replaced).toBe(true);
    expect(frag.html).toBe('<a href="https://instagram.com/leba" class="leba">Follow @lebabeauty</a>');
  });

  it('interns large base64 media blobs in HistoryManager via flyweight table and restores losslessly on undo/redo', () => {
    const history = new HistoryManager(20);
    const largeDataUrl = `data:image/webp;base64,${'A'.repeat(250_000)}`;
    const bp1 = createDefaultBlueprint({
      name: 'Flyweight Studio',
      templateId: 'noir-showcase',
      mediaVault: [
        {
          id: 'mv-big',
          url: largeDataUrl,
          thumbnailUrl: largeDataUrl,
          name: 'HD Cover',
          type: 'hero',
          source: 'upload',
          addedAt: '',
        },
      ],
    });

    const slim1 = history.serializeBlueprint(bp1);
    // Serialized history snapshot should be tiny (<5KB), not >500KB!
    expect(slim1.length).toBeLessThan(5000);
    expect(slim1).toContain('__cz_blob__:');

    history.push({
      id: 's1',
      timestamp: 1,
      description: 'Initial',
      source: 'initial',
      html: '',
      css: '',
      theme: 'bram-light',
      blueprintJson: slim1,
    });

    const bp2 = { ...bp1, customCopy: { headline: 'Updated Cinema Headline' } };
    history.push({
      id: 's2',
      timestamp: 2,
      description: 'Edited headline',
      source: 'manual_edit',
      html: '',
      css: '',
      theme: 'bram-light',
      blueprintJson: history.serializeBlueprint(bp2),
    });

    const undone = history.undo();
    expect(undone).not.toBeNull();
    const restoredBp1 = history.deserializeBlueprint(undone!.blueprintJson!);
    expect(restoredBp1.mediaVault[0].url).toBe(largeDataUrl);
    expect(restoredBp1.mediaVault[0].thumbnailUrl).toBe(largeDataUrl);

    const redone = history.redo();
    const restoredBp2 = history.deserializeBlueprint(redone!.blueprintJson!);
    expect(restoredBp2.customCopy?.headline).toBe('Updated Cinema Headline');
    expect(restoredBp2.mediaVault[0].url).toBe(largeDataUrl);
  });

  it('renders Noir Showcase with explicit obsidian background-color CSS and inline root fallback', () => {
    const bp = createDefaultBlueprint({ name: 'Obsidian Cuts', templateId: 'noir-showcase' });
    const rendered = renderTemplateEngine('noir-showcase', bp);
    expect(rendered.css).toContain('background-color:#09090B;');
    expect(rendered.css).toContain('background-color:var(--cz-noir-bg);');
    expect(rendered.html).toContain('data-cuzmify-template="noir-showcase"');
    expect(rendered.html).toContain('background-color:var(--cz-noir-bg, #09090B)');
  });
});
