import {
  BusinessBlueprint,
  BusinessProfile,
  WhatsAppModuleConfig,
  ServiceItem,
  ProductItem,
  MediaVaultAsset,
  ActionBinding,
  CuzmifyActionType,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
  createDefaultBlueprint,
} from '@/core/blueprint-schema';

export type BlueprintChangeListener = (blueprint: BusinessBlueprint) => void;

export class BlueprintManager {
  private blueprint: BusinessBlueprint;
  private listeners: BlueprintChangeListener[] = [];

  constructor(initialName?: string, initialData?: Partial<BusinessBlueprint> | string) {
    const fallbackName = initialName && initialName !== 'Gmakeup Studio' ? initialName : 'My Business Studio';
    this.blueprint = createDefaultBlueprint(fallbackName);
    if (initialData) {
      this.hydrate(initialData);
    }
  }

  public getBlueprint(): BusinessBlueprint {
    return this.blueprint;
  }

  public getProfile(): BusinessProfile {
    return this.blueprint.profile;
  }

  public getServices(): ServiceItem[] {
    return this.blueprint.modules.services.items;
  }

  public getProducts(): ProductItem[] {
    return this.blueprint.modules.products.items;
  }

  public getWhatsAppConfig(): WhatsAppModuleConfig {
    return this.blueprint.modules.whatsapp;
  }

  public getMediaVault(): MediaVaultAsset[] {
    return this.blueprint.mediaVault;
  }

  public formatCurrency(amount: number, currencyCode?: CurrencyCode): string {
    const cur = currencyCode || this.blueprint.profile.currency || 'USD';
    const info = SUPPORTED_CURRENCIES[cur] || SUPPORTED_CURRENCIES.USD;
    return `${info.symbol}${amount.toLocaleString('en-US')}`;
  }

  // ── Profile Updates ───────────────────────────────────────────────────────
  public updateProfile(updates: Partial<BusinessProfile>): void {
    this.blueprint.profile = {
      ...this.blueprint.profile,
      ...updates,
    };
    if (updates.currency) {
      this.blueprint.modules.services.currency = updates.currency;
      this.blueprint.modules.products.currency = updates.currency;
      this.blueprint.modules.cart.currency = updates.currency;
    }
    this.touch();
  }

  // ── WhatsApp Config Updates ───────────────────────────────────────────────
  public updateWhatsAppConfig(updates: Partial<WhatsAppModuleConfig>): void {
    this.blueprint.modules.whatsapp = {
      ...this.blueprint.modules.whatsapp,
      ...updates,
    };
    this.touch();
  }

  // ── Service Catalog Mutations ─────────────────────────────────────────────
  public addServiceItem(item: Omit<ServiceItem, 'id'>): ServiceItem {
    const newItem: ServiceItem = {
      ...item,
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.blueprint.modules.services.items.push(newItem);
    this.touch();
    return newItem;
  }

  public updateServiceItem(id: string, updates: Partial<ServiceItem>): void {
    this.blueprint.modules.services.items = this.blueprint.modules.services.items.map((srv) =>
      srv.id === id ? { ...srv, ...updates } : srv
    );
    this.touch();
  }

  public deleteServiceItem(id: string): void {
    this.blueprint.modules.services.items = this.blueprint.modules.services.items.filter((srv) => srv.id !== id);
    this.touch();
  }

  public setServices(items: ServiceItem[]): void {
    this.blueprint.modules.services.items = items;
    this.touch();
  }

  // ── Product Catalog Mutations ─────────────────────────────────────────────
  public addProductItem(item: Omit<ProductItem, 'id'>): ProductItem {
    const newItem: ProductItem = {
      ...item,
      id: `prd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.blueprint.modules.products.items.push(newItem);
    this.touch();
    return newItem;
  }

  public updateProductItem(id: string, updates: Partial<ProductItem>): void {
    this.blueprint.modules.products.items = this.blueprint.modules.products.items.map((prd) =>
      prd.id === id ? { ...prd, ...updates } : prd
    );
    this.touch();
  }

  public deleteProductItem(id: string): void {
    this.blueprint.modules.products.items = this.blueprint.modules.products.items.filter((prd) => prd.id !== id);
    this.touch();
  }

  // ── Media Vault Mutations ─────────────────────────────────────────────────
  public addMediaAsset(asset: Omit<MediaVaultAsset, 'id' | 'addedAt'>): MediaVaultAsset {
    const newAsset: MediaVaultAsset = {
      ...asset,
      id: `mv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    this.blueprint.mediaVault.unshift(newAsset);
    this.touch();
    return newAsset;
  }

  public deleteMediaAsset(id: string): void {
    this.blueprint.mediaVault = this.blueprint.mediaVault.filter((m) => m.id !== id);
    this.touch();
  }

  public updateMediaAsset(id: string, updates: Partial<MediaVaultAsset>): void {
    this.blueprint.mediaVault = this.blueprint.mediaVault.map((m) =>
      m.id === id ? { ...m, ...updates } : m
    );
    this.touch();
  }

  // ── Dynamic WhatsApp Formula Resolver ─────────────────────────────────────
  public generateWhatsAppLink(options: {
    type: 'booking' | 'order' | 'general';
    targetId?: string;
    customMessage?: string;
  }): string {
    const wa = this.blueprint.modules.whatsapp;
    const phone = (wa.phoneNumber || this.blueprint.profile.whatsapp || '18005554526').replace(/\D/g, '');
    const businessName = this.blueprint.profile.name || 'Studio';

    let rawMessage = options.customMessage || '';

    if (!rawMessage) {
      if (options.type === 'booking') {
        const srv = this.blueprint.modules.services.items.find((s) => s.id === options.targetId);
        const serviceName = srv?.name || 'Artistry Session';
        const price = srv ? this.formatCurrency(srv.price) : '';

        rawMessage = wa.defaultBookingTemplate
          .replace(/{businessName}/g, businessName)
          .replace(/{serviceName}/g, serviceName)
          .replace(/{price}/g, price);
      } else if (options.type === 'order') {
        const prd = this.blueprint.modules.products.items.find((p) => p.id === options.targetId);
        const productName = prd?.name || 'Selected Item';
        const price = prd ? this.formatCurrency(prd.price) : '';

        rawMessage = wa.defaultProductOrderTemplate
          .replace(/{businessName}/g, businessName)
          .replace(/{productName}/g, productName)
          .replace(/{price}/g, price);
      } else {
        rawMessage = wa.generalInquiryTemplate.replace(/{businessName}/g, businessName);
      }
    }

    return `https://wa.me/${phone}?text=${encodeURIComponent(rawMessage)}`;
  }

  // ── Action Binding Resolver (data-cuzmify-action) ──────────────────────────
  public resolveActionBinding(binding: ActionBinding): { url: string; previewLabel: string } {
    switch (binding.action) {
      case 'whatsapp:booking': {
        const srv = this.blueprint.modules.services.items.find((s) => s.id === binding.targetId);
        const url = this.generateWhatsAppLink({
          type: 'booking',
          targetId: binding.targetId,
          customMessage: binding.customMessage,
        });
        return {
          url,
          previewLabel: srv ? `WhatsApp Booking: ${srv.name}` : 'WhatsApp Booking Consultation',
        };
      }

      case 'whatsapp:order': {
        const prd = this.blueprint.modules.products.items.find((p) => p.id === binding.targetId);
        const url = this.generateWhatsAppLink({
          type: 'order',
          targetId: binding.targetId,
          customMessage: binding.customMessage,
        });
        return {
          url,
          previewLabel: prd ? `WhatsApp Order: ${prd.name}` : 'WhatsApp Quick Order',
        };
      }

      case 'whatsapp:general': {
        const url = this.generateWhatsAppLink({ type: 'general', customMessage: binding.customMessage });
        return { url, previewLabel: 'WhatsApp General Chat' };
      }

      case 'cart:add': {
        return {
          url: '#cuzmify-cart-add',
          previewLabel: 'Add to Cart & Open Drawer',
        };
      }

      case 'cart:toggle': {
        return {
          url: '#cuzmify-cart-toggle',
          previewLabel: 'Toggle Shopping Cart Drawer',
        };
      }

      case 'payment:checkout': {
        return {
          url: '#cuzmify-payment-checkout',
          previewLabel: 'Instant Online Checkout (Paystack/Stripe)',
        };
      }

      case 'booking:calendar': {
        return {
          url: '#cuzmify-booking-calendar',
          previewLabel: 'Interactive Booking Calendar',
        };
      }

      case 'custom:url':
      default: {
        return {
          url: binding.url || '#booking',
          previewLabel: binding.url || '#booking',
        };
      }
    }
  }

  // ── Subscription & Lifecycle ──────────────────────────────────────────────
  public onChange(listener: BlueprintChangeListener): () => void {
    this.listeners.push(listener);
    listener(this.blueprint);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private touch(): void {
    this.blueprint.updatedAt = new Date().toISOString();
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn(this.blueprint);
      } catch (err) {
        console.error('[BlueprintManager] listener error:', err);
      }
    });
  }

  public serialize(): string {
    return JSON.stringify(this.blueprint);
  }

  public hydrate(data: Partial<BusinessBlueprint> | string): void {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (parsed && (parsed.profile || parsed.modules)) {
        this.blueprint = {
          ...this.blueprint,
          ...parsed,
          profile: { ...this.blueprint.profile, ...(parsed.profile || {}) },
          modules: { ...this.blueprint.modules, ...(parsed.modules || {}) },
          mediaVault: Array.isArray(parsed.mediaVault) ? parsed.mediaVault : this.blueprint.mediaVault,
        };
        this.notify();
      }
    } catch (err) {
      console.warn('[BlueprintManager] Could not hydrate data:', err);
    }
  }
}
