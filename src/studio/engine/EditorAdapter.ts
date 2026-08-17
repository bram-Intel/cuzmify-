import type { Breakpoint } from './EditorContext';

export interface EditorAdapter {
  getHtml(): string;
  getCss(): string;
  getProjectData(): Record<string, unknown>;
  loadProjectData(data: Record<string, unknown>): void;
  setHtmlContent(html: string): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  setDevice(device: Breakpoint): void;
  updateSelectedTrait(key: string, value: string): void;
  updateSelectedStyle(property: string, value: string): void;
  addBlock(blockId: string): void;
  enablePreview(): void;
  disablePreview(): void;
  destroy(): void;
  sanitizeCanvas(): void;
  on(event: string, cb: (...args: unknown[]) => void): void;
  off(event: string, cb: (...args: unknown[]) => void): void;
}
