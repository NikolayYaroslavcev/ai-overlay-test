// Static config for the chat WebSocket client. VITE_WS_URL lets a future
// mock/dev server override the default without touching code.
export const WEBSOCKET_CONFIG = {
  url: import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080',
  heartbeatIntervalMs: 15_000,
  heartbeatTimeoutMs: 5_000,
  reconnectBaseDelayMs: 1_000,
  reconnectMaxDelayMs: 30_000,
  maxReconnectAttempts: 10,
} as const;
