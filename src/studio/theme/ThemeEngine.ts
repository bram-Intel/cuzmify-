import type { GrapesAdapter } from '../engine/GrapesAdapter';
import type { ThemeName } from '@/core/project-schema';
import { DESIGN_TOKENS, tokensToCSSVars } from './DesignTokens';

export class ThemeEngine {
  private adapter: GrapesAdapter;
  private currentTheme: ThemeName = 'bram-light';

  constructor(adapter: GrapesAdapter) {
    this.adapter = adapter;
  }

  applyTheme(name: ThemeName): void {
    this.currentTheme = name;
    const tokens = DESIGN_TOKENS[name];
    if (!tokens) return;

    const css = `:root { ${tokensToCSSVars(tokens)} }
body {
  background-color: var(--color-bg) !important;
  color: var(--color-text) !important;
  font-family: var(--font-body) !important;
}
h1, h2, h3, h4 {
  font-family: var(--font-heading) !important;
}`;

    this.adapter.injectCanvasCSS(css);
  }

  getCurrentTheme(): ThemeName {
    return this.currentTheme;
  }

  getAvailableThemes(): ThemeName[] {
    return Object.keys(DESIGN_TOKENS) as ThemeName[];
  }

  getTokens(name: ThemeName) {
    return DESIGN_TOKENS[name];
  }
}
