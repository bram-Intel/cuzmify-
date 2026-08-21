/**
 * Cuzmify Spotless Responsive Core Stylesheet
 * Single source of truth for fluid typography, auto-stacking grids, and mobile-first safety.
 */
export const RESPONSIVE_CORE_CSS = `
  /* ── Universal Reset & Safety ── */
  *, *::before, *::after {
    box-sizing: border-box !important;
    -webkit-tap-highlight-color: transparent;
  }
  html, body {
    max-width: 100vw !important;
    overflow-x: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1A202C;
    background-color: #FFFFFF;
    -webkit-font-smoothing: antialiased;
  }
  a { text-decoration: none; color: inherit; }
  img, video, iframe { max-width: 100% !important; height: auto !important; display: block; }

  /* ── Tablet Breakpoint (max-width: 992px) ── */
  @media (max-width: 992px) {
    section {
      padding: 60px 24px !important;
    }
  }

  /* ── Mobile Breakpoints (max-width: 768px) ── */
  @media (max-width: 768px) {
    /* 1. Announcement Bar: Clean single-column centered ticker */
    div[style*="background:#083D50"], 
    div[style*="background: #083D50"],
    .cuzmify-announcement-bar {
      padding: 8px 12px !important;
      font-size: 10px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      gap: 4px !important;
      width: 100% !important;
    }
    div[style*="background:#083D50"] > div:last-child,
    div[style*="background: #083D50"] > div:last-child {
      font-size: 9px !important;
      opacity: 0.9 !important;
    }

    /* 2. Navbar: Spotless 2-item header (Brand Name + CTA) */
    nav, nav[data-cuzmify-type="navbar"], nav[data-brand] {
      padding: 12px 16px !important;
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
      width: 100% !important;
      box-sizing: border-box !important;
      position: sticky !important;
      top: 0 !important;
      z-index: 999 !important;
      background: rgba(255, 255, 255, 0.98) !important;
    }

    /* Brand Logo & Name: Single-line, never wraps into 2 lines */
    nav [data-cuzmify-field="business-name"], 
    nav .brand-name,
    nav span[style*="font-weight:900"],
    nav span[style*="font-weight: 900"],
    nav span[style*="Playfair"] {
      font-size: 1.05rem !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 180px !important;
      display: inline-block !important;
      line-height: 1.2 !important;
      letter-spacing: 0.02em !important;
    }

    /* Hide PRO CERTIFIED sub-badge on mobile header */
    nav span[style*="rgba(245,158,11"],
    nav span[style*="rgba(245, 158, 11"] {
      display: none !important;
    }

    /* Hide desktop links container on mobile */
    nav .nav-links,
    nav > div:nth-child(2),
    nav div[style*="gap:28px"],
    nav div[style*="gap: 28px"],
    nav div[style*="gap:32px"],
    nav div[style*="gap: 32px"] {
      display: none !important;
    }

    /* Clean mobile CTA button */
    nav a[data-cuzmify-action],
    nav a[href="#booking"],
    nav .nav-cta {
      padding: 8px 14px !important;
      font-size: 11px !important;
      white-space: nowrap !important;
      border-radius: 8px !important;
      margin: 0 !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: auto !important;
      flex-shrink: 0 !important;
    }

    /* 3. Section Spacing on Mobile */
    section {
      padding: 40px 16px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    /* 4. Fluid Typography on Mobile */
    h1, [data-cuzmify-field="headline"] {
      font-size: clamp(1.65rem, 6.5vw, 2.25rem) !important;
      line-height: 1.15 !important;
      letter-spacing: -0.02em !important;
      word-break: normal !important;
    }
    h2, [data-cuzmify-field="section-title"] {
      font-size: clamp(1.35rem, 5.5vw, 1.75rem) !important;
      line-height: 1.2 !important;
      word-break: normal !important;
    }
    p, [data-cuzmify-field="subheadline"] {
      font-size: 0.925rem !important;
      line-height: 1.6 !important;
    }

    /* 5. Auto-Stacking Grids into Single-Column Cards */
    section > div > div:last-child,
    section > div > div:nth-child(2),
    section div[style*="display:grid"],
    section div[style*="display: grid"],
    section [style*="grid-template-columns"],
    .cuzmify-grid,
    section[data-cuzmify-type="services"] div[style*="grid"],
    section#services div[style*="grid"],
    section[data-cuzmify-type="products"] div[style*="grid"],
    section#store div[style*="grid"],
    section[data-cuzmify-type="about"] div[style*="grid"],
    section#about div[style*="grid"],
    section[data-cuzmify-type="testimonials"] div[style*="grid"] {
      grid-template-columns: 1fr !important;
      display: grid !important;
      gap: 16px !important;
      width: 100% !important;
      box-sizing: border-box !important;
    }

    /* Force all service and product cards to 100% full-width on mobile */
    section[data-cuzmify-type="services"] div[style*="border-radius"],
    section#services div[style*="border-radius"],
    section[data-cuzmify-type="products"] div[style*="border-radius"],
    section#store div[style*="border-radius"],
    section[data-cuzmify-type="about"] div[style*="border-radius"],
    section#about div[style*="border-radius"],
    section[data-cuzmify-type="testimonials"] div[style*="border-radius"] {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      padding: 20px 16px !important;
    }

    /* Service card title & price row */
    section[data-cuzmify-type="services"] div[style*="display:flex"],
    section#services div[style*="display:flex"],
    section[data-cuzmify-type="services"] div[style*="display: flex"],
    section#services div[style*="display: flex"] {
      display: flex !important;
      align-items: flex-start !important;
      justify-content: space-between !important;
      gap: 10px !important;
      width: 100% !important;
    }

    section[data-cuzmify-type="services"] h3,
    section#services h3,
    section[data-cuzmify-type="products"] h3,
    section#store h3 {
      font-size: 1.05rem !important;
      line-height: 1.3 !important;
      margin: 8px 0 6px 0 !important;
      word-break: normal !important;
    }

    section[data-cuzmify-type="services"] p,
    section#services p,
    section[data-cuzmify-type="products"] p,
    section#store p {
      font-size: 0.85rem !important;
      line-height: 1.6 !important;
    }

    /* 6. Luxury 2-Column Photo Gallery on Mobile */
    section[data-cuzmify-type="gallery"] div[style*="grid-template-columns"],
    section#portfolio div[style*="grid-template-columns"],
    section[data-cuzmify-type="gallery"] > div > div:last-child,
    section#portfolio > div > div:last-child {
      grid-template-columns: repeat(2, 1fr) !important;
      display: grid !important;
      gap: 8px !important;
    }

    /* 7. Hero Section Mobile Stacking */
    section[data-cuzmify-type="hero"] {
      display: flex !important;
      flex-direction: column !important;
      padding: 36px 16px !important;
      gap: 28px !important;
      text-align: center !important;
    }

    section[data-cuzmify-type="hero"] > div:first-child {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    section[data-cuzmify-type="hero"] > div:last-child {
      width: 100% !important;
      max-width: 100% !important;
    }

    section[data-cuzmify-type="hero"] img {
      width: 100% !important;
      height: 320px !important;
      object-fit: cover !important;
    }

    section[data-cuzmify-type="hero"] a {
      width: 100% !important;
      justify-content: center !important;
      text-align: center !important;
    }

    /* 8. Booking Form Container on Mobile */
    section[data-cuzmify-type="booking"] > div,
    section#booking > div {
      padding: 24px 16px !important;
      border-radius: 20px !important;
      width: 100% !important;
    }

    section[data-cuzmify-type="booking"] input,
    section[data-cuzmify-type="booking"] select,
    section#booking input,
    section#booking select {
      width: 100% !important;
      font-size: 15px !important;
      height: 48px !important;
    }

    /* Floating Cart Pill on Mobile */
    [data-cuzmify-type="cart-pill"],
    div[style*="bottom:24px;right:24px"],
    div[style*="bottom: 24px; right: 24px"] {
      bottom: 16px !important;
      right: 16px !important;
    }
  }
`;
