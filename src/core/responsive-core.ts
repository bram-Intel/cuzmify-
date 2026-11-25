/**
 * Cuzmify Responsive Core Stylesheet
 * Provides universal box-sizing and horizontal overflow safety for all sites,
 * while scoping legacy DOM overrides strictly away from modern `[data-cuzmify-template]` engines.
 */
export const RESPONSIVE_CORE_CSS = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }
  html, body {
    max-width: 100vw;
    overflow-x: hidden;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  img, video, iframe {
    max-width: 100%;
    display: block;
  }

  /* Legacy AI-generated HTML fallback rules (never applied to modern Template Engines) */
  @media (max-width: 768px) {
    body:not(:has([data-cuzmify-template])) nav {
      padding: 12px 16px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
    }
    body:not(:has([data-cuzmify-template])) section {
      padding: 40px 16px !important;
    }
    body:not(:has([data-cuzmify-template])) section[data-cuzmify-type="hero"] {
      display: flex !important;
      flex-direction: column !important;
      gap: 24px !important;
    }
  }
`;
