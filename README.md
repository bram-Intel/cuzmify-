# Cuzmify — Mobile-First Portfolio & Booking Websites for Service Vendors

> **One-Sentence Summary:** *Cuzmify turns a service vendor’s Instagram into a fast, professional portfolio and booking website in 3 minutes—right from their phone.*

---

## 1. Architecture Overview

Cuzmify separates **Owner Data**, **Service Niche**, and **Visual Design** into three clean layers so vendors can switch templates or niches anytime without losing a single photo, bio edit, or service rate:

1. **Layer 1 — Owner Facts (`BusinessBlueprint` in `src/core/blueprint-schema.ts`, persisted on `Site.blueprintData`)**
   - Stores only the vendor's real business facts: `profile` (name, bio, tagline, city, currency, social handles), `mediaVault` (imported Instagram images, carousel children, Reels, or compressed WebP uploads), `modules.services.items` (`fixed`, `starting_at`, or `quote` pricing—never invented placeholder prices), and `modules.whatsapp`.
2. **Layer 2 — Reusable Niche Blueprints (`src/core/niche-blueprints.ts`)**
   - Maps service categories (`beauty_makeup`, `photography_media`, `events_planning`, `catering_cakes`, `design_fashion`, `general_services`) to domain-appropriate section headings, CTA labels, and WhatsApp enquiry templates.
3. **Layer 3 — Lossless Template Engines (`src/core/template-engines.ts` + Desktop GrapesJS)**
   - Pure deterministic renderers (`editorial-atelier`, `noir-showcase`, `modern-studio`) that turn `BusinessBlueprint + NicheBlueprint` into fast, self-contained responsive HTML/CSS loading at most 2 Google Fonts.
   - **Mobile (`<1024px`):** Renders `MobilePreviewPane` + `StudioInfrastructureHub` sheet tabs for smooth 60fps phone editing.
   - **Desktop (`>=1024px`):** Loads the full GrapesJS visual canvas with `data-cuzmify-field` and `data-cuzmify-target-id` bindings (`syncBlueprintFromCanvas`) so inline canvas text/image edits sync back into `BusinessBlueprint` before template switches.
4. **Non-Expiring Instagram Media Proxy (`src/app/api/media/ig/route.ts`)**
   - Meta CDN URLs (`scontent*.cdninstagram.com?...&oe=<hex>`) expire after a few days. Cuzmify exchanges OAuth codes for 60-day long-lived tokens and serves IG media through `/api/media/ig?siteId=...&mediaId=...`, transparently refreshing expired URLs and tokens via the Instagram Graph API.
5. **Public Enquiry & WhatsApp Runtime (`src/components/public-site/PublicEnquiryRuntime.tsx`)**
   - Lightweight (`<2KB`) client runtime mounted on `/s/[domain]` and custom domains. Intercepts service booking buttons, logs structured leads (`Enquiry` model) via `/api/enquiries`, surfaces them in the vendor's `/dashboard` Enquiry Inbox, and opens a pre-filled WhatsApp message to the vendor.

---

## 2. Local Setup

### Prerequisites
- Node.js `>= 20`
- PostgreSQL database (Supabase recommended)

### Install & Run
```bash
npm install
npx prisma generate
npm run db:push
npm run dev
```

### Verification Commands
```bash
npm run typecheck   # Strict TypeScript check (0 errors)
npm run test:run    # Vitest unit & integration suite
npm run build       # Prisma generate + safe-db-push + Next.js production build
```

---

## 3. Environment Variables

Create `.env` or `.env.local` (and configure the same variables in Vercel Project Settings):

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | PostgreSQL pooled connection string (e.g. Supabase PgBouncer port `6543` with `?pgbouncer=true`) |
| `DIRECT_URL` | **Yes** | PostgreSQL direct connection string (port `5432`) for `prisma db push` |
| `NEXTAUTH_SECRET` | **Yes** | Random 32+ byte secret for signing NextAuth JWTs & fallback Pro activation codes |
| `NEXTAUTH_URL` | **Yes** | Canonical app URL (`http://localhost:3000` locally, `https://cuzmify.vercel.app` in prod) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth Sign-In client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth Sign-In client secret |
| `INSTAGRAM_CLIENT_ID` | **Yes (IG)** | Meta Developer App Instagram App ID (`instagram_business_basic` scope only) |
| `INSTAGRAM_CLIENT_SECRET` | **Yes (IG)** | Meta Developer App Instagram App Secret |
| `INSTAGRAM_REDIRECT_URI` | Optional | Defaults to `${origin}/api/auth/instagram/callback` |
| `FOUNDER_ADMIN_SECRET` | Recommended | Secret used by `scripts/generate-pro-code.mjs` to sign per-site `PRO-XXXXXXXX` unlock codes |
| `PRO_ACTIVATION_CODES` | Optional | Comma-separated promo/master codes (e.g. `FOUNDER2026,VIPPRO`) |
| `NEXT_PUBLIC_FOUNDER_WHATSAPP` | Recommended | Founder WhatsApp number in international digits (e.g. `2348012345678`) for Pro bank-transfer concierge |
| `NEXT_PUBLIC_FOUNDER_BANK_INFO` | Optional | Bank transfer instructions displayed when Paystack keys are not yet configured |
| `PAYSTACK_SECRET_KEY` | Optional | Add `sk_live_...` or `sk_test_...` anytime to enable automatic self-serve Paystack card/bank/USSD checkout |
| `VERCEL_AUTH_TOKEN` | Optional | Vercel Personal Access Token to auto-attach custom `.com` / `.com.ng` domains to your Vercel project |
| `VERCEL_PROJECT_ID` | Optional | Vercel Project ID (`prj_...`) for automated custom domain attachment |
| `VERCEL_TEAM_ID` | Optional | Vercel Team ID (`team_...`) if deployed under a Vercel team |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Optional | Set once you attach a root domain (e.g. `cuzmify.com`) with wildcard DNS (`*.cuzmify.com`) |

---

## 4. Deploy & Monetization Operations Guide

### A. Unpausing Supabase Free Tier
Supabase pauses free-tier PostgreSQL databases after 7 days of inactivity (`ENOTFOUND postgres.<ref>`).
1. Open your Supabase Dashboard -> click **Restore Project** (takes ~60 seconds).
2. Run `npm run db:push` locally (or trigger a Vercel redeploy—`scripts/safe-db-push.mjs` automatically syncs the Prisma schema during `npm run build` whenever the DB is reachable).

### B. Charging Customers Immediately (Before CAC / Paystack Keys)
Cuzmify's Dual-Mode Billing lets you charge **₦4,000/mo** or **₦30,000/yr** from Day 1:
1. Set `NEXT_PUBLIC_FOUNDER_WHATSAPP` and `NEXT_PUBLIC_FOUNDER_BANK_INFO` in Vercel.
2. When a vendor clicks **Upgrade to Pro** inside Studio -> **Domain & Pro**, they see your bank details and a 1-tap WhatsApp button that sends you their **Site ID**.
3. Once you confirm their bank transfer, generate their unique signed unlock code locally:
   ```bash
   node scripts/generate-pro-code.mjs <siteId>
   ```
4. Reply with the `PRO-XXXXXXXX` code on WhatsApp. They paste it into Studio and Pro unlocks immediately (custom domain input enabled, `"Built with Cuzmify"` badge removed, unlimited service packages).
5. **Switching to Self-Serve Paystack:** Note that Paystack Nigeria also offers a **Starter Business** tier (BVN + NIN + personal bank account—no CAC required up to ₦2,000,000 cumulative collections). As soon as you add `PAYSTACK_SECRET_KEY` in Vercel and set your Paystack Webhook URL to `https://<your-domain>/api/billing/paystack/webhook`, self-serve checkout activates automatically with zero code changes.

---

## 5. How to Add a Niche Blueprint

Open `src/core/niche-blueprints.ts` and add a new entry to `NICHE_BLUEPRINTS` (and add its union key to `NicheId`):

```ts
interior_styling: {
  id: 'interior_styling',
  label: 'Interior Designers & Stylists',
  shortLabel: 'Interior Design',
  subtitle: 'Residential stylists, decorators & commercial space planners',
  recommendedTemplate: 'editorial-atelier',
  vocabulary: {
    portfolioEyebrow: 'Portfolio',
    portfolioHeading: 'Selected Spaces',
    servicesEyebrow: 'Consultations & Rates',
    servicesHeading: 'Design Packages',
    aboutEyebrow: 'About the Studio',
    enquiryEyebrow: 'Enquiries',
    enquiryHeading: 'Request a Design Consultation',
    enquirySubheading: 'Share your project scope and timeline—we will reply on WhatsApp.',
    primaryCta: 'Book Consultation',
    serviceItemCta: 'Enquire About Package',
    servicePlaceholderName: 'e.g. Full Room Styling Consultation',
    servicePlaceholderDesc: 'e.g. Moodboard, furniture sourcing & layout plan',
  },
  enquiryFields: [
    { name: 'eventDate', label: 'Target Project Date', placeholder: 'Select date', type: 'date' },
    { name: 'location', label: 'City / Area', placeholder: 'e.g. Victoria Island, Lagos', type: 'text' },
    { name: 'notes', label: 'Project Scope', placeholder: 'Room count, style goals, or budget range', type: 'textarea' },
  ],
}
```
The Onboarding Wizard, Landing Page, and Studio Niche Switcher read `NICHE_LIST` automatically—no UI rewrites needed.

---

## 6. How to Add a Template Engine

Open `src/core/template-engines.ts`:
1. Add the new template ID (e.g. `'minimal-mono'`) to `TemplateEngineId`.
2. Write a pure renderer function `(bp: BusinessBlueprint, niche: NicheBlueprint, siteId?: string) => { html: string; css: string }` that:
   - Uses `bp.profile`, `bp.mediaVault` (via `resolveAssetUrl(asset, siteId)` so Instagram URLs stay self-healing), and `bp.modules.services.items` (via `formatServicePrice(srv, currencySymbol)`).
   - Preserves `data-cuzmify-field="name|tagline|bio"` on text elements and `data-cuzmify-module="service-card"` + `data-cuzmify-service-id="${srv.id}"` on service cards so desktop GrapesJS inline edits remain lossless.
   - Emits `data-cuzmify-enquire="open"` (and optional `data-service-name` / `data-service-price`) on booking buttons so `PublicEnquiryRuntime` opens the live enquiry modal automatically.
3. Register its `TemplateEngineMeta` (`swatches`, `tagline`, `vibe`, and `googleFontsUrl` with `<= 2` font families for fast 3G/4G loading) in `TEMPLATE_ENGINES`.

---

## 7. Parked Features List (`src/_parked/`)

Per strict MVP scope discipline, unfinished or non-MVP surfaces were moved intact into `src/_parked/` (excluded from TypeScript build, never deleted) so they can be revived post-traction:

| Parked Path | Original Feature | Why Parked for MVP |
| :--- | :--- | :--- |
| `src/_parked/marketplace/` | Template & Module Marketplace (`MarketplaceGrid`, `ProductCard`) | Two-sided marketplaces require supply/demand scale; 3 curated lossless templates solve vendor choice immediately. |
| `src/_parked/importer/` | Existing Website URL Scraper/Revamper (`RevampUrlForm`, `website-importer.ts`) | Target Nigerian/emerging-market service vendors run on Instagram + WhatsApp and rarely have an existing website to scrape. |
| `src/_parked/legacy-editor/` | Early React `LivePreview` / `VisualControls` (`/editor` prototype) | Superseded by `StudioInfrastructureHub` + `MobilePreviewPane` + GrapesJS Studio (`/studio`). |
| `src/_parked/templates/` | Hardcoded single-niche `GmakeupBeautyTemplate` & `BeautyProTemplate` | Replaced by reusable multi-niche `src/core/niche-blueprints.ts` + `src/core/template-engines.ts`. |
| `src/_parked/services/` | Mock `deployment-orchestrator.ts` & RSA `license-service.ts` | Replaced by real `/s/[domain]` edge serving and live Vercel Custom Domains API (`/api/domains`). |

---

## 8. Meta / Instagram App Review & Live Mode Checklist

Use these exact URLs inside **Meta for Developers → App (`INSTAGRAM_CLIENT_ID`)**:

| Meta Field | Exact Value to Paste |
| :--- | :--- |
| **App Domains** | `cuzmify.vercel.app` |
| **Privacy Policy URL** | `https://cuzmify.vercel.app/privacy` |
| **Terms of Service URL** | `https://cuzmify.vercel.app/terms` |
| **Data Deletion Instructions URL** | `https://cuzmify.vercel.app/data-deletion` |
| **Data Deletion Callback URL** | `https://cuzmify.vercel.app/api/auth/instagram/data-deletion` |
| **Deauthorize Callback URL** | `https://cuzmify.vercel.app/api/auth/instagram/deauthorize` |
| **Valid OAuth Redirect URIs** | `https://cuzmify.vercel.app/api/auth/instagram/callback` |
| **Requested Permission Scope** | `instagram_business_basic` (only this one permission) |

**Vercel Environment Variable Check:** Ensure `INSTAGRAM_REDIRECT_URI` on Vercel is either unset (dynamic `${origin}`) or explicitly set to `https://cuzmify.vercel.app/api/auth/instagram/callback`—never `http://localhost:3000/...`.

