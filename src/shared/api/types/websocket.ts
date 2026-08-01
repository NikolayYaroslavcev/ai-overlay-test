// Wire-format types for the chat WebSocket protocol (services/websocket) —
// the JSON shape that actually crosses the network, plus the connection
// lifecycle contract the client exposes to its consumers. Domain models
// (e.g. ChatMessage) live in entities/<entity>/model instead — see the note
// in shared/types/index.ts for why these stay separate.

export type ConnectionStatus = 'idle' | 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error';

export interface StreamingChunk {
  messageId: string;
  delta: string;
  done: boolean;
}

// Messages this client sends to the server.
export type ClientMessage =
  { type: 'chat'; id: string; content: string; sentAt: string } | { type: 'ping' };

// Messages the server sends to this client.
export type ServerMessage =
  | { type: 'message'; id: string; content: string; sentAt: string }
  | { type: 'chunk'; chunk: StreamingChunk }
  | { type: 'typing'; isTyping: boolean }
  | { type: 'error'; message: string }
  | { type: 'pong' };

// Events emitted by WebSocketClient — its public contract for consumers
// (the chat bridge). Ping/pong are handled internally by the client and
// never surface as a 'message' event.
export type WebSocketEvent =
  | { type: 'open' }
  | { type: 'close'; code: number; reason: string; wasClean: boolean }
  | { type: 'error'; message: string }
  | { type: 'message'; data: ServerMessage }
  | { type: 'reconnecting'; attempt: number; delayMs: number }
  | { type: 'reconnect_failed' };
