import type { Editor } from 'grapesjs';
import { GrapesAdapter } from './GrapesAdapter';
import { ThemeEngine } from '../theme/ThemeEngine';
import { ComponentRegistry } from './ComponentRegistry';
import { BlockRegistry } from './BlockRegistry';
import type { ThemeName } from '@/core/project-schema';
import type { CuzmifyComponentTraits } from '@/core/types';

export class EditorService {
  private adapter: GrapesAdapter;
  private themeEngine: ThemeEngine;
  private changeListeners: Array<() => void> = [];
  private selectionListeners: Array<(type: string | null) => void> = [];
  private isMoving = false; // Guard against concurrent operations

  constructor(grapesEditor: Editor) {
    this.adapter = new GrapesAdapter(grapesEditor);
    this.themeEngine = new ThemeEngine(this.adapter);

    ComponentRegistry.register(grapesEditor);
    BlockRegistry.register(grapesEditor);

    this.adapter.on('change:changesCount', () => {
      this.notifyChange();
    });

    this.adapter.on('cuzmify:change', () => {
      this.notifyChange();
    });

    this.adapter.on('component:add', () => {
      this.notifyChange();
    });

    this.adapter.on('component:remove', () => {
      this.notifyChange();
    });

    this.adapter.on('component:selected', (comp: unknown) => {
      const model = comp as { get: (k: string) => string } | null;
      const type = model?.get('type') ?? model?.get('tagName') ?? null;
      this.selectionListeners.forEach((fn) => fn(type as string | null));
    });

    this.adapter.on('component:deselected', () => {
      this.selectionListeners.forEach((fn) => fn(null));
    });
  }

  // ── Persistence ───────────────────────────────────────────────────────────
  saveToLocalStorage(projectId: string, theme?: string, userId?: string): void {
    try {
      const storageKey = `cuzmify_project_${userId || 'guest'}_${projectId}`;
      const payload = {
        grapesData: this.adapter.getProjectData(),
        html: this.adapter.getHtml(),
        css: this.adapter.getCss(),
        theme: theme || 'bram-light',
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
          theme: meta?.theme || 'bram-light',
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

      // 1. Try grapesData first (preserves 100% of components, layouts, and custom CSS)
      if (site.grapesData) {
        try {
          const parsed = typeof site.grapesData === 'string' ? JSON.parse(site.grapesData) : site.grapesData;
          if (parsed && (parsed.pages || parsed.styles || parsed.components)) {
            this.adapter.loadProjectData(parsed);
            this.adapter.sanitizeCanvas();
            return { loaded: true, theme: site.theme, name: site.name };
          }
        } catch {
          // Fall through to htmlContent
        }
      }

      // 2. Try htmlContent (with embedded <style> tags)
      if (site.htmlContent && site.htmlContent.length > 50) {
        this.adapter.setHtmlContent(site.htmlContent);
        this.adapter.sanitizeCanvas();
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

      if (parsed.grapesData) {
        this.adapter.loadProjectData(parsed.grapesData);
        this.adapter.sanitizeCanvas();
        return { loaded: true, theme: parsed.theme };
      }

      if (parsed.html && typeof parsed.html === 'string' && parsed.html.length > 50) {
        this.adapter.setHtmlContent(parsed.html);
        this.adapter.sanitizeCanvas();
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
  }

  loadHtml(html: string): void {
    this.adapter.setHtmlContent(html);
    this.adapter.sanitizeCanvas();
    this.notifyChange();
  }

  resetToDefaultTemplate(projectId: string, initialHtml: string): void {
    try {
      localStorage.removeItem(`cuzmify_project_${projectId}`);
      localStorage.clear();
    } catch {}
    this.adapter.setHtmlContent(initialHtml);
    this.adapter.sanitizeCanvas();
    this.notifyChange();
  }

  sanitizeCanvas(): void {
    this.adapter.sanitizeCanvas();
  }

  // ── History ───────────────────────────────────────────────────────────────
  undo(): void { this.adapter.undo(); }
  redo(): void { this.adapter.redo(); }
  canUndo(): boolean { return this.adapter.canUndo(); }
  canRedo(): boolean { return this.adapter.canRedo(); }

  // ── Device ────────────────────────────────────────────────────────────────
  setDevice(device: 'desktop' | 'tablet' | 'mobile'): void {
    this.adapter.setDevice(device);
  }

  getDevice(): string {
    return this.adapter.getDevice();
  }

  // ── Theme ─────────────────────────────────────────────────────────────────
  applyTheme(name: ThemeName): void {
    this.themeEngine.applyTheme(name);
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
  }

  updateSelectedTrait(name: string, value: string): void {
    this.adapter.updateSelectedTrait(name, value);
  }

  updateStyle(prop: string, value: string): void {
    this.adapter.updateSelectedStyle(prop, value);
  }

  updateSelectedStyle(prop: string, value: string): void {
    this.adapter.updateSelectedStyle(prop, value);
  }

  getSelectedElementDetails(): {
    id?: string;
    tagName: string;
    type?: string;
    text?: string;
    classes?: string;
    htmlSnippet?: string;
  } | null {
    const comp = this.adapter.getSelectedComponent() as any;
    if (!comp) return null;

    const tagName = comp.get?.('tagName') || comp.get?.('type') || 'element';
    const attrs = typeof comp.getAttributes === 'function' ? comp.getAttributes() : {};
    let id = attrs.id || comp.getId?.() || '';
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
      text: text.slice(0, 80),
      classes,
      htmlSnippet: htmlSnippet.slice(0, 800),
    };
  }

  // ── Section Re-ordering APIs (FIXED) ──────────────────────────────────────

  getSectionsList(): { id: string; type: string; name: string; index: number }[] {
    return this.adapter.getSectionsList();
  }

  moveSectionUp(index: number): void {
    this.adapter.moveSectionUp(index);
    this.notifyChange();
  }

  moveSectionDown(index: number): void {
    this.adapter.moveSectionDown(index);
    this.notifyChange();
  }

  moveSectionTo(fromIndex: number, toIndex: number): void {
    this.adapter.moveSectionTo(fromIndex, toIndex);
    this.notifyChange();
  }

  removeSection(index: number): void {
    this.adapter.removeSection(index);
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
  }

  // ── AI Full-Site Transformation & Inline Copilot APIs ───────────────────
  applyAITransformation(
    plan: import('../ai/AIEngine').AITransformationPlan,
    callbacks?: { onSetTheme?: (t: import('@/core/project-schema').ThemeName) => void }
  ): void {
    // 1. Switch Theme if specified
    if (plan.theme && callbacks?.onSetTheme) {
      callbacks.onSetTheme(plan.theme);
    }

    // 2. Update Hero section copy
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

    // 3. Update About section copy
    if (plan.aboutTitle) {
      this.adapter.updateSectionField('about', 'headline', plan.aboutTitle);
    }
    if (plan.aboutDescription) {
      this.adapter.updateSectionField('about', 'subheadline', plan.aboutDescription);
    }
    this.adapter.highlightSectionGlow('about');

    // 4. Update Services section copy
    if (plan.servicesTitle) {
      this.adapter.updateSectionField('services', 'headline', plan.servicesTitle);
    }
    this.adapter.highlightSectionGlow('services');

    // 5. Update Booking section copy
    if (plan.bookingTitle) {
      this.adapter.updateSectionField('booking', 'headline', plan.bookingTitle);
    }
    if (plan.bookingCta) {
      this.adapter.updateSectionField('booking', 'cta', plan.bookingCta);
    }
    this.adapter.highlightSectionGlow('booking');

    this.notifyChange();
  }

  updateSelectedText(newText: string): void {
    this.adapter.updateSelectedComponentText(newText);
    this.notifyChange();
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
    this.adapter.destroy();
    this.changeListeners = [];
    this.selectionListeners = [];
  }
}
