# 0001 — Frontend foundation architecture

- Status: Accepted
- Date: 2026-08-01

## Context

The project was scaffolded (Tauri 2 + Vue 3 + TypeScript + Vite + Pinia) but
no UI or business logic existed yet. Before starting UI implementation, the
foundation was audited so structural decisions (layer boundaries, theming,
provider wiring) don't have to be retrofitted once real code depends on them.

## Decisions

1. **Feature-Sliced Design, adapted for a single-window app.** Layers:
   `app`, `shared`, `entities`, `features`, `widgets`, plus two
   infrastructure layers FSD doesn't define — `services/` (outside-world
   integrations: Tauri commands/events, WebSocket, window, clipboard,
   storage, notifications) and `composables/` (cross-cutting Vue
   composition functions). No `pages/` layer — this is a single always-on-top
   overlay window, not routed. No `processes/` — deprecated upstream.

2. **`shared/` absorbs everything with no domain knowledge.** `types/`,
   `assets/`, and `styles/` moved from top-level into `shared/` (they're
   exactly what "shared" means); `shared/ui`, `shared/lib`, `shared/config`,
   `shared/constants`, `shared/api` were added as empty, documented slots.
   `utils/` stays a top-level sibling of `shared/` by design — it's
   pure-function-only, while `shared/lib` is for reusable logic that isn't a
   pure function (adapters, wrappers). Keeping them distinct prevents both
   from becoming a dumping ground for "stuff that doesn't fit elsewhere."

3. **Layer direction is enforced by ESLint, not convention.** A
   `no-restricted-imports` override per layer directory
   (`eslint.config.js`) makes it a lint error for a lower layer to import
   from a higher one. This was added now, while zero files exist, so no
   codebase gets a chance to violate it before the guardrail exists.

4. **Colors became CSS custom properties; everything else stayed SCSS
   variables.** The original `_variables.scss` used SCSS `$color-*`
   variables, which are compile-time constants — a runtime theme switch is
   structurally impossible with them. Colors were split into
   `tokens/_palette.scss` (raw values) and `themes/_dark.scss` /
   `themes/_light.scss` (semantic `--color-*` custom properties per theme).
   Spacing/typography/radii/z-index don't vary by theme, so they stayed
   SCSS variables in `tokens/_scale.scss` — no reason to pay a runtime cost
   for values that never change. Dark theme reproduces the original values
   exactly (visually a no-op); light theme is prepared but unused until a
   `useTheme` composable is added.

5. **Providers are a registry, not a hardcoded call list.** `main.ts` calls
   one `registerProviders(app)`; `app/providers/index.ts` iterates a
   `Provider[]` array (`{ install(app) }`). Adding Router, i18n, or a Tauri
   bootstrap step later means adding one `<name>.provider.ts` file and one
   array entry — `main.ts` never changes again.

6. **UI library choice is deferred to the implementation stage, but the
   boundary for it is built now.** `shared/ui/` is reserved as the only
   place allowed to import a third-party component library, so swapping
   libraries later is contained to that folder. At implementation time no
   third-party library was pulled in — `shared/ui/` ended up as a small set
   of custom, dependency-free primitives (`Surface`, `Stack`, `Flex`, `Text`,
   `Icon`, `Loader`), which was enough for this app's needs.

## Consequences

- Every new layer, provider, or theme value has one obvious place to go;
  reduces the chance of parallel/duplicate implementations as the app grows.
- The ESLint boundary rule needs a new entry in `eslint.config.js` whenever a
  layer is added — a small, explicit maintenance cost in exchange for
  cycles being impossible instead of merely discouraged.
- No visual change shipped — this ADR is structural only.
