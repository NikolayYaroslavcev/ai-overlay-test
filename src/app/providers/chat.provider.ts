import { useChatBridge } from '@/entities/chat';

import type { Provider } from './provider';

// Wires the chat WebSocket bridge (service -> store) so it's ready before
// mount. Requires Pinia to already be installed, hence its position after
// piniaProvider in the registry. Does not call connect() — opening the
// socket is left to the UI stage.
export const chatProvider: Provider = {
  install() {
    useChatBridge();
  },
};
