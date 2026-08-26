import { describe, it, expect } from 'vitest';
import { createDefaultBlueprint } from '@/core/blueprint-schema';

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
});
