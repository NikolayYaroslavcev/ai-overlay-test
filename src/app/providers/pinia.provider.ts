import { createPinia } from 'pinia';

import type { Provider } from './provider';

export const piniaProvider: Provider = {
  install(app) {
    app.use(createPinia());
  },
};
