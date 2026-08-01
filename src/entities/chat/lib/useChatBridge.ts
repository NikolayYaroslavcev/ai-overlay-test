import { useChatStore } from '../model/store';
import { chatSocketClient } from './client';

let started = false;

// The bridge: the only piece that knows both the WebSocket service and the
// Pinia store. It listens to chatSocketClient and translates each event into
// a store action call — nothing else. The UI never touches this file or the
// service directly, only useChatStore(); the store, in turn, drives
// chatSocketClient directly from its own actions (connect/disconnect/send).
// Call once during app bootstrap (see app/providers/chat.provider.ts).
export function useChatBridge(): void {
  if (started) return;
  started = true;

  const store = useChatStore();

  chatSocketClient.on((event) => {
    switch (event.type) {
      case 'open':
        store.setConnectionStatus('open');
        break;
      case 'close':
        // WebSocketClient detaches its listeners before a manual disconnect()
        // closes the socket, so this only ever fires for an unexpected close.
        // If a reconnect is scheduled, the 'reconnecting' event right behind
        // it overwrites this in the same tick.
        store.setConnectionStatus('closed');
        break;
      case 'error':
        store.setError(event.message);
        break;
      case 'reconnecting':
        store.setReconnecting(event.attempt);
        break;
      case 'reconnect_failed':
        store.setReconnectFailed();
        break;
      case 'message':
        switch (event.data.type) {
          case 'message':
            store.receiveMessage(event.data);
            break;
          case 'chunk':
            store.receiveChunk(event.data.chunk);
            break;
          case 'typing':
            store.setTyping(event.data.isTyping);
            break;
          case 'error':
            store.setError(event.data.message);
            break;
          case 'pong':
            break;
        }
        break;
    }
  });
}
