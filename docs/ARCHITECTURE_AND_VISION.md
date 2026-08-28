# Cuzmify — Master Architecture, Business Scope & Technical Vision

> **Confidential & Proprietary — Cuzmify Core Engine**  
> *Last Updated: August 2026*  
> *Author & Lead Architect: Bram Intel & Engineering Team*

---

## 1. Executive Summary & Business Scope

### 1.1 The Vision
**Cuzmify** is a verticalized, composable digital storefront and website customization platform engineered specifically for **beauty, aesthetics, bridal artistry, and luxury service creators**. 

### 1.2 The Problem We Solve
Generic website builders (Wix, WordPress, Squarespace, Shopify) are:
- **Bloated & Overwhelming**: 500+ generic drag-and-drop settings that require technical web design expertise.
- **Disconnected from Social & Conversational Commerce**: They assume traditional shopping cart checkouts with high friction, ignoring the reality that the majority of high-ticket beauty and regional service transactions occur through **WhatsApp consultations, Instagram portfolios, and direct deposits**.
- **Static & Fragile**: In standard builders, editing a service price or rebranding requires manually hunting down text blocks across multiple pages and viewports.

### 1.3 The Cuzmify Solution
1. **Composable Business Blueprint**: A headless, reactive data contract representing the business profile, service tiers, product catalog, delivery options, WhatsApp message templates, and media assets.
2. **Autonomous AI Visual Architect**: A constrained, high-fidelity generative AI engine (Gemini 3.6 Flash) capable of completely revamping website aesthetics, typography, color palettes, and copywriting while **strictly locking structural section order and live integration hooks**.
3. **Headless Visual Studio Canvas**: A customized, high-performance GrapesJS canvas completely wrapped in bespoke React panels, providing an intuitive, Figma-grade editing experience.
4. **1-Click WhatsApp & Multi-Currency Commerce**: Instant pre-filled booking and order routing with itemized receipts, delivery collection, and multi-currency support (`$`, `₦`, `£`, `€`, `AED`, `CA$`, `A$`, `KSh`, `R`).
5. **Zero-Downtime Multi-Tenant Persistence**: Instant 0ms SWR LocalStorage caching paired with multi-tenant PostgreSQL (Supabase/Prisma) cloud database backups.

---

## 2. System Architecture & Component Hierarchy

```
                                  ┌────────────────────────────────────────┐
                                  │           Next.js 15 App Router        │
                                  └───────────────────┬────────────────────┘
                                                      │
                       ┌──────────────────────────────┼─────────────────────────────┐
                       ▼                              ▼                             ▼
            ┌─────────────────────┐        ┌─────────────────────┐       ┌─────────────────────┐
            │   /studio (Editor)  │        │     /dashboard      │       │     /site/[id]      │
            └──────────┬──────────┘        └─────────────────────┘       └──────────┬──────────┘
                       │                                                            │
         ┌─────────────┴─────────────┐                                              ▼
         ▼                           ▼                                  ┌──────────────────────┐
┌───────────────────┐       ┌─────────────────┐                         │ Live Public Runtime  │
│    MobileGuard    │       │  EditorProvider │                         │ (HTML + WhatsApp +   │
└────────┬──────────┘       └────────┬────────┘                         │  Commerce Hooks)     │
         │                           │                                  └──────────────────────┘
         ▼                           ▼
┌───────────────────┐       ┌─────────────────┐
│ Desktop Guidance  │       │   EditorShell   │
│ (when on Mobile)  │       └────────┬────────┘
└───────────────────┘                │
        ┌────────────────────────────┼────────────────────────────┐
        ▼                            ▼                            ▼
┌────────────────┐          ┌────────────────┐          ┌─────────────────┐
│     TopBar     │          │  Left / Right  │          │   GrapesJS      │
│ (Brand, Theme, │          │     Panels     │          │   Iframe Canvas │
│  Undo, Save)   │          │(Blocks, Media) │          │(EditorService)  │
└────────────────┘          └────────────────┘          └────────┬────────┘
                                                                 │
                                ┌────────────────────────────────┴───────────────────────────────┐
                                ▼                                                                ▼
                     ┌──────────────────────┐                                         ┌─────────────────────┐
                     │   BlueprintManager   │                                         │    ThemeEngine      │
                     │  (Profile, Services, │                                         │ (Tailwind Design    │
                     │   Products, WhatsApp)│                                         │  Token Variables)   │
                     └──────────┬───────────┘                                         └─────────────────────┘
                                │
                                ▼
                     ┌──────────────────────┐
                     │   PostgreSQL DB      │
                     │  (Prisma / Supabase) │
                     └──────────────────────┘
```

---

## 3. Core Engine Components & Data Flow

### 3.1 Business Blueprint (`src/core/blueprint-schema.ts` & `BlueprintManager.ts`)
The **Business Blueprint** is the heart of Cuzmify. It is a strictly typed JSON contract containing:
- **`profile`**: Business Name, Tagline, Category, Phone, WhatsApp, Email, City, Currency.
- **`modules.whatsapp`**: Phone number, custom booking templates, product order templates, floating widget configuration.
- **`modules.services`**: Array of `ServiceItem` (name, price, duration, deposit, locationType, category).
- **`modules.products`**: Array of `ProductItem` (name, price, compareAtPrice, inStock, category, variants).
- **`modules.cart`**: Checkout mode, minimum order value, delivery address collection, free shipping threshold.
- **`modules.payments`**: Paystack / Stripe / Flutterwave gateway bindings.
- **`mediaVault`**: Array of uploaded or imported media assets.

**Invariant**: The canvas DOM elements (`[data-cuzmify-field="business-name"]`, `a[data-cuzmify-action]`, etc.) are *derivatives* of the Blueprint. When the Blueprint changes, `service.syncCanvasWithBlueprint()` reactively updates the canvas DOM.

### 3.2 AI Intent Classification System (`src/app/api/ai/chat/route.ts`)
To prevent the AI from acting like an unpredictable novice that wipes out page structure, all user prompts pass through a **5-Tier Intent Classifier**:

| Intent | Trigger Condition | Execution Strategy |
|---|---|---|
| **`style-only`** | User asks for color/theme/dark/luxury swap without structural changes | **Fast Path (0ms LLM)**: Directly swaps global design tokens. HTML is **never touched**. |
| **`element-style`** | User selects a specific element on the canvas and gives an instruction | **Surgical Swap**: Gemini returns *only* the single element's updated HTML snippet. |
| **`add-section`** | User asks to add a new section (testimonials, FAQ, pricing table) | **Append-Only**: Gemini generates *only* the new `<section>` HTML to append. Existing HTML is strictly read-only. |
| **`full-transform`** *(Default)* | Creative redesign (*"make it modern and lush"*, *"transform into bridal luxury"*) | **Constrained Synthesis**: Gemini restyles backgrounds, typography, copy, and layout while **strictly locking section order, section IDs, and `data-cuzmify-*` hooks**. |
| **`full-rebuild`** | User explicitly says *"start fresh"*, *"redesign everything"*, *"wipe and rebuild"* | **Unconstrained Synthesis**: Full structural regeneration. |

### 3.3 Persistence Strategy (`EditorService.ts` & `/api/sites/save`)
1. **0ms SWR Local Storage**: On edit, `service.saveToLocalStorage()` persists the GrapesJS project data, raw HTML, CSS, theme, and blueprint to `cuzmify_project_${userId}_${projectId}`.
2. **Debounced Cloud Sync (1.5s)**: In the background, `service.saveToDatabase()` posts the payload to `/api/sites/save`.
3. **Multi-Tenant Protection**: `/api/sites/save` resolves the user via NextAuth session or session email, preventing cross-tenant data collisions.
4. **Hydration on Login**: When a user returns, `service.loadFromDatabase()` pulls their saved site from PostgreSQL, synchronizes the Blueprint, and updates React state.

---

## 4. Key Architectural Decisions & Post-Mortem Log

### Decision 1: Headless GrapesJS Wrapper
- **Problem**: Default GrapesJS UI is cluttered with 1990s-era toolbars and complex CSS box models that intimidate beauty creators.
- **Solution**: Set `panels: { defaults: [] }` and wrap GrapesJS as a headless DOM manipulation engine. Built bespoke React panels (`TopBar`, `LeftPanel`, `RightPanel`, `AIPanel`, `ModuleConfigModal`).
- **Result**: Figma/Canva-grade modern UI with deep GrapesJS DOM manipulation underneath.

### Decision 2: Section Manifest & Attribute Locking for AI
- **Problem**: Early AI revamp prompts asked Gemini for "the full updated HTML", causing it to delete sections, drop IDs, and erase WhatsApp hooks.
- **Solution**: Extract `sectionManifest` (ordered list of `<section id="...">`) and all `data-cuzmify-*` attributes from the current DOM, inject them into the system instruction as **NON-NEGOTIABLE SACRED CONSTRAINTS**, and limit context payload to 10k chars.
- **Result**: Visuals, typography, and copy are transformed with high artistic fidelity while section order and live integrations remain 100% intact.

### Decision 3: Eliminating Hardcoded Brand Strings
- **Problem**: Initial templates had `'Gmakeup Studio'` hardcoded, which created race conditions where hard refreshes overwrote the user's custom business name.
- **Solution**: Removed all hardcoded fallbacks from `BlueprintManager`, personalized `INITIAL_HTML` on canvas mount, and added bi-directional sync between `BlueprintManager` and React's `businessName` state.
- **Result**: Business names stay 100% dynamic and persistent across reloads and logouts.

### Decision 4: MobileGuard Architecture
- **Problem**: On mobile viewports (<1024px), GrapesJS fixed panels with extreme z-indices bled through modal overlays.
- **Solution**: `MobileGuard` conditionally unmounts Studio children on mobile devices and renders clean, step-by-step instructions on toggling desktop mode or switching to a laptop.

### Decision 5: Native SWC Compiler over Webpack
- **Problem**: Corrupted Windows SWC binaries caused Next.js to fall back to Webpack, resulting in `ChunkLoadError` timeouts during layout compilation.
- **Solution**: Pinned and reinstalled clean 64-bit Windows `@next/swc-win32-x64-msvc` binary.

---

## 5. Non-Negotiable Coding Rules for Future Development

When touching any code in Cuzmify, all engineers and AI assistants must follow these rules:

1. **Never Hardcode Business Defaults**: Never write string literals like `'Gmakeup Studio'` or `'Glory Beauty Studio'` in state initialization or fallback logic. Always pull from `blueprint.profile.name` or `initialBusinessName`.
2. **Preserve `data-cuzmify-*` Attributes**: Interactive hooks (`data-cuzmify-action="whatsapp:booking"`, `data-cuzmify-type="products"`, etc.) power the live runtime. Never strip or mutate them.
3. **Always Synchronize Blueprint with Canvas**: When adding or updating business data, always update `BlueprintManager` and trigger `syncCanvasWithBlueprint()`.
4. **Never Block Cloud Saves on Stale React State**: In persistence functions, always prioritize `this.blueprintManager.getProfile().name` over stale component props.
5. **Run Typecheck and Tests Before Committing**: All changes must pass `npm run typecheck` (`tsc --noEmit`) and `npm run test:run` (15 Vitest tests) with 0 errors.

---

## 6. Composable Modules Roadmap

- [x] **Services Catalog Module** (CRUD, duration, deposit, WhatsApp booking)
- [x] **WhatsApp Commerce Engine** (Dynamic templates, prefilled booking/order URLs)
- [x] **Media Vault** (Direct upload, Unsplash curation, quick image swap)
- [x] **AI Visual Architect** (5-tier intent classifier, Gemini 3.6 Flash, locked structure)
- [x] **CI/CD Pipeline** (Vitest unit testing, GitHub Actions automated validation)
- [ ] **Products & Variants Module** (Sizes, shades, bundles, stock status)
- [ ] **Interactive Cart Drawer & Floating Cart Pill** (Client-side drawer with live subtotal)
- [ ] **Delivery & Fulfillment Engine** (In-studio pickup, courier shipping fees, mobile travel fees)
- [ ] **Published Public Runtime (`/site/[id]`)** (Live cart drawer, WhatsApp itemized checkout, floating widget)
- [ ] **User Dashboard (`/dashboard`)** (Multi-site management, status toggles, QR codes)
