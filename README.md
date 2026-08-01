# AI Overlay

An always-on-top desktop chat overlay: a small, borderless, glass-panel
window that streams AI-style responses over a WebSocket. Built as a
take-home assignment — the "AI" is a mock backend with canned replies, not a
real model.

Tauri 2 + Vue 3 + TypeScript + Vite + Pinia + SCSS.

## Tech stack

- **Shell**: Tauri 2 (Rust) — always-on-top, borderless, transparent desktop window
- **UI**: Vue 3 (`<script setup>`, Composition API) + TypeScript, no component library
- **State**: Pinia — single `chat` store (connection status, messages, typing, errors)
- **Styling**: SCSS with CSS custom properties for theming (dark theme wired, light theme prepared)
- **Realtime**: hand-rolled `WebSocketClient` (reconnect with backoff, app-level heartbeat) talking to a mock Node.js/`ws` server
- **Tooling**: Vite, ESLint (flat config, layer-boundary enforcement), Prettier, vue-tsc, Knip

## How to run

```bash
npm install        # install frontend + mock server dependencies
npm run server      # terminal 1 — mock WebSocket backend on ws://localhost:8080
npm run dev          # terminal 2 — Vite dev server on http://localhost:1420
# or, for the full desktop shell instead of the plain web page:
npm run tauri dev    # terminal 2 — requires the Rust toolchain, see below
```

The frontend expects the mock server to already be listening — start
`npm run server` first. `VITE_WS_URL` (see `src/shared/config/websocket.config.ts`)
overrides the socket URL if the server runs elsewhere; it defaults to
`ws://localhost:8080`.

## Mock WebSocket backend (`server/`)

`server/index.js` is a small `ws`-based Node server that stands in for a
real AI backend. It speaks exactly the wire protocol the client already
expects (`src/shared/api/types/websocket.ts`) — no AI, no external API calls.

For every `{ type: 'chat', id, content, sentAt }` it receives, it:

1. Immediately sends `{ type: 'typing', isTyping: true }` (acknowledgment).
2. Waits a random 500–1200ms, to feel like an inference delay.
3. Picks a random canned reply and streams it back word by word as
   `{ type: 'chunk', chunk: { messageId, delta, done } }` messages.
4. Sends `{ type: 'typing', isTyping: false }` once the last chunk goes out.

It also replies to the client's app-level `{ type: 'ping' }` heartbeat with
`{ type: 'pong' }`, validates every incoming payload structurally (malformed
messages get a typed `error` response instead of crashing the process), and
shuts down cleanly on `Ctrl+C`/`SIGTERM` — closing all open sockets before
exiting so reconnecting clients see a clean close, not a hang.

## Scripts

- `npm run dev` — Vite dev server only
- `npm run server` — mock WebSocket backend (`ws://localhost:8080`)
- `npm run tauri dev` — full desktop app (requires Rust toolchain, see below)
- `npm run build` — typecheck + production frontend build
- `npm run tauri build` — production desktop bundle
- `npm run typecheck` — `vue-tsc` project check, no emit
- `npm run lint` / `lint:fix` — ESLint
- `npm run format` / `format:check` — Prettier
- `npm run knip` — unused files/exports/dependencies report

## Prerequisites not yet installed in this environment

- **Rust toolchain** (`rustc`/`cargo`) is required to run `tauri dev`/`tauri build`. Install via https://rustup.rs, then re-run `npm install` if `@tauri-apps/cli` needs a rebuild.
- **App icons**: `src-tauri/tauri.conf.json` points at `src-tauri/icons/*`, which doesn't exist yet. Once Rust is installed and you have a source image, run `npm run tauri icon <path-to-1024x1024-png>` to generate the full icon set before bundling.

## Project structure

```
ai-overlay-test/
  server/            mock WebSocket backend (plain Node + ws, not part of the src/ layer system)
  src/                see "Layer conventions" below
  src-tauri/          Rust/Tauri shell (window config, capabilities, entry point)
  public/, index.html  Vite entry
```

## Layer conventions (`src/`)

| Layer          | Purpose                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| `app/`         | App bootstrap: root component, provider registration (Pinia, router, i18n…)                           |
| `shared/`      | Reusable code with **no domain knowledge** — see breakdown below                                      |
| `entities/`    | Business/domain models and their own state, owned by the domain they model                            |
| `features/`    | User-facing use cases that act on entities                                                            |
| `widgets/`     | Composite UI blocks assembled from features/entities (`Overlay`, `Chat`, `Input`, `Status`, `TopBar`) |
| `services/`    | Integrations with the outside world — one subfolder per integration                                   |
| `composables/` | Cross-cutting Vue composition functions not tied to one entity/feature                                |
| `utils/`       | Pure, stateless helper functions — one subfolder per kind                                             |

No `pages/` layer: this is a single always-on-top overlay window, not a
routed multi-page app. No `processes/` layer: deprecated in FSD, folded into
`features/`/`app/` as needed.

### `shared/` breakdown

| Folder              | Purpose                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shared/ui/`        | Generic UI primitives. If a third-party component library is used, its components are wrapped/re-exported _only_ here — features/widgets never import the library directly, so swapping it out later touches this folder alone. |
| `shared/lib/`       | Reusable logic that isn't a pure function: library wrappers/adapters, non-trivial reactive helpers. Distinct from `utils/`, which is pure-function-only.                                                                        |
| `shared/config/`    | Static app configuration (env parsing, feature flags, constants derived from `import.meta.env`).                                                                                                                                |
| `shared/constants/` | Plain constant values with no logic.                                                                                                                                                                                            |
| `shared/api/`       | Low-level, generic client wrappers (e.g. a typed `invoke` wrapper, WS client base). `shared/api/types/` holds DTO / wire-format types for these. Higher-level orchestration built on top belongs in `services/`, not here.      |
| `shared/types/`     | Generic, framework-agnostic utility types only (`Nullable<T>`, `Maybe<T>`). Domain types live in `entities/<entity>/model`; DTO/API types live in `shared/api/types`. Never mix these three into one file.                      |
| `shared/assets/`    | Static files (images, fonts, icons).                                                                                                                                                                                            |
| `shared/styles/`    | Design tokens, themes, reset, typography, utility classes — see below.                                                                                                                                                          |

### `services/` breakdown

One subfolder per integration, each an isolated module with its own public
API — `websocket/`, `tauri-commands/`, `tauri-events/`, `window/`,
`clipboard/`, `storage/`, `notifications/`. Services may depend on
`shared/`, never on `entities/`, `features/`, `widgets/`, or each other's
internals (compose them from `composables/` or a feature instead of
importing one service from another).

### `composables/` breakdown (planned, flat files)

`useWindow`, `useHotkeys`, `useAutoScroll`, `useConnection`, `useTheme` — one
file per composable (`useTheme.ts`), not a folder, unless a composable grows
colocated tests/types.

### `utils/` breakdown

`helpers/` (misc pure functions), `guards/` (type guards / runtime checks),
`formatters/` (data → display string), `validators/` (predicate functions
over input, e.g. form validation) — keep each function pure and stateless.

### `shared/styles/` — tokens and theming

```
shared/styles/
  tokens/
    _palette.scss     raw color primitives — never used outside themes/
    _scale.scss       spacing, typography, radii, motion, z-index (theme-agnostic, compile-time SCSS vars)
  themes/
    _dark.scss        maps palette -> semantic CSS custom properties under :root, [data-theme='dark']
    _light.scss       same mapping under [data-theme='light'] (prepared, not wired to a toggle yet)
  _reset.scss
  _typography.scss    reusable text-* classes
  _utilities.scss     small single-purpose utility classes
  global.scss         entry point, imported once in main.ts
```

Colors are **CSS custom properties** (`var(--color-text-primary)`), not SCSS
variables — SCSS variables are compile-time constants and can't respond to a
runtime theme switch. Everything else (spacing, radii, typography scale,
z-index) stays a compile-time SCSS variable since it doesn't vary by theme;
these are in scope in every `.scss` file automatically via the
`additionalData` `@use` wired in `vite.config.ts`.

Switching theme at runtime later is `document.documentElement.dataset.theme
= 'light' | 'dark'` from a `useTheme` composable — no CSS changes needed.

Import everything via the `@` alias (`@/entities/...`), never deep relative
paths across layers. ESLint enforces the layer-dependency direction (lower
layers can't import from higher ones) via `no-restricted-imports` overrides
in `eslint.config.js` — see the `layerBoundaries` block at the bottom of that
file for the exact rules.

## Known limitations

- **No real AI.** The mock server picks from a fixed list of canned replies — there's no model, no context awareness, no per-conversation memory on the server side.
- **No persistence.** Conversation history lives only in the Pinia store; refreshing the page or restarting the app clears it.
- **Light theme is prepared but not wired.** `shared/styles/themes/_light.scss` exists and a `useTheme` composable is planned, but there's no UI toggle yet — the app always renders dark.
- **Desktop bundling is untested in this environment** — no Rust toolchain or app icons are installed here (see "Prerequisites" above), so only `npm run dev` + `npm run server` were exercised end-to-end, not `tauri build`.
- **Single WebSocket connection, single conversation.** There's no multi-session/multi-tab handling on the server (each connection is independent and stateless) or conversation switching in the UI.

## Future improvements

- Wire the light/dark theme toggle through `useTheme` (the CSS custom property plumbing already supports it).
- Persist conversation history (e.g. `services/storage`, already scaffolded) so the overlay survives a restart.
- Add global hotkeys / window show-hide via `useHotkeys` + `services/window` (folders scaffolded, not implemented).
- Swap the mock server for a real model behind the same `ServerMessage`/`ClientMessage` contract — the frontend wouldn't need to change.
- Add component/unit tests (none exist yet) around `WebSocketClient`'s reconnect/backoff logic and the chat store's message-merging behavior, since those are the parts most likely to regress silently.
