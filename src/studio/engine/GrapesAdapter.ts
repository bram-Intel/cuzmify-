import type { Editor } from 'grapesjs';
import type { EditorAdapter } from './EditorAdapter';
import type { CuzmifyComponentTraits } from '@/core/types';
import { RESPONSIVE_CORE_CSS } from '@/core/responsive-core';

export class GrapesAdapter implements EditorAdapter {
  private editor: Editor;

  constructor(grapesEditor: Editor) {
    this.editor = grapesEditor;
    this.setupCanvasDragListeners();
  }

  // ── Real-Time Canvas Drag Drop Indicator ──────────────────────────────────
  private setupCanvasDragListeners(): void {
    try {
      this.editor.on('load', () => {
        const doc = this.editor.Canvas.getDocument();
        if (!doc) return;

        let line = doc.getElementById('cuzmify-drop-line');
        if (!line) {
          line = doc.createElement('div');
          line.id = 'cuzmify-drop-line';
          line.style.position = 'absolute';
          line.style.left = '0';
          line.style.right = '0';
          line.style.height = '6px';
          line.style.background = '#0D5771';
          line.style.boxShadow = '0 0 16px rgba(13,87,113,0.8), 0 0 32px rgba(13,87,113,0.4)';
          line.style.zIndex = '999999';
          line.style.pointerEvents = 'none';
          line.style.display = 'none';
          line.style.borderRadius = '3px';
          doc.body.appendChild(line);
        }

        const handleDragOver = (e: DragEvent) => {
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';

          const sections = doc.querySelectorAll('section, nav, [data-cuzmify-type]');
          let closestSec: Element | null = null;
          let closestDist = Infinity;
          let isTop = false;

          sections.forEach((sec) => {
            const rect = sec.getBoundingClientRect();
            const secMidY = rect.top + rect.height / 2;
            const dist = Math.abs(e.clientY - secMidY);
            if (dist < closestDist) {
              closestDist = dist;
              closestSec = sec;
              isTop = e.clientY < secMidY;
            }
          });

          if (closestSec && line) {
            const rect = (closestSec as Element).getBoundingClientRect();
            const yPos =
              isTop
                ? rect.top + doc.defaultView!.scrollY
                : rect.bottom + doc.defaultView!.scrollY;
            line.style.top = `${yPos - 3}px`;
            line.style.display = 'block';
          }
        };

        const handleDragLeave = (e: DragEvent) => {
          if (!e.relatedTarget && line) line.style.display = 'none';
        };

        const handleDrop = () => {
          if (line) line.style.display = 'none';
        };

        doc.addEventListener('dragover', handleDragOver);
        doc.addEventListener('dragleave', handleDragLeave);
        doc.addEventListener('drop', handleDrop);

        // Store cleanup reference
        (this.editor as any).__cuzmifyCanvasListenersCleanup = () => {
          doc.removeEventListener('dragover', handleDragOver);
          doc.removeEventListener('dragleave', handleDragLeave);
          doc.removeEventListener('drop', handleDrop);
        };
      });
    } catch {
      // canvas not ready
    }
  }

  // ── HTML / CSS access ─────────────────────────────────────────────────────
  getHtml(): string {
    const css = this.editor.getCss();
    const html = this.editor.getHtml();
    if (css && css.trim().length > 0 && !html.includes(css)) {
      return `<style>${css}</style>\n${html}`;
    }
    return html;
  }

  getCss(): string {
    return this.editor.getCss() ?? '';
  }

  getProjectData(): Record<string, unknown> {
    return this.editor.getProjectData() as Record<string, unknown>;
  }

  loadProjectData(data: Record<string, unknown>): void {
    try {
      this.editor.loadProjectData(data);
      this.editor.trigger('cuzmify:change');
    } catch {
      this.editor.once('load', () => {
        try {
          this.editor.loadProjectData(data);
          this.editor.trigger('cuzmify:change');
        } catch {
          // bypass
        }
      });
    }
  }

  setHtmlContent(fullHtml: string): void {
    if (!fullHtml) return;
    try {
      let css = '';
      let cleanHtml = fullHtml;

      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
      let match;
      while ((match = styleRegex.exec(fullHtml)) !== null) {
        css += '\n' + match[1];
      }
      cleanHtml = fullHtml.replace(styleRegex, '').trim();

      if (css) {
        try {
          this.editor.setStyle(css);
        } catch {}
      }

      this.editor.setComponents(cleanHtml);
      try {
        this.editor.refresh();
      } catch {}
      this.editor.trigger('cuzmify:change');
    } catch {
      this.editor.once('load', () => {
        try {
          this.editor.setComponents(fullHtml);
          this.editor.refresh();
          this.editor.trigger('cuzmify:change');
        } catch {
          // bypass
        }
      });
    }
  }

  sanitizeCanvas(): void {
    try {
      // 1. Ensure responsive CSS stylesheet is always fresh in the document head
      const doc = this.editor.Canvas?.getDocument();
      if (doc) {
        let style = doc.getElementById('cuzmify-base-css');
        if (!style) {
          style = doc.createElement('style');
          style.id = 'cuzmify-base-css';
          doc.head.appendChild(style);
        }
        style.innerHTML = RESPONSIVE_CORE_CSS;

        // 2. Automatically upgrade Navbar elements with responsive helper classes
        const nav = doc.querySelector('nav, [data-cuzmify-type="navbar"]');
        if (nav) {
          const brand = nav.querySelector('[data-cuzmify-field="business-name"], span:first-of-type');
          if (brand && !brand.classList.contains('brand-name')) {
            brand.classList.add('brand-name');
          }
          const linksContainer = nav.querySelector('div:nth-child(2), div[style*="gap"]');
          if (linksContainer && !linksContainer.classList.contains('nav-links')) {
            linksContainer.classList.add('nav-links');
          }
          const cta = nav.querySelector('a[href*="booking"], a[data-cuzmify-action], a:last-child');
          if (cta && !cta.classList.contains('nav-cta')) {
            cta.classList.add('nav-cta');
          }
        }

        // 3. Upgrade announcement bar
        const announcement = doc.querySelector('div[style*="background:#083D50"], div[style*="background: #083D50"]');
        if (announcement && !announcement.classList.contains('cuzmify-announcement-bar')) {
          announcement.classList.add('cuzmify-announcement-bar');
        }

        // 4. Upgrade any legacy multi-column grids to fluid auto-fit
        const grids = doc.querySelectorAll('div[style*="grid-template-columns"]');
        grids.forEach((el: any) => {
          if (el.style && el.style.gridTemplateColumns && (el.style.gridTemplateColumns.includes('repeat(2') || el.style.gridTemplateColumns.includes('repeat(3') || el.style.gridTemplateColumns.includes('1fr 1fr'))) {
            el.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
          }
        });
      }

      // 5. Remove unwanted block raw strings
      const wrapper = this.editor.getWrapper();
      if (!wrapper) return;
      const blockIds = [
        'cuzmify-booking', 'cuzmify-hero', 'cuzmify-services',
        'cuzmify-gallery', 'cuzmify-testimonials', 'cuzmify-cta', 'cuzmify-whatsapp',
        'cuzmify-products', 'cuzmify-cart', 'cuzmify-payments',
      ];
      const cleanNode = (comp: any) => {
        if (!comp) return;
        const content = comp.get?.('content');
        if (typeof content === 'string') {
          for (const bid of blockIds) {
            if (content.trim() === bid || content.includes(`{"type":"${bid}"`)) {
              comp.remove();
              return;
            }
          }
        }
        const children = comp.components?.()?.models || [];
        children.forEach(cleanNode);
      };
      const topChildren = wrapper.components()?.models || [];
      topChildren.forEach(cleanNode);
    } catch {
      // sanitize bypass
    }
  }

  // ── History ───────────────────────────────────────────────────────────────
  undo(): void {
    this.editor.runCommand('core:undo');
  }

  redo(): void {
    this.editor.runCommand('core:redo');
  }

  canUndo(): boolean {
    return this.editor.UndoManager.hasUndo();
  }

  canRedo(): boolean {
    return this.editor.UndoManager.hasRedo();
  }

  clearHistory(): void {
    this.editor.UndoManager.clear();
  }

  // ── Viewport ──────────────────────────────────────────────────────────────
  setDevice(device: 'desktop' | 'tablet' | 'mobile'): void {
    this.editor.setDevice(device);
  }

  getDevice(): string {
    return this.editor.getDevice();
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  getSelectedComponent() {
    return this.editor.getSelected();
  }

  selectComponent(component: unknown): void {
    this.editor.select(component as Parameters<Editor['select']>[0]);
  }

  deselectAll(): void {
    this.editor.select([]);
  }

  replaceSelectedComponent(newHtml: string): boolean {
    try {
      const selected = this.editor.getSelected() as any;
      if (selected) {
        const parent = selected.parent?.();
        if (parent) {
          const index = selected.index?.() ?? 0;
          parent.append(newHtml, { at: index });
          selected.remove();
          this.editor.refresh();
          this.editor.trigger('cuzmify:change');
          return true;
        }
      }
    } catch (err) {
      console.warn('[GrapesAdapter] replaceSelectedComponent error:', err);
    }
    return false;
  }

  // ── Canvas CSS injection ──────────────────────────────────────────────────
  injectCanvasCSS(css: string): void {
    try {
      const doc = this.editor.Canvas.getDocument();
      if (!doc) return;
      let el = doc.getElementById('cuzmify-tokens');
      if (!el) {
        el = doc.createElement('style');
        el.id = 'cuzmify-tokens';
        doc.head.appendChild(el);
      }
      el.innerHTML = css;
    } catch {
      // canvas not ready
    }
  }

  // ── Events ────────────────────────────────────────────────────────────────
  on(event: string, cb: (...args: unknown[]) => void): void {
    this.editor.on(event, cb);
  }

  off(event: string, cb: (...args: unknown[]) => void): void {
    this.editor.off(event, cb);
  }

  triggerChange(): void {
    this.editor.trigger('cuzmify:change');
    try {
      this.editor.refresh();
    } catch {}
  }

  getDoc(): Document | null {
    try {
      return this.editor.Canvas.getDocument();
    } catch {
      return null;
    }
  }

  traverseComponents(callback: (comp: any) => void): void {
    try {
      const wrapper = this.editor.getWrapper();
      if (!wrapper) return;

      const walk = (comp: any) => {
        if (!comp) return;
        callback(comp);
        const children = comp.components?.()?.models || [];
        for (const child of children) {
          walk(child);
        }
      };
      walk(wrapper);
    } catch (err) {
      console.warn('[GrapesAdapter] traverseComponents error:', err);
    }
  }

  // ── Component manipulation & Inline Text Editing ─────────────────────────
  updateSelectedTrait(name: string, value: string): void {
    const selected = this.editor.getSelected() as any;
    if (!selected) return;
    if (typeof selected.addAttributes === 'function') {
      selected.addAttributes({ [name]: value });
    } else if (typeof selected.set === 'function') {
      selected.set(name, value);
    }
  }

  updateSelectedStyle(prop: string, value: string): void {
    const selected = this.editor.getSelected() as any;
    if (!selected) return;
    if (typeof selected.addStyle === 'function') {
      selected.addStyle({ [prop]: value });
    }
  }

  getSelectedStyle(prop: string): string {
    const selected = this.editor.getSelected() as any;
    if (!selected) return '';
    try {
      if (typeof selected.getStyle === 'function') {
        const styles = selected.getStyle();
        if (styles && styles[prop] !== undefined) return String(styles[prop]);
      }
      const el = selected.getEl?.();
      if (el && typeof window !== 'undefined') {
        const win = el.ownerDocument?.defaultView || window;
        const computed = win.getComputedStyle(el);
        return computed.getPropertyValue(prop) || '';
      }
    } catch {}
    return '';
  }

  getAllSelectedStyles(): Record<string, string> {
    const selected = this.editor.getSelected() as any;
    if (!selected) return {};
    try {
      if (typeof selected.getStyle === 'function') {
        return selected.getStyle() || {};
      }
    } catch {}
    return {};
  }

  getSelectedComponentText(): string {
    const selected = this.editor.getSelected() as any;
    if (!selected) return '';
    try {
      const el = selected.getEl?.();
      if (el) return el.textContent?.trim() || '';
      return selected.get?.('content') || '';
    } catch {
      return '';
    }
  }

  updateSelectedComponentText(newText: string): void {
    const selected = this.editor.getSelected() as any;
    if (!selected) return;
    try {
      // 1. Update GrapesJS component collection & content model (official GrapesJS API)
      if (typeof selected.components === 'function') {
        selected.components(newText);
      }
      if (typeof selected.set === 'function') {
        selected.set('content', newText);
      }

      // 2. Update live DOM element
      const el = selected.getEl?.();
      if (el) {
        el.textContent = newText;
      }

      this.editor.trigger('component:update', selected);
      this.editor.trigger('cuzmify:change');
    } catch {
      const el = selected.getEl?.();
      if (el) el.textContent = newText;
    }
  }

  getSelectedComponentCanvasRect(): { top: number; left: number; width: number; height: number } | null {
    const selected = this.editor.getSelected() as any;
    if (!selected) return null;
    try {
      const el = selected.getEl?.();
      if (!el) return null;
      const iframe = this.editor.Canvas.getFrameEl?.() as HTMLIFrameElement;
      const rect = el.getBoundingClientRect();
      const iframeRect = iframe ? iframe.getBoundingClientRect() : { top: 0, left: 0 };
      return {
        top: iframeRect.top + rect.top,
        left: iframeRect.left + rect.left,
        width: rect.width,
        height: rect.height,
      };
    } catch {
      return null;
    }
  }

  // ── AI Section Content Dispatch & Visual Glow ─────────────────────────────
  updateSectionField(sectionType: string, field: string, newText: string): void {
    try {
      const doc = this.editor.Canvas.getDocument();
      if (!doc) return;

      const secEl = doc.querySelector(`[data-cuzmify-type="${sectionType}"], section#${sectionType}, section.${sectionType}`);
      if (!secEl) return;

      let targetEl: Element | null = null;
      if (field === 'headline' || field === 'heroHeadline' || field === 'title') {
        targetEl = secEl.querySelector('[data-cuzmify-field="headline"]') || secEl.querySelector('h1') || secEl.querySelector('h2');
      } else if (field === 'subheadline' || field === 'heroSubheadline' || field === 'description') {
        targetEl = secEl.querySelector('[data-cuzmify-field="subheadline"]') || secEl.querySelector('p');
      } else if (field === 'cta' || field === 'heroCtaText' || field === 'bookingCta') {
        targetEl = secEl.querySelector('a[href*="booking"], a[href*="wa.me"], button');
      }

      if (targetEl) {
        targetEl.textContent = newText;
      }
    } catch {
      // ignore
    }
  }

  highlightSectionGlow(sectionType: string): void {
    try {
      const doc = this.editor.Canvas.getDocument();
      if (!doc) return;
      const secEl = (doc.querySelector(`[data-cuzmify-type="${sectionType}"], section#${sectionType}`) as HTMLElement);
      if (!secEl) return;

      const originalShadow = secEl.style.boxShadow;
      const originalTransition = secEl.style.transition;

      secEl.style.transition = 'box-shadow 0.4s ease, transform 0.4s ease';
      secEl.style.boxShadow = '0 0 0 3px #10B981, 0 0 30px rgba(16, 185, 129, 0.4)';
      secEl.style.transform = 'scale(1.002)';

      setTimeout(() => {
        secEl.style.boxShadow = originalShadow;
        secEl.style.transform = '';
        setTimeout(() => {
          secEl.style.transition = originalTransition;
        }, 400);
      }, 2200);
    } catch {
      // ignore
    }
  }

  // ── Section Re-ordering APIs (FIXED) ──────────────────────────────────────

  /**
   * Returns direct children of the wrapper that qualify as sections.
   * If the canvas was wrapped inside a single root tag (e.g. <main> or <header> or <div>),
   * traverses down to find all top-level sections.
   */
  private getSectionComponents(): any[] {
    const wrapper = this.editor.getWrapper();
    if (!wrapper) return [];

    let candidateChildren: any[] = wrapper.components()?.models || [];

    // If the entire page was wrapped inside a single root container, unwrap to find child sections
    if (candidateChildren.length === 1) {
      const singleChild = candidateChildren[0];
      const nestedChildren = singleChild.components?.()?.models || [];
      if (nestedChildren.length > 1) {
        candidateChildren = nestedChildren;
      }
    }

    const sections: any[] = [];
    for (const child of candidateChildren) {
      const tag = (child.get?.('tagName') || '').toLowerCase();
      // Exclude non-layout head/style/script tags
      if (tag === 'style' || tag === 'script' || tag === 'link' || tag === 'meta') continue;

      sections.push(child);
    }

    return sections;
  }

  getSectionsList(): { id: string; type: string; name: string; index: number }[] {
    const sectionComps = this.getSectionComponents();
    return sectionComps.map((comp: any, index: number) => {
      const type = comp.get?.('type') || comp.get?.('tagName') || 'section';
      const attrs = comp.get?.('attributes') || {};
      const cuzType = attrs['data-cuzmify-type'] || '';
      const id = attrs['id'] || '';
      const text = (comp.getEl?.()?.textContent || '').slice(0, 60).toLowerCase();
      
      const rawName = cuzType || id || comp.get?.('name') || type;
      let cleanName = rawName.replace(/^cuzmify-/, '').replace(/[-_]/g, ' ').toLowerCase();
      
      if (
        cleanName.includes('header') ||
        cleanName.includes('announcement') ||
        text.includes('available for') ||
        text.includes('artistry') ||
        text.includes('whatsapp active') ||
        (index === 0 && (cleanName === 'div' || cleanName === 'header' || cleanName === 'section'))
      ) {
        cleanName = 'Header Banner';
      }
      else if (cleanName.includes('navbar') || cleanName === 'nav') cleanName = 'Navigation Bar';
      else if (cleanName.includes('hero')) cleanName = 'Hero Suite';
      else if (cleanName.includes('about') || cleanName.includes('story')) cleanName = 'About Story';
      else if (cleanName.includes('service') || cleanName.includes('pricing') || cleanName.includes('catalog')) cleanName = 'Services & Pricing';
      else if (cleanName.includes('gallery') || cleanName.includes('portfolio') || cleanName.includes('work')) cleanName = 'Portfolio Gallery';
      else if (cleanName.includes('testimonial') || cleanName.includes('review')) cleanName = 'Client Reviews';
      else if (cleanName.includes('booking') || cleanName.includes('reserve')) cleanName = 'WhatsApp Booking';
      else if (cleanName.includes('product') || cleanName.includes('store') || cleanName.includes('shop')) cleanName = 'Products & Store';
      else if (cleanName.includes('cta') || cleanName.includes('action')) cleanName = 'Call To Action';
      else if (cleanName.includes('footer')) cleanName = 'Footer';
      else {
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }

      return {
        id: comp.cid || `comp-${index}`,
        type,
        name: cleanName.length > 2 ? cleanName : `Section ${index + 1}`,
        index,
      };
    });
  }

  /**
   * CORE MOVE OPERATION.
   *
   * Uses GrapesJS's native Backbone collection `remove()` + `add()` which:
   *   ✓ Automatically updates the iframe DOM view (no manual insertBefore)
   *   ✓ Preserves all inline styles, attributes, child components
   *   ✓ Is tracked by UndoManager (single undo step via batching)
   *   ✓ Does NOT trigger selection events
   *   ✓ Does NOT call editor.render() (no style stripping)
   */
  moveSectionTo(fromSectionIndex: number, toSectionIndex: number): void {
    const sections = this.getSectionComponents();

    if (
      fromSectionIndex < 0 ||
      fromSectionIndex >= sections.length ||
      toSectionIndex < 0 ||
      toSectionIndex >= sections.length ||
      fromSectionIndex === toSectionIndex
    ) {
      return;
    }

    const sourceComp = sections[fromSectionIndex];
    const destComp = sections[toSectionIndex];
    const wrapper = this.editor.getWrapper();
    const collection = wrapper?.components();
    if (!collection || !sourceComp || !destComp) return;

    try {
      // 1. Move the DOM element in the live iframe first
      const sourceEl = sourceComp.getEl?.();
      const destEl = destComp.getEl?.();

      if (sourceEl && destEl && destEl.parentNode) {
        if (fromSectionIndex < toSectionIndex) {
          // Moving DOWN: insert after destEl
          destEl.parentNode.insertBefore(sourceEl, destEl.nextSibling);
        } else {
          // Moving UP: insert before destEl
          destEl.parentNode.insertBefore(sourceEl, destEl);
        }
      }

      // 2. Re-order collection.models array in place using exact arrayMove
      const models = [...(collection.models || [])];
      const fromIdx = models.indexOf(sourceComp);
      const toIdx = models.indexOf(destComp);

      if (fromIdx !== -1 && toIdx !== -1) {
        const [movedItem] = models.splice(fromIdx, 1);
        models.splice(toIdx, 0, movedItem);
        collection.models = models;
      }

      // 3. Trigger safe custom change event for listeners
      this.editor.trigger('cuzmify:change');
    } catch (err) {
      console.error('[GrapesAdapter] Error moving section:', err);
    }
  }

  moveSectionUp(sectionIndex: number): void {
    if (sectionIndex <= 0) return;
    this.moveSectionTo(sectionIndex, sectionIndex - 1);
  }

  moveSectionDown(sectionIndex: number): void {
    const sections = this.getSectionComponents();
    if (sectionIndex < 0 || sectionIndex >= sections.length - 1) return;
    this.moveSectionTo(sectionIndex, sectionIndex + 1);
  }

  removeSection(sectionIndex: number): void {
    const sections = this.getSectionComponents();
    if (sectionIndex < 0 || sectionIndex >= sections.length) return;

    const comp = sections[sectionIndex];
    try {
      const el = comp.getEl?.();
      el?.remove();
      comp.remove();
      this.editor.trigger('cuzmify:change');
    } catch (err) {
      console.error('[GrapesAdapter] Error removing section:', err);
    }
  }

  selectSectionByIndex(sectionIndex: number): void {
    const sections = this.getSectionComponents();
    if (sectionIndex < 0 || sectionIndex >= sections.length) return;

    const comp = sections[sectionIndex];
    this.editor.select(comp);

    try {
      const el = comp.getEl();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // scroll bypass
    }
  }

  addBlock(blockId: string): void {
    const block = this.editor.BlockManager.get(blockId);
    if (!block) return;

    const content = block.getContent();
    if (!content) return;
    const wrapper = this.editor.getWrapper();

    if (wrapper) {
      wrapper.append(content as any);
      const children = wrapper.components()?.models || [];
      const addedComp = children[children.length - 1];
      if (addedComp) {
        this.editor.select(addedComp);
        try {
          const el = addedComp.getEl();
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch {
          // ignore
        }
      }
    } else {
      this.editor.addComponents(content as any);
    }
  }

  // ── Preview mode ──────────────────────────────────────────────────────────
  enablePreview(): void {
    this.editor.runCommand('core:preview');
  }

  disablePreview(): void {
    this.editor.stopCommand('core:preview');
  }

  destroy(): void {
    // Cleanup canvas listeners
    try {
      const cleanup = (this.editor as any).__cuzmifyCanvasListenersCleanup;
      if (cleanup) cleanup();
    } catch {}
    this.editor.destroy();
  }
}
