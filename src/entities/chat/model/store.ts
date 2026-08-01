import { defineStore } from 'pinia';

import type { ConnectionStatus, StreamingChunk } from '@/shared/api/types/websocket';

import { chatSocketClient } from '../lib/client';
import type { ChatMessage } from './types';

interface ChatState {
  connectionStatus: ConnectionStatus;
  messages: ChatMessage[];
  isTyping: boolean;
  reconnectAttempt: number;
  lastError: string | null;
}

// Single application store: connection status, messages, typing state, and
// reconnect state all live here rather than split across stores — this app
// has exactly one domain (chat) and splitting it would just add indirection
// for no isolation benefit. All state changes go through actions; components
// (once the UI exists) may only read state and call actions, never assign to
// state directly.
export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    connectionStatus: 'idle',
    messages: [],
    isTyping: false,
    reconnectAttempt: 0,
    lastError: null,
  }),

  actions: {
    // --- Public actions: the only surface the UI should call. ---

    connect(): void {
      this.connectionStatus = 'connecting';
      this.lastError = null;
      chatSocketClient.connect();
    },

    // Distinct from connect(): chatSocketClient.connect() is a no-op while
    // already open/connecting, so the manual "Reconnect" affordance needs
    // the client's reconnect(), which force-closes and reopens — otherwise
    // clicking it while already connected leaves connectionStatus stuck at
    // 'connecting' forever (no 'open' event ever fires again).
    reconnect(): void {
      this.connectionStatus = 'connecting';
      this.lastError = null;
      this.reconnectAttempt = 0;
      chatSocketClient.reconnect();
    },

    disconnect(): void {
      chatSocketClient.disconnect();
      this.connectionStatus = 'closed';
      this.reconnectAttempt = 0;
    },

    sendMessage(content: string): void {
      const trimmed = content.trim();
      if (!trimmed) return;

      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        status: this.connectionStatus === 'open' ? 'complete' : 'error',
        createdAt: new Date().toISOString(),
      };
      this.messages.push(message);

      if (this.connectionStatus !== 'open') {
        this.lastError = 'Cannot send message: not connected';
        return;
      }
      chatSocketClient.send({
        type: 'chat',
        id: message.id,
        content: trimmed,
        sentAt: message.createdAt,
      });
    },

    // --- Bridge-only actions: translate WebSocketClient events into state.
    // Not part of the UI-facing API; called from entities/chat/lib/useChatBridge. ---

    setConnectionStatus(status: ConnectionStatus): void {
      this.connectionStatus = status;
      if (status === 'open') {
        this.reconnectAttempt = 0;
        this.lastError = null;
      }
    },

    setReconnecting(attempt: number): void {
      this.connectionStatus = 'reconnecting';
      this.reconnectAttempt = attempt;
    },

    setReconnectFailed(): void {
      this.connectionStatus = 'error';
      this.lastError = 'Failed to reconnect after multiple attempts';
    },

    setTyping(isTyping: boolean): void {
      this.isTyping = isTyping;
    },

    setError(message: string): void {
      this.lastError = message;
    },

    receiveMessage(payload: { id: string; content: string; sentAt: string }): void {
      this.isTyping = false;
      const message: ChatMessage = {
        id: payload.id,
        role: 'assistant',
        content: payload.content,
        status: 'complete',
        createdAt: payload.sentAt,
      };
      this.messages.push(message);
    },

    receiveChunk(chunk: StreamingChunk): void {
      this.isTyping = false;
      const existing = this.messages.find((message) => message.id === chunk.messageId);
      if (existing) {
        existing.content += chunk.delta;
        existing.status = chunk.done ? 'complete' : 'streaming';
        return;
      }
      this.messages.push({
        id: chunk.messageId,
        role: 'assistant',
        content: chunk.delta,
        status: chunk.done ? 'complete' : 'streaming',
        createdAt: new Date().toISOString(),
      });
    },
  },
});
