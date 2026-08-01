// Mock WebSocket backend for the AI Overlay chat client.
//
// Speaks exactly the wire protocol the client expects (see
// src/shared/api/types/websocket.ts): receives `chat`/`ping` messages, replies
// with `typing` / `chunk` / `pong`. No AI, no external services — replies are
// picked from a canned list and streamed back word by word.

import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT) || 8080;

const CANNED_REPLIES = [
  "Hello! I'm a mock AI response, streamed from a local WebSocket server.",
  "I don't call any real AI model — everything I say comes from a canned list.",
  'Sure, I can help with that. This overlay is built with Vue 3, TypeScript, and Tauri.',
  "That's a great question. Streaming responses word by word makes the UI feel alive.",
  "Here's a short reply to keep the conversation moving along.",
  'Connection looks good on my end. Let me know if you need anything else.',
  'This is a longer canned reply, meant to show off streaming over a few more chunks so the typing effect has time to breathe before it finishes.',
];

function pickReply() {
  return CANNED_REPLIES[Math.floor(Math.random() * CANNED_REPLIES.length)];
}

function randomDelay(minMs, maxMs) {
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

function isRecord(value) {
  return typeof value === 'object' && value !== null;
}

// Structural validation, mirroring the client's own parseServerMessage — never
// trust a payload just because JSON.parse succeeded.
function parseClientMessage(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || typeof data.type !== 'string') return null;

  switch (data.type) {
    case 'chat':
      return typeof data.id === 'string' &&
        typeof data.content === 'string' &&
        typeof data.sentAt === 'string'
        ? { type: 'chat', id: data.id, content: data.content, sentAt: data.sentAt }
        : null;
    case 'ping':
      return { type: 'ping' };
    default:
      return null;
  }
}

function send(socket, message) {
  if (socket.readyState !== socket.OPEN) return;
  socket.send(JSON.stringify(message));
}

// Streams `text` back as a sequence of `chunk` messages sharing one messageId,
// word by word, with a small random delay between each to read as typing.
// Calls `onDone` once the final chunk has gone out. Returns a cancel function
// so a disconnect mid-stream can stop the timers instead of leaking them.
function streamReply(socket, text, onDone) {
  const messageId = randomUUID();
  const words = text.split(' ');
  let cancelled = false;
  let index = 0;
  let timer = null;

  function sendNext() {
    if (cancelled) return;
    const isLast = index === words.length - 1;
    const delta = index === 0 ? words[index] : ` ${words[index]}`;
    send(socket, { type: 'chunk', chunk: { messageId, delta, done: isLast } });
    index += 1;
    if (isLast) {
      onDone();
    } else {
      timer = setTimeout(sendNext, randomDelay(30, 90));
    }
  }

  sendNext();
  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket) => {
  console.log(`[server] client connected (${wss.clients.size} total)`);

  let cancelStream = null;
  const pendingTimers = new Set();

  function schedule(fn, delayMs) {
    const timer = setTimeout(() => {
      pendingTimers.delete(timer);
      fn();
    }, delayMs);
    pendingTimers.add(timer);
    return timer;
  }

  socket.on('message', (raw) => {
    const message = parseClientMessage(raw.toString());
    if (!message) {
      send(socket, { type: 'error', message: 'Received invalid payload from client' });
      return;
    }

    if (message.type === 'ping') {
      send(socket, { type: 'pong' });
      return;
    }

    // message.type === 'chat'
    send(socket, { type: 'typing', isTyping: true });
    schedule(
      () => {
        cancelStream = streamReply(socket, pickReply(), () => {
          send(socket, { type: 'typing', isTyping: false });
        });
      },
      randomDelay(500, 1200),
    );
  });

  socket.on('close', () => {
    console.log(`[server] client disconnected (${wss.clients.size} total)`);
    cancelStream?.();
    for (const timer of pendingTimers) clearTimeout(timer);
    pendingTimers.clear();
  });

  socket.on('error', (error) => {
    console.error('[server] socket error:', error.message);
  });
});

wss.on('listening', () => {
  console.log(`[server] mock AI WebSocket server listening on ws://localhost:${PORT}`);
});

wss.on('error', (error) => {
  console.error('[server] server error:', error.message);
});

function shutdown() {
  console.log('\n[server] shutting down...');
  for (const client of wss.clients) {
    client.close(1001, 'server shutting down');
  }
  wss.close(() => {
    console.log('[server] closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
