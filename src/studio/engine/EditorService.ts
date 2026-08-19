import type { Editor } from 'grapesjs';
import { GrapesAdapter } from './GrapesAdapter';
import { ThemeEngine } from '../theme/ThemeEngine';
import { ComponentRegistry } from './ComponentRegistry';
import { BlockRegistry } from './BlockRegistry';
import { HistoryManager, type HistorySnapshot } from './HistoryManager';
import type { ThemeName } from '@/core/project-schema';
import type { CuzmifyComponentTraits } from '@/core/types';

export class EditorService {
  private adapter: GrapesAdapter;
  private themeEngine: ThemeEngine;
  private historyManager: HistoryManager;
  private changeListeners: Array<() => void> = [];
  private selectionListeners: Array<(type: string | null) => void> = [];
  private historyListeners: Array<(state: { canUndo: boolean; canRedo: boolean; description?: string }) => void> = [];
  private isMoving = false;
  private snapshotDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentTheme: ThemeName = 'bram-light';

  constructor(grapesEditor: Editor) {
    this.adapter = new GrapesAdapter(grapesEditor);
    this.themeEngine = new ThemeEngine(this.adapter);
    this.historyManager = new HistoryManager(50);

    ComponentRegistry.register(grapesEditor);
    BlockRegistry.register(grapesEditor);

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
    });
  }

  // ── Snapshot Capture Engine ───────────────────────────────────────────────
  public recordSnapshot(description: string, source: HistorySnapshot['source'], themeOverride?: ThemeName): void {
    if (this.historyManager.isPerformingRestore) return;

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
    this.notifyChange();
    if (this.historyManager.isPerformingRestore) return;

    if (this.snapshotDebounceTimer) clearTimeout(this.snapshotDebounceTimer);
    this.snapshotDebounceTimer = setTimeout(() => {
      this.recordSnapshot(description, source);
    }, 500);
  }

  // ── Universal Undo / Redo ─────────────────────────────────────────────────
  public undo(): boolean {
    const previous = this.historyManager.undo();
    if (!previous) {
      // Fallback to internal GrapesJS undo
      this.adapter.undo();
      this.notifyChange();
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
    }
  }

  public redo(): boolean {
    const next = this.historyManager.redo();
    if (!next) {
      // Fallback to internal GrapesJS redo
      this.adapter.redo();
      this.notifyChange();
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
    }
  }

  public canUndo(): boolean {
    return this.historyManager.canUndo() || this.adapter.canUndo();
  }

  public canRedo(): boolean {
    return this.historyManager.canRedo() || this.adapter.canRedo();
  }

  public onHistoryChange(listener: (state: { canUndo: boolean; canRedo: boolean; description?: string }) => void): () => void {
    this.historyListeners.push(listener);
    listener({ canUndo: this.canUndo(), canRedo: this.canRedo() });
    return () => {
      this.historyListeners = this.historyListeners.filter((l) => l !== listener);
    };
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  saveToLocalStorage(projectId: string, theme?: string, userId?: string): void {
    try {
      const storageKey = `cuzmify_project_${userId || 'guest'}_${projectId}`;
      const payload = {
        grapesData: this.adapter.getProjectData(),
        html: this.adapter.getHtml(),
        css: this.adapter.getCss(),
        theme: theme || this.currentTheme,
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
      const res = await fetch('/api/sites/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: projectId,
          name: meta?.businessName,
          template: meta?.template,
          category: meta?.category,
          htmlContent: html,
          grapesData,
          theme: meta?.theme || this.currentTheme,
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

      // 1. Try grapesData first
      if (site.grapesData) {
        try {
          const parsed = typeof site.grapesData === 'string' ? JSON.parse(site.grapesData) : site.grapesData;
          if (parsed && (parsed.pages || parsed.styles || parsed.components)) {
            this.adapter.loadProjectData(parsed);
            this.adapter.sanitizeCanvas();
            this.recordSnapshot('Loaded from Cloud Database', 'initial', site.theme as ThemeName);
            return { loaded: true, theme: site.theme, name: site.name };
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
        return { loaded: true, theme: site.theme, name: site.name };
      }

      return { loaded: false };
    } catch {
      return { loaded: false };
    }
  }

  loadFromLocalStorage(projectId: string, userId?: string): { loaded: boolean; theme?: string } {
    try {
      const storageKey = `cuzmify_project_${userId || 'guest'}_${projectId}`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return { loaded: false };
      const parsed = JSON.parse(raw);

      if (parsed.theme) {
        this.currentTheme = parsed.theme as ThemeName;
      }

      if (parsed.grapesData) {
        this.adapter.loadProjectData(parsed.grapesData);
        this.adapter.sanitizeCanvas();
        this.recordSnapshot('Loaded from LocalStorage', 'initial', parsed.theme as ThemeName);
        return { loaded: true, theme: parsed.theme };
      }

      if (parsed.html && typeof parsed.html === 'string' && parsed.html.length > 50) {
        this.adapter.setHtmlContent(parsed.html);
        this.adapter.sanitizeCanvas();
        this.recordSnapshot('Loaded from LocalStorage', 'initial', parsed.theme as ThemeName);
        return { loaded: true, theme: parsed.theme };
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
