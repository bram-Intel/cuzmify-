import type { EditorAdapter } from './EditorAdapter';
import type { Breakpoint } from './EditorContext';
import type { BusinessBlueprint } from '@/core/blueprint-schema';
import { renderTemplateEngine, resolveTemplateEngineId } from '@/core/template-engines';

/**
 * Lightweight pure-JS EditorAdapter used on mobile (<1024px) so mobile Studio
 * never downloads or initializes GrapesJS or parses hidden iframe DOM trees.
 * Renders HTML cleanly on-demand via the Lossless Template Engine only when requested (e.g. AI/Publish).
 */
export class HeadlessBlueprintAdapter implements EditorAdapter {
  public readonly isHeadless = true;
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private htmlOverride = '';
  private cssOverride = '';
  private projectData: Record<string, unknown> = {};
  private getBlueprintFn: () => BusinessBlueprint;

  constructor(getBlueprintFn: () => BusinessBlueprint) {
    this.getBlueprintFn = getBlueprintFn;
  }

  getHtml(): string {
    if (this.htmlOverride) return this.htmlOverride;
    const bp = this.getBlueprintFn();
    const tplId = resolveTemplateEngineId(bp.templateId);
    return renderTemplateEngine(tplId, bp).fullHtml;
  }

  getCss(): string {
    if (this.cssOverride) return this.cssOverride;
    const bp = this.getBlueprintFn();
    const tplId = resolveTemplateEngineId(bp.templateId);
    return renderTemplateEngine(tplId, bp).css;
  }

  getProjectData(): Record<string, unknown> {
    return this.projectData;
  }

  loadProjectData(data: Record<string, unknown>): void {
    this.projectData = data || {};
  }

  setHtmlContent(html: string): void {
    this.htmlOverride = html || '';
  }

  undo(): void {}
  redo(): void {}
  canUndo(): boolean { return false; }
  canRedo(): boolean { return false; }
  setDevice(_device: Breakpoint): void {}
  getDevice(): string { return 'mobile'; }
  updateSelectedTrait(_key: string, _value: string): void {}
  updateSelectedStyle(_property: string, _value: string): void {}
  getSelectedStyle(_prop: string): string { return ''; }
  getAllSelectedStyles(): Record<string, string> { return {}; }
  getSelectedComponent() { return null; }
  selectComponent(_component: unknown): void {}
  deselectAll(): void {}
  replaceSelectedComponent(_newHtml: string): boolean { return false; }
  updateSelectedComponentText(_newText: string): void {}
  getSelectedComponentText(): string { return ''; }
  getSelectedComponentCanvasRect() { return null; }
  injectCanvasCSS(_css: string): void {}
  getDoc(): Document | null { return null; }
  traverseComponents(_cb: (comp: any) => void): void {}
  highlightSectionGlow(_sectionType: string): void {}
  updateSectionField(_sectionType: string, _field: string, _value: string): void {}
  getSectionsList(): {
    id: string;
    domId?: string;
    cuzmifyType?: string;
    slotId?: string;
    tagName?: string;
    type: string;
    name: string;
    index: number;
  }[] {
    return [];
  }
  moveSectionUp(_index: number): void {}
  moveSectionDown(_index: number): void {}
  moveSectionTo(_fromIndex: number, _toIndex: number): void {}
  removeSection(_index: number): void {}
  selectSectionByIndex(_index: number): void {}
  addBlock(_blockId: string): void {}
  enablePreview(): void {}
  disablePreview(): void {}
  sanitizeCanvas(): void {}

  triggerChange(): void {
    this.listeners.get('cuzmify:change')?.forEach((fn) => fn());
  }

  on(event: string, cb: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
  }

  off(event: string, cb: (...args: unknown[]) => void): void {
    this.listeners.get(event)?.delete(cb);
  }

  destroy(): void {
    this.listeners.clear();
  }
}
