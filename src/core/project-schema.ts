import { AIThemeConfig, BusinessCategory, CuzmifyModuleType } from './types';

// ─── Extended Project Schema ─────────────────────────────────────────────────

export type ThemeName =
  | 'luxury'
  | 'modern'
  | 'minimal'
  | 'editorial'
  | 'bram-light'
  | 'dark-obsidian'
  | 'apple-luxury'
  | 'google-material'
  | 'vibrant'
  | 'dark-elegance';

export interface DesignToken {
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  colorBackground: string;
  colorSurface: string;
  colorText: string;
  colorTextMuted: string;
  colorBorder: string;
  fontHeading: string;
  fontBody: string;
  radiusCard: string;
  radiusButton: string;
  shadowCard: string;
}

export interface CuzmifyPage {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
}

export interface CuzmifySection {
  id: string;
  type: CuzmifySectionType;
  props: Record<string, unknown>;
  order: number;
  visible: boolean;
}

export type CuzmifySectionType =
  | 'hero'
  | 'about'
  | 'services'
  | 'gallery'
  | 'testimonials'
  | 'booking'
  | 'contact'
  | 'cta'
  | 'navbar'
  | 'footer';

export interface CuzmifyProject {
  id: string;
  businessName: string;
  category: BusinessCategory;
  theme: ThemeName;
  tokens: DesignToken;
  pages: CuzmifyPage[];
  sections: CuzmifySection[];
  activeModules: CuzmifyModuleType[];
  grapesProjectData?: Record<string, unknown>; // raw GrapesJS JSON
  lastSaved?: string;
  isDirty: boolean;
}

// ─── AI Intent Types ─────────────────────────────────────────────────────────

export type AIActionType =
  | 'SET_THEME'
  | 'UPDATE_TOKENS'
  | 'UPDATE_COPY'
  | 'REORDER_SECTIONS'
  | 'UPDATE_SECTION'
  | 'ADD_MODULE'
  | 'REMOVE_MODULE'
  | 'SET_HERO_IMAGE'
  | 'GENERATE_COPY';

export interface AIAction {
  type: AIActionType;
  label: string; // human-readable description for preview
  payload: Record<string, unknown>;
}

export interface AIIntentResult {
  actions: AIAction[];
  summary: string;
  confidence: 'high' | 'medium' | 'low';
}

// ─── Re-export existing types ─────────────────────────────────────────────────
export type {
  AIThemeConfig,
  BusinessCategory,
  CuzmifyModuleType,
  ModuleDefinition,
  WebsiteImportResult,
} from './types';
