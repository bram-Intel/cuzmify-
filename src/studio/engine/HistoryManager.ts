import type { ThemeName } from '@/core/project-schema';

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  description: string;
  source: 'ai_transform' | 'theme_change' | 'manual_edit' | 'section_reorder' | 'block_insert' | 'code_edit' | 'initial';
  html: string;
  css: string;
  theme: ThemeName;
  grapesData?: Record<string, unknown>;
}

export type HistoryChangeListener = (state: { canUndo: boolean; canRedo: boolean; description?: string }) => void;

export class HistoryManager {
  private past: HistorySnapshot[] = [];
  private current: HistorySnapshot | null = null;
  private future: HistorySnapshot[] = [];
  private maxDepth = 50;
  private listeners: HistoryChangeListener[] = [];
  private isRestoring = false;

  constructor(maxDepth = 50) {
    this.maxDepth = maxDepth;
  }

  public get isPerformingRestore(): boolean {
    return this.isRestoring;
  }

  /**
   * Initializes or records a new immutable snapshot in the timeline
   */
  public push(snapshot: HistorySnapshot): void {
    if (this.isRestoring) return;

    // Avoid duplicate pushes if the content is identical
    if (this.current && this.current.html === snapshot.html && this.current.theme === snapshot.theme && this.current.css === snapshot.css) {
      return;
    }

    if (this.current) {
      this.past.push(this.current);
      if (this.past.length > this.maxDepth) {
        this.past.shift(); // circular buffer limit
      }
    }

    this.current = snapshot;
    this.future = []; // Clear forward buffer on any new user action
    this.notify();
  }

  /**
   * Navigates backward in history
   */
  public undo(): HistorySnapshot | null {
    if (this.past.length === 0 || !this.current) {
      return null;
    }

    this.isRestoring = true;
    try {
      const previous = this.past.pop()!;
      this.future.push(this.current);
      this.current = previous;
      this.notify();
      return previous;
    } finally {
      this.isRestoring = false;
    }
  }

  /**
   * Navigates forward in history
   */
  public redo(): HistorySnapshot | null {
    if (this.future.length === 0 || !this.current) {
      return null;
    }

    this.isRestoring = true;
    try {
      const next = this.future.pop()!;
      this.past.push(this.current);
      this.current = next;
      this.notify();
      return next;
    } finally {
      this.isRestoring = false;
    }
  }

  public canUndo(): boolean {
    return this.past.length > 0;
  }

  public canRedo(): boolean {
    return this.future.length > 0;
  }

  public getCurrentSnapshot(): HistorySnapshot | null {
    return this.current;
  }

  public getPastCount(): number {
    return this.past.length;
  }

  public getFutureCount(): number {
    return this.future.length;
  }

  public clear(): void {
    this.past = [];
    this.current = null;
    this.future = [];
    this.notify();
  }

  public onChange(listener: HistoryChangeListener): () => void {
    this.listeners.push(listener);
    listener({ canUndo: this.canUndo(), canRedo: this.canRedo(), description: this.current?.description });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const state = {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      description: this.current?.description,
    };
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.error('[HistoryManager] Listener error:', err);
      }
    });
  }
}
