---
description: Critical architectural guidelines, data flow invariants, and regression guards for Cuzmify.
trigger: always_on
---

# Cuzmify Architecture & Engineering Rules

## 1. Blueprint & State Hierarchy
- **Blueprint is Master**: `BusinessBlueprint` (in `BlueprintManager.ts`) is the single source of truth for business data (profile, services, products, WhatsApp, cart, delivery, media vault).
- **Canvas is Derivative**: The GrapesJS HTML canvas derives its dynamic text and links from the Blueprint via `service.syncCanvasWithBlueprint()`.
- **No Hardcoded Names**: Never hardcode default strings like `'Gmakeup Studio'` or `'Glory Beauty Studio'`. Always use `blueprint.profile.name` or dynamic fallbacks like `session.user.name` / `'My Business Studio'`.

## 2. AI Generative Engine Rules
- **5-Tier Intent System**: Prompts to `/api/ai/chat` must be classified into `style-only`, `element-style`, `add-section`, `full-transform`, or `full-rebuild`.
- **Structural Integrity**: In `full-transform`, section order, section IDs, and `data-cuzmify-*` attributes are SACRED. Gemini is given creative freedom over backgrounds, typography, and copy, but section hierarchy is locked.
- **Model Endpoints**: Only use verified active endpoints: `gemini-3.6-flash` and `gemini-3-flash-preview`.

## 3. Persistence & Multi-Tenancy
- **Dual-Layer Persistence**: Always maintain SWR 0ms local storage cache (`saveToLocalStorage`) alongside PostgreSQL database backup (`saveToDatabase`).
- **User Scoping**: Local storage keys must be scoped per user (`cuzmify_project_${userId}_${projectId}`).

## 4. Verification Gate
- After making any code changes, always verify:
  1. `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
  2. `npm run test:run` (Vitest test suite) passes with 100% success.
