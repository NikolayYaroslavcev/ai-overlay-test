import type { ClientMessage, ServerMessage, WebSocketEvent } from '@/shared/api/types/websocket';

export interface WebSocketClientOptions {
  url: string;
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
  reconnectBaseDelayMs: number;
  reconnectMaxDelayMs: number;
  maxReconnectAttempts: number;
}

type Listener = (event: WebSocketEvent) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Structural validation, not just a type assertion — payloads come off the
// wire and must never be trusted to match ServerMessage just because JSON.parse
// succeeded.
function parseServerMessage(raw: string): ServerMessage | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || typeof data.type !== 'string') return null;

  switch (data.type) {
    case 'message':
      return typeof data.id === 'string' &&
        typeof data.content === 'string' &&
        typeof data.sentAt === 'string'
        ? { type: 'message', id: data.id, content: data.content, sentAt: data.sentAt }
        : null;
    case 'chunk': {
      const chunk = data.chunk;
      if (
        !isRecord(chunk) ||
        typeof chunk.messageId !== 'string' ||
        typeof chunk.delta !== 'string' ||
        typeof chunk.done !== 'boolean'
      ) {
        return null;
      }
      return {
        type: 'chunk',
        chunk: { messageId: chunk.messageId, delta: chunk.delta, done: chunk.done },
      };
    }
    case 'typing':
      return typeof data.isTyping === 'boolean'
        ? { type: 'typing', isTyping: data.isTyping }
        : null;
    case 'error':
      return typeof data.message === 'string' ? { type: 'error', message: data.message } : null;
    case 'pong':
      return { type: 'pong' };
    default:
      return null;
  }
}

// Pure TypeScript, reusable WebSocket client: connect/disconnect/reconnect
// with exponential backoff, a ping/pong heartbeat to detect dead
// connections, and a typed pub/sub for consumers. Knows nothing about Vue or
// Pinia — entities/chat wires it to app state, this file only wires sockets.
export class WebSocketClient {
  private readonly options: WebSocketClientOptions;
  private socket: WebSocket | null = null;
  private readonly listeners = new Set<Listener>();

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private manuallyClosed = false;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
  }

  connect(): void {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.manuallyClosed = false;
    this.clearReconnectTimer();
    this.openSocket();
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    this.teardownSocket();
  }

  reconnect(): void {
    this.disconnect();
    this.manuallyClosed = false;
    this.reconnectAttempt = 0;
    this.openSocket();
  }

  send(message: ClientMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.emit({ type: 'error', message: 'Cannot send message: connection is not open' });
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Full teardown for when the client itself is being discarded (as opposed
  // to disconnect(), which leaves it ready to connect() again).
  destroy(): void {
    this.disconnect();
    this.listeners.clear();
  }

  private openSocket(): void {
    const socket = new WebSocket(this.options.url);
    socket.addEventListener('open', this.handleOpen);
    socket.addEventListener('close', this.handleClose);
    socket.addEventListener('error', this.handleError);
    socket.addEventListener('message', this.handleMessage);
    this.socket = socket;
  }

  private teardownSocket(): void {
    const socket = this.socket;
    if (!socket) return;
    socket.removeEventListener('open', this.handleOpen);
    socket.removeEventListener('close', this.handleClose);
    socket.removeEventListener('error', this.handleError);
    socket.removeEventListener('message', this.handleMessage);
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
      socket.close(1000, 'client disconnect');
    }
    this.socket = null;
  }

  private emit(event: WebSocketEvent): void {
    for (const listener of this.listeners) listener(event);
  }

  private readonly handleOpen = (): void => {
    this.reconnectAttempt = 0;
    this.startHeartbeat();
    this.emit({ type: 'open' });
  };

  private readonly handleClose = (event: CloseEvent): void => {
    this.stopHeartbeat();
    this.socket = null;
    this.emit({ type: 'close', code: event.code, reason: event.reason, wasClean: event.wasClean });
    if (!this.manuallyClosed) this.scheduleReconnect();
  };

  private readonly handleError = (): void => {
    this.emit({ type: 'error', message: 'WebSocket connection error' });
  };

  private readonly handleMessage = (event: MessageEvent<unknown>): void => {
    if (typeof event.data !== 'string') {
      this.emit({ type: 'error', message: 'Received invalid payload from server' });
      return;
    }
    const message = parseServerMessage(event.data);
    if (!message) {
      this.emit({ type: 'error', message: 'Received invalid payload from server' });
      return;
    }
    // Heartbeat replies are internal bookkeeping, not chat content.
    if (message.type === 'pong') {
      this.clearHeartbeatTimeout();
      return;
    }
    this.emit({ type: 'message', data: message });
  };

  private scheduleReconnect(): void {
    if (this.reconnectAttempt >= this.options.maxReconnectAttempts) {
      this.emit({ type: 'reconnect_failed' });
      return;
    }
    this.reconnectAttempt += 1;
    const delay = Math.min(
      this.options.reconnectBaseDelayMs * 2 ** (this.reconnectAttempt - 1),
      this.options.reconnectMaxDelayMs,
    );
    this.emit({ type: 'reconnecting', attempt: this.reconnectAttempt, delayMs: delay });
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer === null) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
      this.heartbeatTimeoutTimer = setTimeout(() => {
        // No pong in time — treat the connection as dead and let the close
        // handler drive reconnection.
        this.teardownSocket();
        this.emit({ type: 'close', code: 4000, reason: 'heartbeat timeout', wasClean: false });
        if (!this.manuallyClosed) this.scheduleReconnect();
      }, this.options.heartbeatTimeoutMs);
    }, this.options.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clearHeartbeatTimeout();
  }

  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeoutTimer === null) return;
    clearTimeout(this.heartbeatTimeoutTimer);
    this.heartbeatTimeoutTimer = null;
  }
}
