import { createApp } from 'vue';

import App from '@/app/App.vue';
import { registerProviders } from '@/app/providers';

import '@/shared/styles/global.scss';

// IIFE, not top-level await: the macOS Tauri build targets safari13 (see
// vite.config.ts), which predates top-level await support.
(async () => {
  const app = createApp(App);

  await registerProviders(app);

  app.mount('#app');
})();
