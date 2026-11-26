import { describe, it, expect } from 'vitest';
import { createDefaultBlueprint, type MediaVaultAsset } from '@/core/blueprint-schema';
import { mergeOnboardingMediaVault } from '@/lib/onboarding-media-draft';
import { GrapesAdapter } from '@/studio/engine/GrapesAdapter';

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
});
