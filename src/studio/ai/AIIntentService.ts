import type { AIAction, AIIntentResult } from '@/core/project-schema';
import type { ThemeName } from '@/core/project-schema';

interface Intent {
  keywords: string[];
  actions: AIAction[];
  summary: string;
}

const INTENT_MAP: Intent[] = [
  {
    keywords: ['luxury', 'premium', 'high-end', 'elegant', 'upscale', 'rich', 'gold'],
    actions: [
      { type: 'SET_THEME', label: 'Switch theme to Luxury', payload: { theme: 'luxury' as ThemeName } },
      { type: 'UPDATE_COPY', label: 'Update headline tone to luxury', payload: { field: 'heroHeadline', value: 'Exquisite Glamour & Bespoke Artistry for Discerning Clients' } },
    ],
    summary: 'Applied Luxury theme with rich dark tones, gold accents and refined typography.',
  },
  {
    keywords: ['bridal', 'wedding', 'bride'],
    actions: [
      { type: 'UPDATE_COPY', label: 'Update hero headline for bridal', payload: { field: 'heroHeadline', value: 'The Bridal Artistry Studio — Where Forever Begins' } },
      { type: 'UPDATE_COPY', label: 'Update hero subtitle for bridal', payload: { field: 'heroSubheadline', value: 'Bespoke bridal transformations crafted for your most unforgettable day.' } },
      { type: 'UPDATE_SECTION', label: 'Highlight Bridal service first', payload: { sectionId: 'services', priority: 'bridal' } },
    ],
    summary: 'Refocused the website around bridal services with updated copy and service priority.',
  },
  {
    keywords: ['dark', 'night', 'obsidian', 'cyber', 'moody', 'black'],
    actions: [
      { type: 'SET_THEME', label: 'Switch theme to Dark Obsidian', payload: { theme: 'dark-obsidian' as ThemeName } },
    ],
    summary: 'Applied Dark Obsidian theme with deep navy tones and neon teal highlights.',
  },
  {
    keywords: ['minimal', 'clean', 'simple', 'white', 'light'],
    actions: [
      { type: 'SET_THEME', label: 'Switch theme to Minimal', payload: { theme: 'minimal' as ThemeName } },
      { type: 'UPDATE_COPY', label: 'Simplify headline', payload: { field: 'heroHeadline', value: 'Clean Beauty. Effortless Confidence.' } },
    ],
    summary: 'Applied Minimal light theme with clean typography and refined whitespace.',
  },
  {
    keywords: ['editorial', 'magazine', 'fashion', 'vogue', 'bold'],
    actions: [
      { type: 'SET_THEME', label: 'Switch to Editorial theme', payload: { theme: 'editorial' as ThemeName } },
      { type: 'UPDATE_COPY', label: 'Update to editorial headline', payload: { field: 'heroHeadline', value: 'The Art of Beauty. Refined.' } },
    ],
    summary: 'Applied Editorial theme with high-contrast serif typography and warm gold accents.',
  },
  {
    keywords: ['vibrant', 'pink', 'colorful', 'fun', 'playful', 'bright'],
    actions: [
      { type: 'SET_THEME', label: 'Switch to Vibrant theme', payload: { theme: 'vibrant' as ThemeName } },
    ],
    summary: 'Applied Vibrant theme with bold pinks, purples and energetic gradients.',
  },
  {
    keywords: ['booking', 'appointment', 'schedule', 'book'],
    actions: [
      { type: 'UPDATE_COPY', label: 'Emphasize booking CTA', payload: { field: 'ctaText', value: 'Book Your Session Now' } },
    ],
    summary: 'Strengthened booking call-to-action and booking form prominence.',
  },
  {
    keywords: ['whatsapp', 'contact', 'chat', 'message'],
    actions: [
      { type: 'UPDATE_COPY', label: 'Add WhatsApp CTA', payload: { field: 'ctaText', value: 'Chat on WhatsApp' } },
    ],
    summary: 'Made WhatsApp contact the primary call to action.',
  },
  {
    keywords: ['modern', 'contemporary', 'fresh', 'new'],
    actions: [
      { type: 'SET_THEME', label: 'Apply Modern theme', payload: { theme: 'modern' as ThemeName } },
    ],
    summary: 'Applied Modern theme with indigo tones and clean sans-serif typography.',
  },
];

export class AIIntentService {
  static parseIntent(prompt: string): AIIntentResult {
    const lower = prompt.toLowerCase();
    const matched: Intent[] = [];

    for (const intent of INTENT_MAP) {
      if (intent.keywords.some((kw) => lower.includes(kw))) {
        matched.push(intent);
      }
    }

    if (matched.length === 0) {
      // Fallback: try to match any theme name directly
      const themeNames: ThemeName[] = ['luxury', 'modern', 'minimal', 'editorial', 'vibrant', 'dark-obsidian', 'bram-light', 'apple-luxury'];
      for (const t of themeNames) {
        if (lower.includes(t)) {
          return {
            actions: [{ type: 'SET_THEME', label: `Apply ${t} theme`, payload: { theme: t } }],
            summary: `Applying the ${t} design theme.`,
            confidence: 'medium',
          };
        }
      }

      return {
        actions: [],
        summary: "I understand you want changes, but I need a bit more detail. Try: 'make it more luxurious', 'apply a dark theme', or 'focus on bridal services'.",
        confidence: 'low',
      };
    }

    // Deduplicate actions
    const seen = new Set<string>();
    const allActions: AIAction[] = [];
    for (const intent of matched) {
      for (const action of intent.actions) {
        const key = `${action.type}:${JSON.stringify(action.payload)}`;
        if (!seen.has(key)) {
          seen.add(key);
          allActions.push(action);
        }
      }
    }

    const summaries = matched.map((m) => m.summary).join(' ');

    return {
      actions: allActions,
      summary: summaries,
      confidence: matched.length > 0 ? 'high' : 'medium',
    };
  }

  static applyActions(
    actions: AIAction[],
    callbacks: {
      onSetTheme?: (theme: ThemeName) => void;
      onUpdateCopy?: (field: string, value: string) => void;
      onUpdateSection?: (sectionId: string, props: Record<string, unknown>) => void;
    }
  ): void {
    for (const action of actions) {
      switch (action.type) {
        case 'SET_THEME':
          callbacks.onSetTheme?.(action.payload.theme as ThemeName);
          break;
        case 'UPDATE_COPY':
          callbacks.onUpdateCopy?.(action.payload.field as string, action.payload.value as string);
          break;
        case 'UPDATE_SECTION':
          callbacks.onUpdateSection?.(action.payload.sectionId as string, action.payload);
          break;
        default:
          break;
      }
    }
  }
}
