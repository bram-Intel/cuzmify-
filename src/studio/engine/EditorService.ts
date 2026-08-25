import type { Editor } from 'grapesjs';
import { GrapesAdapter } from './GrapesAdapter';
import { ThemeEngine } from '../theme/ThemeEngine';
import { ComponentRegistry } from './ComponentRegistry';
import { BlockRegistry } from './BlockRegistry';
import { HistoryManager, type HistorySnapshot } from './HistoryManager';
import { BlueprintManager } from './BlueprintManager';
import { SUPPORTED_CURRENCIES, type BusinessBlueprint, type ServiceItem, type ProductItem, type BusinessProfile, type WhatsAppModuleConfig, type ActionBinding, type MediaVaultAsset } from '@/core/blueprint-schema';
import type { ThemeName } from '@/core/project-schema';
import type { CuzmifyComponentTraits } from '@/core/types';

export class EditorService {
  private adapter: GrapesAdapter;
  private themeEngine: ThemeEngine;
  private historyManager: HistoryManager;
  private blueprintManager: BlueprintManager;
  private changeListeners: Array<() => void> = [];
  private selectionListeners: Array<(type: string | null) => void> = [];
  private historyListeners: Array<(state: { canUndo: boolean; canRedo: boolean; description?: string }) => void> = [];
  private blueprintListeners: Array<(blueprint: BusinessBlueprint) => void> = [];
  private isMoving = false;
  private snapshotDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentTheme: ThemeName = 'bram-light';

  constructor(grapesEditor: Editor, initialBusinessName?: string) {
    this.adapter = new GrapesAdapter(grapesEditor);
    this.themeEngine = new ThemeEngine(this.adapter);
    this.historyManager = new HistoryManager(50);
    this.blueprintManager = new BlueprintManager(initialBusinessName);

    ComponentRegistry.register(grapesEditor);
    BlockRegistry.register(grapesEditor);

    // Forward blueprint updates & dynamically synchronize canvas DOM
    this.blueprintManager.onChange((bp) => {
      this.syncCanvasWithBlueprint(bp);
      this.blueprintListeners.forEach((fn) => fn(bp));
      this.notifyChange();
    });

    // Forward history changes to reactive subscribers
    this.historyManager.onChange((state) => {
      this.historyListeners.forEach((fn) => fn(state));
    });

    // Listen to canvas mutations and record debounced snapshot
    this.adapter.on('change:changesCount', () => {
      this.handleDebouncedChange('Canvas edit', 'manual_edit');
    });

    this.adapter.on('cuzmify:change', () => {
      this.handleDebouncedChange('Canvas content update', 'manual_edit');
    });

    this.adapter.on('component:add', () => {
      this.handleDebouncedChange('Added component', 'block_insert');
    });

    this.adapter.on('component:remove', () => {
      this.handleDebouncedChange('Removed component', 'manual_edit');
    });

    this.adapter.on('component:selected', (comp: unknown) => {
      const model = comp as any;
      if (!model) {
        this.selectionListeners.forEach((fn) => fn(null));
        return;
      }
      const rawType = model.get?.('type');
      const tagName = (model.get?.('tagName') || model.attributes?.tagName || 'div').toLowerCase();
      // Ensure custom cuzmify blocks preserve their block name, else resolve to tagName (div, section, a, p, button, img)
      const resolvedType = rawType && rawType !== 'default' && rawType !== 'wrapper' ? rawType : tagName;
      this.selectionListeners.forEach((fn) => fn(resolvedType));
    });

    this.adapter.on('component:deselected', () => {
      this.selectionListeners.forEach((fn) => fn(null));
      this.syncBlueprintFromCanvas();
    });

    this.adapter.on('rte:enable', () => {
      this.isRteActive = true;
    });

    this.adapter.on('rte:disable', () => {
      this.isRteActive = false;
      this.syncBlueprintFromCanvas();
      this.notifyChange();
      this.recordSnapshot('Inline text edit', 'manual_edit');
    });
  }

  private isRestoringState = false;
  private isSyncingFromCanvas = false;
  private isRteActive = false;

  // ── Canvas ➔ Blueprint Upstream Sync (Bidirectional Engine) ───────────────
  public syncBlueprintFromCanvas(): void {
    if (this.isRestoringState || this.isSyncingFromCanvas || this.isRteActive) return;

    try {
      const doc = this.adapter.getDoc();
      if (!doc) return;

      const bp = this.blueprintManager.getBlueprint();
      let profileUpdated = false;
      const profileUpdates: Partial<BusinessProfile> = {};

      // 1. Check Primary Brand Name Anchor
      const brandEl = doc.querySelector(
        '[data-cuzmify-field="business-name"], .brand-name, .cuzmify-brand-name, nav[data-cuzmify-type="navbar"] span:first-of-type, nav[data-brand] span:first-of-type'
      );
      if (brandEl) {
        const rawBrand = (brandEl.textContent || '').trim();
        if (rawBrand && rawBrand !== bp.profile.name) {
          profileUpdates.name = rawBrand;
          profileUpdated = true;

          // Keep announcement bar synced in real-time
          const announcementSpans = doc.querySelectorAll('div span');
          announcementSpans.forEach((el) => {
            if (el.textContent && el.textContent.includes('✦') && el.textContent.toLowerCase().includes('luxury artistry')) {
              el.textContent = `✦ ${rawBrand} Luxury Artistry`;
            }
          });
        }
      }

      // 2. Check Service Prices edited directly on canvas cards
      const services = [...bp.modules.services.items];
      const currency = bp.profile.currency || 'USD';
      const currencySymbol = SUPPORTED_CURRENCIES[currency]?.symbol || '$';
      const currencyRegex = /^(\$|€|£|₦|CA\$|A\$|AED|KSh|R)\s*(\d+(?:,\d+)?(?:\.\d+)?)/i;

      const serviceCards = doc.querySelectorAll('[data-cuzmify-target-id^="srv-"], .services-grid > div, [data-cuzmify-type="services"] div[style*="border-radius"]');
      let serviceUpdated = false;

      serviceCards.forEach((card) => {
        const targetId = card.getAttribute('data-cuzmify-target-id');
        const priceEl = card.querySelector('[data-cuzmify-field="service-price"], .service-price, span[style*="font-weight:900"]');
        const titleEl = card.querySelector('[data-cuzmify-field="service-name"], .service-title, h3');

        if (priceEl && targetId) {
          const match = (priceEl.textContent || '').trim().match(currencyRegex);
          if (match) {
            const newPrice = parseFloat(match[2].replace(/,/g, ''));
            const srv = services.find((s) => s.id === targetId);
            if (srv && !isNaN(newPrice) && srv.price !== newPrice) {
              srv.price = newPrice;
              serviceUpdated = true;
            }
          }
        }

        if (titleEl && targetId) {
          const newTitle = (titleEl.textContent || '').trim();
          const srv = services.find((s) => s.id === targetId);
          if (srv && newTitle && srv.name !== newTitle) {
            srv.name = newTitle;
            serviceUpdated = true;
          }
        }
      });

      if (profileUpdated || serviceUpdated) {
        this.isSyncingFromCanvas = true;
        if (profileUpdated) {
          this.blueprintManager.updateProfile(profileUpdates);
        }
        if (serviceUpdated) {
          this.blueprintManager.setServices(services);
        }

        // Update booking select dropdowns to reflect new service prices/name
        const selects = doc.querySelectorAll('select');
        selects.forEach((sel) => {
          const optionsList = Array.from(sel.options);
          const isServiceSelect =
            sel.getAttribute('data-cuzmify-type') === 'service-select' ||
            optionsList.some(
              (opt) =>
                opt.text.includes('(') ||
                opt.text.includes('$') ||
                opt.text.includes('₦') ||
                opt.text.includes('€') ||
                opt.text.includes('£') ||
                opt.text.toLowerCase().includes('glam') ||
                opt.text.toLowerCase().includes('bridal')
            );
          if (isServiceSelect && services.length > 0) {
            sel.innerHTML = services
              .map((srv) => `<option value="${srv.id}">${srv.name} (${currencySymbol}${srv.price})</option>`)
              .join('');
          }
        });

        // Update WhatsApp action links with new brand name and prices
        const waLinks = doc.querySelectorAll('a');
        waLinks.forEach((a) => {
          const action = a.getAttribute('data-cuzmify-action');
          const targetId = a.getAttribute('data-cuzmify-target-id');
          const href = a.getAttribute('href') || '';
          if (action === 'whatsapp:booking' || (!action && href.includes('wa.me'))) {
            const newUrl = this.blueprintManager.generateWhatsAppLink({ type: 'booking', targetId: targetId || undefined });
            a.setAttribute('href', newUrl);
          }
        });

        this.isSyncingFromCanvas = false;
      }
    } catch (err) {
      this.isSyncingFromCanvas = false;
      console.warn('[EditorService] Error in syncBlueprintFromCanvas:', err);
    }
  }

  // ── Snapshot Capture Engine ───────────────────────────────────────────────
  public recordSnapshot(description: string, source: HistorySnapshot['source'], themeOverride?: ThemeName): void {
    if (this.isRestoringState || this.historyManager.isPerformingRestore) return;

    try {
      const html = this.adapter.getHtml();
      const css = this.adapter.getCss();
      const theme = themeOverride || this.currentTheme;
      const grapesData = this.adapter.getProjectData();

      this.historyManager.push({
        id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        description,
        source,
        html,
        css,
        theme,
        grapesData,
      });
    } catch (err) {
      console.warn('[EditorService] Could not capture snapshot:', err);
    }
  }

  private handleDebouncedChange(description: string, source: HistorySnapshot['source']): void {
    if (this.isRestoringState || this.historyManager.isPerformingRestore) return;

    // While user is actively typing in RTE, do not trigger DOM modifications or React re-renders mid-stroke
    if (this.isRteActive) {
      if (this.snapshotDebounceTimer) clearTimeout(this.snapshotDebounceTimer);
      this.snapshotDebounceTimer = setTimeout(() => {
        if (!this.isRteActive) {
          this.syncBlueprintFromCanvas();
          this.notifyChange();
          this.recordSnapshot(description, source);
        }
      }, 800);
      return;
    }

    this.notifyChange();
    this.syncBlueprintFromCanvas();

    if (this.snapshotDebounceTimer) clearTimeout(this.snapshotDebounceTimer);
    this.snapshotDebounceTimer = setTimeout(() => {
      if (this.isRestoringState || this.historyManager.isPerformingRestore || this.isRteActive) return;
      this.recordSnapshot(description, source);
    }, 500);
  }

  // ── Universal Undo / Redo ─────────────────────────────────────────────────
  public undo(): boolean {
    if (this.snapshotDebounceTimer) {
      clearTimeout(this.snapshotDebounceTimer);
      this.snapshotDebounceTimer = null;
    }

    this.isRestoringState = true;
    const previous = this.historyManager.undo();
    if (!previous) {
      this.adapter.undo();
      this.notifyChange();
      setTimeout(() => {
        this.isRestoringState = false;
      }, 600);
      return this.historyManager.canUndo();
    }

    try {
      this.adapter.setHtmlContent(previous.html);
      if (previous.theme) {
        this.currentTheme = previous.theme;
        this.themeEngine.applyTheme(previous.theme);
      }
      this.adapter.sanitizeCanvas();
      this.notifyChange();
      return true;
    } catch (err) {
      console.error('[EditorService] Undo restore error:', err);
      return false;
    } finally {
      setTimeout(() => {
        this.isRestoringState = false;
      }, 600);
    }
  }

  public redo(): boolean {
    if (this.snapshotDebounceTimer) {
      clearTimeout(this.snapshotDebounceTimer);
      this.snapshotDebounceTimer = null;
    }

    this.isRestoringState = true;
    const next = this.historyManager.redo();
    if (!next) {
      this.adapter.redo();
      this.notifyChange();
      setTimeout(() => {
        this.isRestoringState = false;
      }, 600);
      return this.historyManager.canRedo();
    }

    try {
      this.adapter.setHtmlContent(next.html);
      if (next.theme) {
        this.currentTheme = next.theme;
        this.themeEngine.applyTheme(next.theme);
      }
      this.adapter.sanitizeCanvas();
      this.notifyChange();
      return true;
    } catch (err) {
      console.error('[EditorService] Redo restore error:', err);
      return false;
    } finally {
      setTimeout(() => {
        this.isRestoringState = false;
      }, 600);
    }
  }

  public canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  public canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  public onHistoryChange(listener: (state: { canUndo: boolean; canRedo: boolean; description?: string }) => void): () => void {
    this.historyListeners.push(listener);
    listener({ canUndo: this.canUndo(), canRedo: this.canRedo() });
    return () => {
      this.historyListeners = this.historyListeners.filter((l) => l !== listener);
    };
  }

  // ── Blueprint APIs ────────────────────────────────────────────────────────
  getBlueprint(): BusinessBlueprint {
    return this.blueprintManager.getBlueprint();
  }

  getProfile(): BusinessProfile {
    return this.blueprintManager.getProfile();
  }

  getServices(): ServiceItem[] {
    return this.blueprintManager.getServices();
  }

  getProducts(): ProductItem[] {
    return this.blueprintManager.getProducts();
  }

  getWhatsAppConfig(): WhatsAppModuleConfig {
    return this.blueprintManager.getWhatsAppConfig();
  }

  updateProfile(updates: Partial<BusinessProfile>): void {
    this.blueprintManager.updateProfile(updates);
    this.recordSnapshot('Updated Business Profile', 'manual_edit');
  }

  updateWhatsAppConfig(updates: Partial<WhatsAppModuleConfig>): void {
    this.blueprintManager.updateWhatsAppConfig(updates);
    this.recordSnapshot('Updated WhatsApp Engine', 'manual_edit');
  }

  addServiceItem(item: Omit<ServiceItem, 'id'>): ServiceItem {
    const res = this.blueprintManager.addServiceItem(item);
    this.recordSnapshot(`Added Service: ${item.name}`, 'manual_edit');
    return res;
  }

  updateServiceItem(id: string, updates: Partial<ServiceItem>): void {
    this.blueprintManager.updateServiceItem(id, updates);
    this.recordSnapshot('Updated Service Item', 'manual_edit');
  }

  deleteServiceItem(id: string): void {
    this.blueprintManager.deleteServiceItem(id);
    this.recordSnapshot('Deleted Service Item', 'manual_edit');
  }

  addProductItem(item: Omit<ProductItem, 'id'>): ProductItem {
    const res = this.blueprintManager.addProductItem(item);
    this.recordSnapshot(`Added Product: ${item.name}`, 'manual_edit');
    return res;
  }

  updateProductItem(id: string, updates: Partial<ProductItem>): void {
    this.blueprintManager.updateProductItem(id, updates);
    this.recordSnapshot('Updated Product Item', 'manual_edit');
  }

  deleteProductItem(id: string): void {
    this.blueprintManager.deleteProductItem(id);
    this.recordSnapshot('Deleted Product Item', 'manual_edit');
  }

  getMediaVault(): MediaVaultAsset[] {
    return this.blueprintManager.getMediaVault();
  }

  addMediaAsset(asset: Omit<MediaVaultAsset, 'id' | 'addedAt'>): MediaVaultAsset {
    const res = this.blueprintManager.addMediaAsset(asset);
    this.recordSnapshot(`Added Media Asset: ${asset.name}`, 'manual_edit');
    return res;
  }

  deleteMediaAsset(id: string): void {
    this.blueprintManager.deleteMediaAsset(id);
    this.recordSnapshot('Deleted Media Asset', 'manual_edit');
  }

  applyMediaToSelected(url: string, alt?: string): boolean {
    const selected = this.adapter.getSelectedComponent();
    if (!selected) return false;
    const type = (selected.get('type') || '').toLowerCase();
    const tagName = (selected.get('tagName') || '').toLowerCase();

    if (type === 'image' || tagName === 'img') {
      selected.addAttributes({ src: url, ...(alt ? { alt } : {}) });
    } else {
      selected.addStyle({
        'background-image': `url("${url}")`,
        'background-size': 'cover',
        'background-position': 'center',
      });
    }
    this.recordSnapshot('Applied Media to Canvas', 'manual_edit');
    this.notifyChange();
    return true;
  }

  applyImageToSelected(url: string, alt?: string): boolean {
    return this.applyMediaToSelected(url, alt);
  }

  generateWhatsAppLink(options: { type: 'booking' | 'order' | 'general'; targetId?: string; customMessage?: string }): string {
    return this.blueprintManager.generateWhatsAppLink(options);
  }

  resolveActionBinding(binding: ActionBinding): { url: string; previewLabel: string } {
    return this.blueprintManager.resolveActionBinding(binding);
  }

  formatCurrency(amount: number): string {
    return this.blueprintManager.formatCurrency(amount);
  }

  onBlueprintChange(listener: (bp: BusinessBlueprint) => void): () => void {
    return this.blueprintManager.onChange(listener);
  }

  public syncCanvasWithBlueprint(blueprint?: BusinessBlueprint): void {
    if (!this.adapter || this.isSyncingFromCanvas) return;
    const bp = blueprint || this.blueprintManager.getBlueprint();
    const profile = bp.profile;
    const services = bp.modules.services.items;
    const products = bp.modules.products.items;
    const currency = profile.currency || 'USD';
    const currencySymbol = SUPPORTED_CURRENCIES[currency]?.symbol || '$';
    const currencyRegex = /^(\$|€|£|₦|CA\$|A\$|AED|KSh|R)\s*(\d+(?:,\d+)?(?:\.\d+)?)/i;

    let modified = false;

    // ── 1. Direct Canvas Iframe DOM Synchronization (Instant UI Update) ──
    const doc = this.adapter.getDoc();
    if (doc) {
      // 1a. Business Name in Navbar & brand headers
      const brandElements = doc.querySelectorAll(
        '[data-cuzmify-field="business-name"], .brand-name, .cuzmify-brand-name, nav[data-cuzmify-type="navbar"] span:first-of-type, nav[data-brand] span:first-of-type'
      );
      brandElements.forEach((el) => {
        if (profile.name && el.textContent !== profile.name) {
          el.textContent = profile.name;
          modified = true;
        }
      });

      // 1b. Announcement Bar Brand Name
      const announcementSpans = doc.querySelectorAll('div span');
      announcementSpans.forEach((el) => {
        if (el.textContent && el.textContent.includes('✦') && el.textContent.toLowerCase().includes('luxury artistry')) {
          el.textContent = `✦ ${profile.name} Luxury Artistry`;
          modified = true;
        }
      });

      // 1c. WhatsApp Links on Canvas
      const waLinks = doc.querySelectorAll('a');
      waLinks.forEach((a) => {
        const action = a.getAttribute('data-cuzmify-action');
        const targetId = a.getAttribute('data-cuzmify-target-id');
        const href = a.getAttribute('href') || '';
        const text = (a.textContent || '').toLowerCase();

        if (action === 'whatsapp:booking' || (!action && href.includes('wa.me') && !text.includes('chat') && !text.includes('general'))) {
          const newUrl = this.blueprintManager.generateWhatsAppLink({ type: 'booking', targetId: targetId || undefined });
          if (a.getAttribute('href') !== newUrl) {
            a.setAttribute('href', newUrl);
            modified = true;
          }
        } else if (action === 'whatsapp:order') {
          const newUrl = this.blueprintManager.generateWhatsAppLink({ type: 'order', targetId: targetId || undefined });
          if (a.getAttribute('href') !== newUrl) {
            a.setAttribute('href', newUrl);
            modified = true;
          }
        } else if (action === 'whatsapp:general' || href.includes('wa.me') || text.includes('whatsapp')) {
          const newUrl = this.blueprintManager.generateWhatsAppLink({ type: 'general' });
          if (a.getAttribute('href') !== newUrl) {
            a.setAttribute('href', newUrl);
            modified = true;
          }
        }
      });

      // 1d. Prices & Currency Symbol Synchronization across all price tags in DOM
      const allElements = doc.querySelectorAll('span, p, div, h1, h2, h3, h4');
      allElements.forEach((el) => {
        const text = el.textContent?.trim() || '';
        const match = text.match(currencyRegex);
        if (match && el.children.length === 0) {
          const amount = match[2];
          const newFormatted = `${currencySymbol}${amount}`;
          if (text !== newFormatted) {
            el.textContent = newFormatted;
            modified = true;
          }
        }
      });

      // 1e. Booking Select Dropdowns Synchronization (DOM)
      const selects = doc.querySelectorAll('select');
      selects.forEach((sel) => {
        const optionsList = Array.from(sel.options);
        const isServiceSelect =
          sel.getAttribute('data-cuzmify-type') === 'service-select' ||
          optionsList.some(
            (opt) =>
              opt.text.includes('(') ||
              opt.text.includes('$') ||
              opt.text.includes('₦') ||
              opt.text.includes('€') ||
              opt.text.includes('£') ||
              opt.text.toLowerCase().includes('glam') ||
              opt.text.toLowerCase().includes('bridal') ||
              opt.text.toLowerCase().includes('suite')
          );

        if (isServiceSelect && services.length > 0) {
          sel.innerHTML = services
            .map(
              (srv) =>
                `<option value="${srv.id}">${srv.name} (${currencySymbol}${srv.price})</option>`
            )
            .join('');
          modified = true;
        }
      });
    }

    // ── 2. GrapesJS Component Tree Model Synchronization (Persistence) ──
    this.adapter.traverseComponents((comp) => {
      if (!comp) return;
      const attrs = comp.getAttributes?.() || {};
      const action = attrs['data-cuzmify-action'];
      const targetId = attrs['data-cuzmify-target-id'];
      const field = attrs['data-cuzmify-field'];
      const classes = (comp.getClasses?.() || []).join(' ');
      const href = attrs.href || '';
      const text = (comp.get?.('content') || comp.components?.()?.models?.[0]?.get?.('content') || '').trim();

      // Sync Select dropdown options in component tree
      if (comp.get?.('tagName')?.toLowerCase() === 'select' && services.length > 0) {
        const selectHtml = services
          .map(
            (srv) =>
              `<option value="${srv.id}">${srv.name} (${currencySymbol}${srv.price})</option>`
          )
          .join('');
        comp.components(selectHtml);
        modified = true;
      }

      // Sync Action links & WhatsApp
      if (action) {
        const newBinding = this.blueprintManager.resolveActionBinding({
          action: action as any,
          targetId,
          url: attrs.href,
        });

        if (newBinding.url && attrs.href !== newBinding.url) {
          comp.addAttributes({ href: newBinding.url });
          modified = true;
        }
      } else if (href.includes('wa.me')) {
        const newUrl = this.blueprintManager.generateWhatsAppLink({ type: 'booking' });
        comp.addAttributes({ href: newUrl });
        modified = true;
      }

      // Sync Brand Name
      if (field === 'business-name' || classes.includes('brand-name') || classes.includes('cuzmify-brand-name')) {
        if (profile.name && text !== profile.name) {
          comp.components(profile.name);
          comp.set('content', profile.name);
          const el = comp.getEl?.();
          if (el) el.textContent = profile.name;
          modified = true;
        }
      }

      // Sync Prices & Currency Symbols
      const match = text.match(currencyRegex);
      if (match) {
        const amount = match[2];
        const newFormatted = `${currencySymbol}${amount}`;
        if (text !== newFormatted) {
          comp.components(newFormatted);
          comp.set('content', newFormatted);
          const el = comp.getEl?.();
          if (el) el.textContent = newFormatted;
          modified = true;
        }
      }

      // Sync Phone & Email links
      if (attrs.href?.startsWith('tel:') && profile.phone) {
        const cleanPhone = profile.phone.replace(/[^\d+]/g, '');
        if (attrs.href !== `tel:${cleanPhone}`) {
          comp.addAttributes({ href: `tel:${cleanPhone}` });
          modified = true;
        }
      }

      if (attrs.href?.startsWith('mailto:') && profile.email) {
        if (attrs.href !== `mailto:${profile.email}`) {
          comp.addAttributes({ href: `mailto:${profile.email}` });
          modified = true;
        }
      }
    });

    if (modified) {
      this.adapter.triggerChange();
    }
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  saveToLocalStorage(projectId: string, theme?: string, userId?: string): void {
    try {
      const storageKey = `cuzmify_project_${userId || 'guest'}_${projectId}`;
      const bp = this.blueprintManager.getBlueprint();
      const payload = {
        grapesData: this.adapter.getProjectData(),
        html: this.adapter.getHtml(),
        css: this.adapter.getCss(),
        theme: theme || this.currentTheme,
        blueprint: bp,
        businessName: bp.profile.name,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      console.warn('[EditorService] Could not save to localStorage');
    }
  }

  // ── Database & Cloud Persistence ──────────────────────────────────────────
  async saveToDatabase(
    projectId: string,
    meta?: { businessName?: string; theme?: string; template?: string; category?: string }
  ): Promise<boolean> {
    try {
      const html = this.adapter.getHtml();
      const grapesData = this.adapter.getProjectData();
      const blueprint = this.blueprintManager.getBlueprint();
      const bpName = blueprint.profile?.name;
      const finalName = bpName && bpName !== 'Gmakeup Studio' && bpName !== 'Glory Beauty Studio'
        ? bpName
        : (meta?.businessName || bpName || 'My Business');

      const res = await fetch('/api/sites/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: projectId,
          name: finalName,
          template: meta?.template,
          category: meta?.category || blueprint.profile.category,
          htmlContent: html,
          grapesData: {
            ...(typeof grapesData === 'object' ? grapesData : {}),
            blueprint,
          },
          theme: meta?.theme || this.currentTheme,
          blueprintData: blueprint,
        }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[EditorService] Cloud database save warning:', err);
      return false;
    }
  }

  async loadFromDatabase(projectId: string): Promise<{ loaded: boolean; theme?: string; name?: string }> {
    try {
      const res = await fetch('/api/sites');
      if (!res.ok) return { loaded: false };
      const data = await res.json();
      const site = data?.sites?.find((s: any) => s.id === projectId) || data?.sites?.[0];
      if (!site) return { loaded: false };

      if (site.theme) {
        this.currentTheme = site.theme as ThemeName;
      }

      if (site.grapesData) {
        try {
          const parsed = typeof site.grapesData === 'string' ? JSON.parse(site.grapesData) : site.grapesData;
          if (parsed?.blueprint) {
            this.blueprintManager.hydrate(parsed.blueprint);
          }
        } catch {
          // ignore
        }
      }

      if (site.blueprintData) {
        this.blueprintManager.hydrate(site.blueprintData);
      }

      // If site has a saved business name, ensure profile is in sync
      if (site.name && site.name !== 'Gmakeup Studio' && site.name !== 'Glory Beauty Studio') {
        this.blueprintManager.updateProfile({ name: site.name });
      }

      const activeName = this.blueprintManager.getProfile().name || site.name;

      // 1. Try grapesData first
      if (site.grapesData) {
        try {
          const parsed = typeof site.grapesData === 'string' ? JSON.parse(site.grapesData) : site.grapesData;
          if (parsed && (parsed.pages || parsed.styles || parsed.components)) {
            this.adapter.loadProjectData(parsed);
            this.adapter.sanitizeCanvas();
            this.recordSnapshot('Loaded from Cloud Database', 'initial', site.theme as ThemeName);
            return { loaded: true, theme: site.theme, name: activeName };
          }
        } catch {
          // Fall through to htmlContent
        }
      }

      // 2. Try htmlContent
      if (site.htmlContent && site.htmlContent.length > 50) {
        this.adapter.setHtmlContent(site.htmlContent);
        this.adapter.sanitizeCanvas();
        this.recordSnapshot('Loaded from Cloud Database', 'initial', site.theme as ThemeName);
        return { loaded: true, theme: site.theme, name: activeName };
      }

      return { loaded: false };
    } catch {
      return { loaded: false };
    }
  }

  loadFromLocalStorage(projectId: string, userId?: string): { loaded: boolean; theme?: string; name?: string } {
    try {
      const storageKey = `cuzmify_project_${userId || 'guest'}_${projectId}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { loaded: false };
      const parsed = JSON.parse(raw);

      if (parsed.theme) {
        this.currentTheme = parsed.theme as ThemeName;
      }

      if (parsed.blueprint) {
        this.blueprintManager.hydrate(parsed.blueprint);
      }

      if (parsed.businessName && parsed.businessName !== 'Gmakeup Studio' && parsed.businessName !== 'Glory Beauty Studio') {
        this.blueprintManager.updateProfile({ name: parsed.businessName });
      }

      const activeName = this.blueprintManager.getProfile().name || parsed.businessName;

      if (parsed.grapesData) {
        this.adapter.loadProjectData(parsed.grapesData);
        this.adapter.sanitizeCanvas();
        this.recordSnapshot('Loaded from LocalStorage', 'initial', parsed.theme as ThemeName);
        return { loaded: true, theme: parsed.theme, name: activeName };
      }

      if (parsed.html && typeof parsed.html === 'string' && parsed.html.length > 50) {
        this.adapter.setHtmlContent(parsed.html);
        this.adapter.sanitizeCanvas();
        this.recordSnapshot('Loaded from LocalStorage', 'initial', parsed.theme as ThemeName);
        return { loaded: true, theme: parsed.theme, name: activeName };
      }

      return { loaded: false };
    } catch {
      return { loaded: false };
    }
  }

  getProjectData(): Record<string, unknown> {
    return this.adapter.getProjectData();
  }

  loadProjectData(data: Record<string, unknown>): void {
    this.adapter.loadProjectData(data);
    this.adapter.sanitizeCanvas();
    this.recordSnapshot('Loaded Project Data', 'manual_edit');
  }

  loadHtml(html: string, description = 'Applied HTML update', source: HistorySnapshot['source'] = 'ai_transform', themeOverride?: ThemeName): void {
    this.adapter.setHtmlContent(html);
    this.adapter.sanitizeCanvas();
    this.recordSnapshot(description, source, themeOverride);
    this.notifyChange();
  }

  resetToDefaultTemplate(projectId: string, initialHtml: string): void {
    try {
      localStorage.removeItem(`cuzmify_project_${projectId}`);
    } catch {}
    this.adapter.setHtmlContent(initialHtml);
    this.adapter.sanitizeCanvas();
    this.historyManager.clear();
    this.recordSnapshot('Reset to Default Template', 'initial');
    this.notifyChange();
  }

  sanitizeCanvas(): void {
    this.adapter.sanitizeCanvas();
  }

  // ── Viewport ──────────────────────────────────────────────────────────────
  setDevice(device: 'desktop' | 'tablet' | 'mobile'): void {
    this.adapter.setDevice(device);
  }

  getDevice(): string {
    return this.adapter.getDevice();
  }

  // ── Theme ─────────────────────────────────────────────────────────────────
  applyTheme(name: ThemeName): void {
    this.currentTheme = name;
    this.themeEngine.applyTheme(name);
    this.recordSnapshot(`Changed theme to ${name}`, 'theme_change', name);
    this.notifyChange();
  }

  getAvailableThemes(): ThemeName[] {
    return this.themeEngine.getAvailableThemes();
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  getSelectedComponentType(): string | null {
    const comp = this.adapter.getSelectedComponent();
    if (!comp) return null;
    const model = comp as { get: (k: string) => string };
    return model.get('type') ?? model.get('tagName') ?? null;
  }

  getSelectedComponentTraits(): Record<string, string> {
    const comp = this.adapter.getSelectedComponent();
    if (!comp) return {};
    const model = comp as { getAttributes?: () => Record<string, string> };
    return typeof model.getAttributes === 'function' ? model.getAttributes() : {};
  }

  updateTrait(name: string, value: string): void {
    this.adapter.updateSelectedTrait(name, value);
    this.handleDebouncedChange(`Updated ${name}`, 'manual_edit');
  }

  updateSelectedTrait(name: string, value: string): void {
    this.adapter.updateSelectedTrait(name, value);
    this.handleDebouncedChange(`Updated ${name}`, 'manual_edit');
  }

  updateStyle(prop: string, value: string): void {
    this.adapter.updateSelectedStyle(prop, value);
    this.handleDebouncedChange(`Updated style ${prop}`, 'manual_edit');
  }

  updateSelectedStyle(prop: string, value: string): void {
    this.adapter.updateSelectedStyle(prop, value);
    this.handleDebouncedChange(`Updated style ${prop}`, 'manual_edit');
  }

  getSelectedStyle(prop: string): string {
    return this.adapter.getSelectedStyle(prop);
  }

  getAllSelectedStyles(): Record<string, string> {
    return this.adapter.getAllSelectedStyles();
  }

  getSelectedElementDetails(): {
    id?: string;
    tagName: string;
    type?: string;
    text?: string;
    href?: string;
    classes?: string;
    htmlSnippet?: string;
  } | null {
    const comp = this.adapter.getSelectedComponent() as any;
    if (!comp) return null;

    const tagName = (comp.get?.('tagName') || comp.get?.('type') || 'div').toLowerCase();
    const attrs = typeof comp.getAttributes === 'function' ? comp.getAttributes() : {};
    let id = attrs.id || comp.getId?.() || '';
    const href = attrs.href || comp.get?.('attributes')?.href || '';
    const classes = comp.getClasses?.()?.join(' ') || attrs.class || '';
    const text = comp.getEl?.()?.textContent?.trim() || '';

    // Ensure the component has a unique ID attribute so it can be targeted pinpointed
    if (!id || !attrs.id) {
      const generatedId = `cuzmify-target-${Math.random().toString(36).substring(2, 7)}`;
      if (typeof comp.addAttributes === 'function') {
        comp.addAttributes({ id: generatedId });
        id = generatedId;
      }
    }

    let htmlSnippet = '';
    try {
      htmlSnippet = comp.toHTML?.() || '';
    } catch {}

    return {
      id,
      tagName,
      type: comp.get?.('type') || tagName,
      text: text.slice(0, 100),
      href,
      classes,
      htmlSnippet: htmlSnippet.slice(0, 1000),
    };
  }

  replaceSelectedComponent(newHtml: string): boolean {
    const success = this.adapter.replaceSelectedComponent(newHtml);
    if (success) {
      this.recordSnapshot('Replaced element via AI', 'ai_transform');
      this.notifyChange();
    }
    return success;
  }

  // ── Section Re-ordering APIs ──────────────────────────────────────────────
  getSectionsList(): { id: string; type: string; name: string; index: number }[] {
    return this.adapter.getSectionsList();
  }

  moveSectionUp(index: number): void {
    this.adapter.moveSectionUp(index);
    this.recordSnapshot('Moved section up', 'section_reorder');
    this.notifyChange();
  }

  moveSectionDown(index: number): void {
    this.adapter.moveSectionDown(index);
    this.recordSnapshot('Moved section down', 'section_reorder');
    this.notifyChange();
  }

  moveSectionTo(fromIndex: number, toIndex: number): void {
    this.adapter.moveSectionTo(fromIndex, toIndex);
    this.recordSnapshot('Reordered section', 'section_reorder');
    this.notifyChange();
  }

  removeSection(index: number): void {
    this.adapter.removeSection(index);
    this.recordSnapshot('Removed section', 'section_reorder');
    this.notifyChange();
  }

  selectSectionByIndex(index: number): void {
    this.adapter.selectSectionByIndex(index);
  }

  deselect(): void {
    this.adapter.deselectAll();
  }

  addBlock(blockId: string): void {
    this.adapter.addBlock(blockId);
    this.recordSnapshot(`Added ${blockId}`, 'block_insert');
    this.notifyChange();
  }

  // ── AI Full-Site Transformation & Inline Copilot APIs ───────────────────
  applyAITransformation(
    plan: import('../ai/AIEngine').AITransformationPlan,
    callbacks?: { onSetTheme?: (t: import('@/core/project-schema').ThemeName) => void }
  ): void {
    if (plan.theme && callbacks?.onSetTheme) {
      callbacks.onSetTheme(plan.theme);
    }

    if (plan.heroHeadline) {
      this.adapter.updateSectionField('hero', 'headline', plan.heroHeadline);
    }
    if (plan.heroSubheadline) {
      this.adapter.updateSectionField('hero', 'subheadline', plan.heroSubheadline);
    }
    if (plan.heroCtaText) {
      this.adapter.updateSectionField('hero', 'cta', plan.heroCtaText);
    }
    this.adapter.highlightSectionGlow('hero');

    if (plan.aboutTitle) {
      this.adapter.updateSectionField('about', 'headline', plan.aboutTitle);
    }
    if (plan.aboutDescription) {
      this.adapter.updateSectionField('about', 'subheadline', plan.aboutDescription);
    }
    this.adapter.highlightSectionGlow('about');

    if (plan.servicesTitle) {
      this.adapter.updateSectionField('services', 'headline', plan.servicesTitle);
    }
    this.adapter.highlightSectionGlow('services');

    if (plan.bookingTitle) {
      this.adapter.updateSectionField('booking', 'headline', plan.bookingTitle);
    }
    if (plan.bookingCta) {
      this.adapter.updateSectionField('booking', 'cta', plan.bookingCta);
    }
    this.adapter.highlightSectionGlow('booking');

    this.recordSnapshot('AI Website Transformation', 'ai_transform', plan.theme as ThemeName);
    this.notifyChange();
  }

  updateSelectedText(newText: string): void {
    this.adapter.updateSelectedComponentText(newText);
    this.handleDebouncedChange('Updated text', 'manual_edit');
  }

  getSelectedText(): string {
    return this.adapter.getSelectedComponentText();
  }

  getSelectedRect(): { top: number; left: number; width: number; height: number } | null {
    return this.adapter.getSelectedComponentCanvasRect();
  }

  highlightSection(sectionType: string): void {
    this.adapter.highlightSectionGlow(sectionType);
  }

  // ── Preview ───────────────────────────────────────────────────────────────
  enablePreview(): void { this.adapter.enablePreview(); }
  disablePreview(): void { this.adapter.disablePreview(); }

  // ── Export ────────────────────────────────────────────────────────────────
  getHtml(): string { return this.adapter.getHtml(); }
  getCss(): string { return this.adapter.getCss(); }

  // ── Events ────────────────────────────────────────────────────────────────
  onChanged(fn: () => void): () => void {
    this.changeListeners.push(fn);
    return () => {
      this.changeListeners = this.changeListeners.filter((f) => f !== fn);
    };
  }

  onSelectionChange(fn: (type: string | null) => void): () => void {
    this.selectionListeners.push(fn);
    return () => {
      this.selectionListeners = this.selectionListeners.filter((f) => f !== fn);
    };
  }

  /** Internal: notify all change listeners */
  private notifyChange(): void {
    this.changeListeners.forEach((fn) => fn());
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────
  destroy(): void {
    if (this.snapshotDebounceTimer) clearTimeout(this.snapshotDebounceTimer);
    this.adapter.destroy();
    this.changeListeners = [];
    this.selectionListeners = [];
    this.historyListeners = [];
    this.historyManager.clear();
  }
}
