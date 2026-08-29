import { describe, it, expect, beforeEach } from 'vitest';
import { BlueprintManager } from '@/studio/engine/BlueprintManager';
import { createDefaultBlueprint } from '@/core/blueprint-schema';

describe('BlueprintManager & Business Blueprint Engine', () => {
  let manager: BlueprintManager;

  beforeEach(() => {
    manager = new BlueprintManager('Luxe Beauty Bar');
  });

  it('initializes with the given business name and does not use hardcoded defaults', () => {
    const profile = manager.getProfile();
    expect(profile.name).toBe('Luxe Beauty Bar');
    expect(profile.name).not.toBe('Gmakeup Studio');
    expect(profile.name).not.toBe('Glory Beauty Studio');
  });

  it('updates business profile name, currency, and tagline cleanly', () => {
    manager.updateProfile({
      name: 'Obsidian Aesthetics',
      currency: 'EUR',
      tagline: 'High-Fashion & Runway Glamour',
    });

    const profile = manager.getProfile();
    expect(profile.name).toBe('Obsidian Aesthetics');
    expect(profile.currency).toBe('EUR');
    expect(profile.tagline).toBe('High-Fashion & Runway Glamour');
  });

  it('adds, updates, and deletes services in the catalog', () => {
    const newService = manager.addServiceItem({
      name: 'Bridal Trial Session',
      price: 250,
      durationMinutes: 90,
      locationType: 'in_studio',
      description: 'Full consultation and lash testing',
      category: 'Bridal',
      enabled: true,
    });

    expect(newService.id).toBeDefined();
    expect(newService.name).toBe('Bridal Trial Session');

    // Update service
    manager.updateServiceItem(newService.id, { price: 299 });
    const updated = manager.getServices().find((s) => s.id === newService.id);
    expect(updated?.price).toBe(299);

    // Delete service
    manager.deleteServiceItem(newService.id);
    const deleted = manager.getServices().find((s) => s.id === newService.id);
    expect(deleted).toBeUndefined();
  });

  it('formats currency correctly according to selected currency code', () => {
    manager.updateProfile({ currency: 'USD' });
    expect(manager.formatCurrency(350)).toBe('$350');

    manager.updateProfile({ currency: 'NGN' });
    expect(manager.formatCurrency(150000)).toBe('₦150,000');

    manager.updateProfile({ currency: 'GBP' });
    expect(manager.formatCurrency(220)).toBe('£220');

    manager.updateProfile({ currency: 'EUR' });
    expect(manager.formatCurrency(180)).toBe('€180');
  });

  it('generates valid WhatsApp booking URLs with prefilled messages', () => {
    manager.updateWhatsAppConfig({ phoneNumber: '18005551234' });
    const bookingUrl = manager.generateWhatsAppLink({ type: 'booking', targetId: 'srv-bridal-suite' });

    expect(bookingUrl).toContain('https://wa.me/18005551234');
    expect(bookingUrl).toContain('text=');
  });

  it('notifies subscribers on any blueprint mutation', () => {
    let notifiedName = '';
    const unsubscribe = manager.onChange((bp) => {
      notifiedName = bp.profile.name;
    });

    manager.updateProfile({ name: 'Neon Cyber Studio' });
    expect(notifiedName).toBe('Neon Cyber Studio');

    unsubscribe();
  });

  it('hydrates from serialized blueprint data without losing state', () => {
    const rawBlueprint = createDefaultBlueprint('Hydrated Salon');
    manager.hydrate(rawBlueprint);

    expect(manager.getProfile().name).toBe('Hydrated Salon');
    expect(manager.getServices().length).toBeGreaterThan(0);
  });

  it('hydrates and updates MediaVault assets with setMediaVault', () => {
    const testAssets = [
      {
        id: 'ig-test-1',
        url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e',
        name: 'Bridal Post',
        type: 'hero' as const,
        source: 'instagram' as const,
        addedAt: new Date().toISOString(),
      },
    ];

    manager.setMediaVault(testAssets);
    const vault = manager.getMediaVault();
    expect(vault.length).toBe(1);
    expect(vault[0].source).toBe('instagram');
    expect(vault[0].name).toBe('Bridal Post');
  });

  it('initializes pro automation modules (instagramSync, dmBookingBot, appointmentReminders)', () => {
    const bp = createDefaultBlueprint({ name: 'Auto Studio', instagramHandle: 'autobram' });
    expect(bp.modules.instagramSync).toBeDefined();
    expect(bp.modules.instagramSync?.enabled).toBe(true);
    expect(bp.modules.dmBookingBot).toBeDefined();
    expect(bp.modules.appointmentReminders).toBeDefined();
  });
});
