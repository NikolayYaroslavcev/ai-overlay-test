import type { App } from 'vue';

import { chatProvider } from './chat.provider';
import { piniaProvider } from './pinia.provider';
import type { Provider } from './provider';

// Registration order matters (e.g. router before a provider that reads the
// current route; chatProvider needs Pinia active first), so this stays an
// explicit array rather than a directory auto-scan. Add a new provider by
// creating `<name>.provider.ts` exporting a `Provider` and listing it here —
// no other file needs to change to add Router, i18n, or hotkeys later.
const providers: Provider[] = [piniaProvider, chatProvider];

export async function registerProviders(app: App): Promise<void> {
  for (const provider of providers) {
    await provider.install(app);
  }
}
