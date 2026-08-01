<script setup lang="ts">
// Presentational scroll region — renders whatever messages/isTyping it's
// given and keeps itself pinned to the latest message. No knowledge of where
// the data comes from, so wiring the real store later is a prop change only.
import { nextTick, ref, watch } from 'vue';

import type { ChatMessage } from '@/entities/chat';
import { Text } from '@/shared/ui';

import MessageBubble from './MessageBubble.vue';
import TypingIndicator from './TypingIndicator.vue';

const props = defineProps<{
  messages: ChatMessage[];
  isTyping: boolean;
}>();

const scrollRef = ref<HTMLElement | null>(null);

function scrollToBottom(): void {
  const el = scrollRef.value;
  if (!el) return;
  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
}

watch(
  () => [props.messages.length, props.isTyping],
  () => {
    void nextTick(() => scrollToBottom());
  },
  { immediate: true },
);
</script>

<template>
  <div
    ref="scrollRef"
    class="conversation scrollbar-thin"
    role="log"
    aria-live="polite"
    aria-relevant="additions"
    aria-label="Conversation"
  >
    <div v-if="props.messages.length === 0" class="conversation__empty">
      <Text variant="body-sm" color="muted">No messages yet — say hello.</Text>
    </div>

    <template v-else>
      <MessageBubble v-for="message in props.messages" :key="message.id" :message="message" />
      <TypingIndicator v-if="props.isTyping" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.conversation {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  flex: 1;
  min-height: 0;
  padding: $space-3 $space-4;
  overflow-y: auto;
  overscroll-behavior: contain;

  &__empty {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
}
</style>
