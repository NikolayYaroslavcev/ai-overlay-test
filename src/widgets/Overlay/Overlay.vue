<script setup lang="ts">
// Composition root: wires the real chat store to the presentational widgets
// below. The bridge (WebSocket -> store) is already active from app
// bootstrap (see app/providers/chat.provider.ts) — this component only owns
// the socket's connect/disconnect lifecycle for as long as it's mounted and
// forwards store state/actions down as the same props/emits the mock used.
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted } from 'vue';

import { useChatStore } from '@/entities/chat';
import { Stack } from '@/shared/ui';
import { Conversation } from '@/widgets/Chat';
import { InputArea } from '@/widgets/Input';
import { TopBar } from '@/widgets/TopBar';

const store = useChatStore();
const { messages, isTyping, connectionStatus } = storeToRefs(store);

onMounted(() => store.connect());
onUnmounted(() => store.disconnect());
</script>

<template>
  <Stack as="main" class="overlay">
    <TopBar :status="connectionStatus" @reconnect="store.reconnect()" />
    <Conversation :messages="messages" :is-typing="isTyping" />
    <InputArea @send="store.sendMessage" />
  </Stack>
</template>

<style scoped lang="scss">
.overlay {
  height: 100%;
  overflow: hidden;
  border-radius: $radius-lg;
  border: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
  background-color: color-mix(in srgb, var(--color-bg) 78%, transparent);
  backdrop-filter: blur(24px) saturate(1.3);
  -webkit-backdrop-filter: blur(24px) saturate(1.3);
  box-shadow:
    $shadow-lg,
    inset 0 1px 0 color-mix(in srgb, var(--color-text-primary) 6%, transparent);
  animation: overlay-in $duration-base $easing-standard both;
}

@keyframes overlay-in {
  from {
    opacity: 0;
    transform: scale(0.98) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay {
    animation: none;
  }
}
</style>
