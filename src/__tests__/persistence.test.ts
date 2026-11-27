import { describe, it, expect } from 'vitest';
import { createDefaultBlueprint, type MediaVaultAsset } from '@/core/blueprint-schema';
import { mergeOnboardingMediaVault } from '@/lib/onboarding-media-draft';
import { mergeInstagramMediaIntoVault } from '@/lib/media-vault-merge';
import { renderTemplateEngine } from '@/core/template-engines';
import { GrapesAdapter } from '@/studio/engine/GrapesAdapter';
import { EditorService } from '@/studio/engine/EditorService';
import {
  buildSlimSaveSitePayload,
  getStudioStorageKey,
  readStudioLocalSnapshot,
  reconcileLocalAndCloudBlueprints,
  writeStudioLocalSnapshot,
} from '@/studio/engine/blueprint-persistence';

describe('Persistence & Serialization Engine', () => {
  it('correctly serializes and parses blueprint with custom services and WhatsApp number', () => {
    const original = createDefaultBlueprint({
      name: 'Cyber Noir Studio',
      currency: 'EUR',
      whatsapp: '33612345678',
      category: 'Editorial Hair & Makeup',
    });

    const serialized = JSON.stringify(original);
    const parsed = JSON.parse(serialized);

    expect(parsed.profile.name).toBe('Cyber Noir Studio');
    expect(parsed.profile.currency).toBe('EUR');
    expect(parsed.modules.whatsapp.phoneNumber).toBe('33612345678');
  });

  it('safely serializes grapesData payload without stripping the blueprint', () => {
    const blueprint = createDefaultBlueprint('Royal Glam Atelier');
    const mockGrapesData = {
      pages: [{ id: 'page-1', component: { type: 'wrapper', components: [] } }],
      styles: [{ selectors: ['.brand-name'], style: { color: '#0D5771' } }],
      blueprint,
    };

    const serializedGrapes = JSON.stringify(mockGrapesData);
    const parsed = JSON.parse(serializedGrapes);

    expect(parsed.blueprint).toBeDefined();
    expect(parsed.blueprint.profile.name).toBe('Royal Glam Atelier');
    expect(parsed.pages.length).toBe(1);
  });

  it('merges onboarding uploaded photos ahead of cloud assets without duplicating IDs', () => {
    const draft: MediaVaultAsset[] = [
      { id: 'mv-up-1', url: 'data:image/webp;base64,abc', name: 'Uploaded 1', type: 'hero', source: 'upload', addedAt: '' },
      { id: 'mv-up-2', url: 'data:image/webp;base64,def', name: 'Uploaded 2', type: 'gallery', source: 'upload', addedAt: '' },
    ];
    const cloud: MediaVaultAsset[] = [
      { id: 'mv-up-2', url: 'data:image/webp;base64,def', name: 'Uploaded 2', type: 'gallery', source: 'upload', addedAt: '' },
      { id: 'mv-ig-3', url: 'https://example.com/3.jpg', name: 'IG Shot', type: 'hero', source: 'instagram', addedAt: '' },
    ];

    const merged = mergeOnboardingMediaVault(draft, cloud, 20);
    expect(merged.map((m) => m.id)).toEqual(['mv-up-1', 'mv-up-2', 'mv-ig-3']);
    expect(merged[0].type).toBe('hero');
    expect(merged[2].type).toBe('gallery');
  });

  it('reorders single-root wrapped template sections in real time in GrapesAdapter.getSectionsList()', () => {
    const makeNode = (tagName: string, id: string, cuzType?: string) => {
      const node: any = {
        cid: `cid-${id}`,
        get: (k: string) => {
          if (k === 'tagName') return tagName;
          if (k === 'type') return tagName;
          if (k === 'attributes') return { id, ...(cuzType ? { 'data-cuzmify-type': cuzType } : {}) };
          return undefined;
        },
        getEl: () => null,
        parent: () => rootContainer,
      };
      return node;
    };

    const nav = makeNode('nav', 'nav', 'navbar');
    const hero = makeNode('section', 'hero', 'hero');
    const footer = makeNode('footer', 'footer', 'footer');
    const rootModels = [nav, hero, footer];
    const rootContainer: any = {
      components: () => ({ models: rootModels }),
    };
    const fakeWrapper: any = {
      components: () => ({ models: [rootContainer] }),
    };
    let triggered = false;
    const fakeEditor: any = {
      getWrapper: () => fakeWrapper,
      trigger: () => {
        triggered = true;
      },
    };

    const adapter = new GrapesAdapter(fakeEditor);
    expect(adapter.getSectionsList().map((s) => s.name)).toEqual(['Navigation Bar', 'Hero Suite', 'Footer']);

    adapter.moveSectionUp(2);
    expect(triggered).toBe(true);
    expect(adapter.getSectionsList().map((s) => s.name)).toEqual(['Navigation Bar', 'Footer', 'Hero Suite']);
  });

  it('builds a slim 1x blueprint save payload without duplicating base64 media into htmlContent or grapesData', () => {
    const base64Photo = 'data:image/webp;base64,' + 'A'.repeat(25_000);
    const bp = createDefaultBlueprint({
      name: 'Brammy Care',
      templateId: 'editorial-atelier',
      nicheId: 'catering_cakes',
      mediaVault: [
        {
          id: 'mv-1',
          url: base64Photo,
          thumbnailUrl: base64Photo,
          name: 'Cake Tier',
          type: 'hero',
          source: 'upload',
          addedAt: new Date().toISOString(),
        },
      ],
    });
    bp.modules.services.items.push({
      id: 'srv-cake-1',
      name: '3-Tier Wedding Cake',
      description: 'Custom fondant & buttercream finish',
      price: 185000,
      priceMode: 'starting_at',
      locationType: 'on_location',
      enabled: true,
    });

    const { payload, serialized, canUseKeepalive } = buildSlimSaveSitePayload({
      projectId: 'proj_default',
      resolvedSiteId: 'site_real_123',
      blueprint: bp,
      businessName: 'Brammy Care',
      theme: 'bram-light',
    });

    expect(payload.siteId).toBe('site_real_123');
    expect(payload.grapesData).toBeNull();
    expect(payload.htmlContent).toBeUndefined();
    expect(canUseKeepalive).toBe(true);
    // Base64 photo appears only inside blueprintData (url + thumbnailUrl = 2 refs, never 6-8x across htmlContent & grapesData)
    const occurrences = serialized.split('A'.repeat(25_000)).length - 1;
    expect(occurrences).toBe(2);
  });

  it('recovers from localStorage QuotaExceededError without losing newly added services on reload', () => {
    const map = new Map<string, string>();
    map.set('cuzmify_project_guest_old', 'x'.repeat(200));

    // Simulate a tight 8KB mobile storage quota that rejects large base64 images
    const quotaLimitedStorage = {
      get length() {
        return map.size;
      },
      key(index: number) {
        return Array.from(map.keys())[index] ?? null;
      },
      getItem(k: string) {
        return map.get(k) ?? null;
      },
      setItem(k: string, v: string) {
        if (v.length > 8_000) {
          const err = new Error('QuotaExceededError');
          err.name = 'QuotaExceededError';
          throw err;
        }
        map.set(k, v);
      },
      removeItem(k: string) {
        map.delete(k);
      },
    };

    const bigPhoto = 'data:image/webp;base64,' + 'B'.repeat(12_000);
    const bp = createDefaultBlueprint({
      name: 'Brammy Care',
      mediaVault: [
        { id: 'mv-big', url: bigPhoto, name: 'Big Upload', type: 'hero', source: 'upload', addedAt: '2026-11-26T10:00:00.000Z' },
      ],
    });
    bp.modules.services.items.push({
      id: 'srv-new-1',
      name: 'Executive Buffet Catering',
      description: 'Full event setup for 100 guests',
      price: 450000,
      priceMode: 'fixed',
      locationType: 'on_location',
      imageUrl: bigPhoto,
      enabled: true,
    });
    bp.updatedAt = '2026-11-26T12:05:00.000Z';

    const writeRes = writeStudioLocalSnapshot(quotaLimitedStorage, {
      projectId: 'proj_default',
      userId: 'user_1',
      siteId: 'site_1',
      blueprint: bp,
    });

    expect(writeRes.saved).toBe(true);
    expect(writeRes.mediaStrippedForQuota).toBe(true);
    expect(map.has('cuzmify_project_guest_old')).toBe(false);

    const readBack = readStudioLocalSnapshot(quotaLimitedStorage, 'proj_default', 'user_1');
    expect(readBack).not.toBeNull();
    expect(readBack!.blueprint.modules.services.items).toHaveLength(1);
    expect(readBack!.blueprint.modules.services.items[0].name).toBe('Executive Buffet Catering');
    // Concrete siteId mirror key is also written for /studio?projectId=site_1
    expect(map.has(getStudioStorageKey('site_1', 'user_1'))).toBe(true);

    // Reconciling with an older cloud snapshot (before the service POST finished) preserves the added service AND restores cloud photos!
    const olderCloudBp = createDefaultBlueprint({
      name: 'Brammy Care',
      mediaVault: [
        { id: 'mv-big', url: bigPhoto, name: 'Big Upload', type: 'hero', source: 'upload', addedAt: '2026-11-26T10:00:00.000Z' },
      ],
    });
    olderCloudBp.updatedAt = '2026-11-26T12:00:00.000Z';

    const reconciled = reconcileLocalAndCloudBlueprints({
      localSnapshot: readBack,
      cloudBlueprint: olderCloudBp,
      cloudSiteId: 'site_1',
    });

    expect(reconciled.winner).toBe('local');
    expect(reconciled.needsCloudResync).toBe(true);
    expect(reconciled.blueprint?.modules.services.items.map((s) => s.name)).toEqual(['Executive Buffet Catering']);
    expect(reconciled.blueprint?.mediaVault).toHaveLength(1);
    expect(reconciled.blueprint?.mediaVault[0].url).toBe(bigPhoto);
  });

  it('prefers newer cloud blueprint when an external MCP agent updated the site more recently than localStorage', () => {
    const localBp = createDefaultBlueprint({ name: 'Brammy Care' });
    localBp.updatedAt = '2026-11-26T12:00:00.000Z';

    const newerCloudBp = createDefaultBlueprint({ name: 'Brammy Care' });
    newerCloudBp.modules.services.items.push({
      id: 'srv-mcp-1',
      name: 'MCP Added Package',
      description: 'Added via external agent',
      price: 75000,
      priceMode: 'fixed',
      locationType: 'in_studio',
      enabled: true,
    });
    newerCloudBp.updatedAt = '2026-11-26T12:10:00.000Z';

    const reconciled = reconcileLocalAndCloudBlueprints({
      localSnapshot: {
        version: 2,
        siteId: 'site_1',
        blueprint: localBp,
        savedAt: '2026-11-26T12:00:00.000Z',
      },
      cloudBlueprint: newerCloudBp,
      cloudSiteId: 'site_1',
    });

    expect(reconciled.winner).toBe('cloud');
    expect(reconciled.needsCloudResync).toBe(false);
    expect(reconciled.blueprint?.modules.services.items.map((s) => s.name)).toEqual(['MCP Added Package']);
  });

  it('does not trigger redundant cloud resync on reload when savedAt cache timestamp is newer than equal updatedAt', () => {
    const bp = createDefaultBlueprint({ name: 'Brammy Care' });
    bp.updatedAt = '2026-11-26T12:00:00.000Z';

    const reconciled = reconcileLocalAndCloudBlueprints({
      localSnapshot: {
        version: 2,
        siteId: 'site_1',
        blueprint: bp,
        savedAt: '2026-11-26T12:30:00.000Z',
      },
      cloudBlueprint: { ...bp },
      cloudSiteId: 'site_1',
    });

    expect(reconciled.winner).toBe('cloud');
    expect(reconciled.needsCloudResync).toBe(false);
  });

  it('renders enquiry form controls at 16px font-size to prevent mobile browser focus auto-zoom', () => {
    const bp = createDefaultBlueprint({ name: 'Brammy Care', templateId: 'editorial-atelier', nicheId: 'catering_cakes' });
    const rendered = renderTemplateEngine('editorial-atelier', bp);
    expect(rendered.fullHtml).toContain('name="clientName"');
    expect(rendered.fullHtml).not.toMatch(/<(?:input|select|textarea)[^>]*font-size:\s*1[0-5]px/i);
  });

  it('runs EditorService in headless mobile mode without GrapesJS and supports instant service mutations + undo/redo', () => {
    const mobileService = new EditorService(null, 'Brammy Care');
    expect(mobileService.getServices()).toHaveLength(0);

    const added = mobileService.addServiceItem({
      name: 'Express Bridal Trial',
      description: 'In-studio consultation & trial glam',
      price: 55000,
      priceMode: 'fixed',
      locationType: 'in_studio',
      enabled: true,
    });

    expect(added.id).toMatch(/^srv-/);
    expect(mobileService.getServices()).toHaveLength(1);
    expect(mobileService.getServices()[0].name).toBe('Express Bridal Trial');

    mobileService.updateServiceItem(added.id, { price: 65000 });
    expect(mobileService.getServices()[0].price).toBe(65000);
    expect(mobileService.canUndo()).toBe(true);

    expect(mobileService.undo()).toBe(true);
    expect(mobileService.getServices()[0].price).toBe(55000);
    expect(mobileService.redo()).toBe(true);
    expect(mobileService.getServices()[0].price).toBe(65000);

    // Renders valid template HTML on demand without a GrapesJS iframe
    expect(mobileService.getHtml()).toContain('Express Bridal Trial');
    mobileService.destroy();
  });

  it('preserves all manually uploaded photos when running Instagram sync later', () => {
    const manualUploads: MediaVaultAsset[] = [
      { id: 'mv-up-1', url: 'data:image/webp;base64,upload1', name: 'Bridal Look Hero', type: 'hero', source: 'upload', addedAt: '2026-11-26T10:00:00.000Z' },
      { id: 'mv-up-2', url: 'data:image/webp;base64,upload2', name: 'Makeup Kit', type: 'gallery', source: 'upload', addedAt: '2026-11-26T10:01:00.000Z' },
    ];
    const igAssets: MediaVaultAsset[] = [
      { id: 'ig-1', igMediaId: '101', url: '/api/media/ig?mediaId=101', name: 'IG Shot 1', type: 'hero', source: 'instagram', addedAt: '2026-11-27T11:00:00.000Z' },
      { id: 'ig-2', igMediaId: '102', url: '/api/media/ig?mediaId=102', name: 'IG Shot 2', type: 'gallery', source: 'instagram', addedAt: '2026-11-27T11:01:00.000Z' },
    ];

    const merged = mergeInstagramMediaIntoVault(manualUploads, igAssets, 30);
    expect(merged.map((m) => m.id)).toEqual(['mv-up-1', 'mv-up-2', 'ig-1', 'ig-2']);
    // Preserved custom hero stays hero while incoming IG item demotes cleanly to gallery
    expect(merged[0].type).toBe('hero');
    expect(merged[2].type).toBe('gallery');

    // Re-syncing Instagram refreshes old IG items without losing any manual uploads
    const olderVault: MediaVaultAsset[] = [
      ...manualUploads,
      { id: 'ig-old', igMediaId: '99', url: '/api/media/ig?mediaId=99', name: 'Old IG', type: 'gallery', source: 'instagram', addedAt: '2026-11-25T10:00:00.000Z' },
    ];
    const reSynced = mergeInstagramMediaIntoVault(olderVault, igAssets, 30);
    expect(reSynced.map((m) => m.id)).toEqual(['mv-up-1', 'mv-up-2', 'ig-1', 'ig-2']);
  });
});
