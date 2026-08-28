---
name: cuzmify-core
description: >-
  Master architecture guide and development workflows for Cuzmify: Business Blueprint engine, GrapesJS headless canvas, AI Intent classification, WhatsApp commerce, and cloud persistence.
---

# Cuzmify Core Engine & Architecture Guide

Use this skill whenever working on core features, refactoring components, expanding composable modules, or integrating AI capabilities in Cuzmify.

## 1. Quick Reference: Key Files & Responsibilities

| Subsystem | Core Files | Responsibility |
|---|---|---|
| **Blueprint Data Model** | `src/core/blueprint-schema.ts` | Type definitions for Profile, Services, Products, WhatsApp, Cart, Delivery, and Media Vault. |
| **Blueprint State Manager** | `src/studio/engine/BlueprintManager.ts` | Reactive state manager, CRUD operations, WhatsApp link generator, subscriber notifications. |
| **GrapesJS Editor Service** | `src/studio/engine/EditorService.ts` | Headless wrapper over GrapesJS DOM, theme engine, history undo/redo, canvas sanitization. |
| **React Studio Context** | `src/studio/engine/EditorContext.tsx` | React state provider holding active service, businessName, theme, breakpoint, and modals. |
| **AI Intent & Chat API** | `src/app/api/ai/chat/route.ts` | 5-tier intent classifier (`style-only`, `element-style`, `add-section`, `full-transform`, `full-rebuild`), structure locking, Gemini generation. |
| **Cloud Persistence** | `src/app/api/sites/save/route.ts` | Multi-tenant PostgreSQL persistence via Prisma and NextAuth session resolution. |
| **Mobile Guard** | `src/studio/MobileGuard.tsx` | Viewport detection to prevent GrapesJS panel z-index collisions on mobile devices. |
| **Testing Suite** | `src/__tests__/*.test.ts` | 15 Vitest unit tests guarding blueprint mutation, AI intent detection, and persistence. |

## 2. Composable Commerce Action Protocol

Every interactive element on the canvas and published page must use standardized `data-cuzmify-action` attributes:

```html
<!-- Instant WhatsApp Booking for a Specific Service -->
<a data-cuzmify-action="whatsapp:booking" data-cuzmify-target-id="srv-bridal-suite" href="#booking">
  Book Bridal Suite
</a>

<!-- Direct WhatsApp Order for a Single Product -->
<button data-cuzmify-action="whatsapp:order" data-cuzmify-target-id="prod-lash-bundle">
  Order on WhatsApp
</button>

<!-- Add Product or Service to Interactive Cart -->
<button data-cuzmify-action="cart:add" data-cuzmify-target-id="prod-lash-bundle">
  Add to Cart
</button>

<!-- Toggle / Open Interactive Slide-out Cart Drawer -->
<button data-cuzmify-action="cart:toggle">
  🛒 Cart (<span data-cuzmify-cart-count>0</span>)
</button>
```

## 3. Development Workflow & Verification

1. Implement feature or fix.
2. Run `npm run typecheck` to verify TypeScript strict mode.
3. Run `npm run test:run` to ensure all 15 Vitest regression tests pass.
4. Verify on local dev server (`http://localhost:3000/studio`).
