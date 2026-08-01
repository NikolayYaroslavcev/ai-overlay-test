import type { App } from 'vue';

// Common shape for every app-wide provider (Pinia, router, i18n, Tauri init,
// hotkeys, ...). `install` may be async so providers that need to await
// something before mount (e.g. loading persisted state) fit the same
// registry without special-casing.
export interface Provider {
  install(app: App): void | Promise<void>;
}
