<script setup lang="ts">
// Owns the textarea's local draft text and auto-grow behavior; emits `send`
// with the trimmed content and clears itself. No knowledge of connection
// status or where sent messages go — Overlay decides that.
import { nextTick, ref, watch } from 'vue';

import { Flex, Surface } from '@/shared/ui';

import SendButton from './SendButton.vue';

const MAX_HEIGHT_PX = 160;

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  send: [content: string];
}>();

const draft = ref('');
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoGrow(): void {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
}

function handleSend(): void {
  const trimmed = draft.value.trim();
  if (!trimmed || props.disabled) return;
  emit('send', trimmed);
  draft.value = '';
  void nextTick(autoGrow);
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

watch(draft, () => {
  void nextTick(autoGrow);
});
</script>

<template>
  <form class="input-area" novalidate @submit.prevent="handleSend">
    <Surface as="div" variant="surface" padding="sm" radius="lg" class="input-area__surface">
      <Flex align="end" gap="sm">
        <label class="visually-hidden" for="chat-input">Message</label>
        <textarea
          id="chat-input"
          ref="textareaRef"
          v-model="draft"
          class="input-area__textarea scrollbar-thin"
          rows="1"
          placeholder="Ask anything…"
          :disabled="props.disabled"
          @keydown="handleKeydown"
          @input="autoGrow"
        />
        <SendButton :disabled="props.disabled || draft.trim().length === 0" />
      </Flex>
    </Surface>
  </form>
</template>

<style scoped lang="scss">
.input-area {
  padding: $space-2 $space-4 $space-3;

  &__surface {
    background-color: color-mix(in srgb, var(--color-surface) 82%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
    transition:
      border-color $transition-fast,
      background-color $transition-fast;

    &:focus-within {
      border-color: var(--color-accent);
      background-color: var(--color-surface);
    }
  }

  &__textarea {
    flex: 1;
    min-width: 0;
    max-height: 160px;
    padding: $space-1 0;
    border: none;
    background: transparent;
    color: var(--color-text-primary);
    font-family: inherit;
    font-size: $font-size-md;
    line-height: $line-height-base;
    resize: none;
    outline: none;

    &::placeholder {
      color: var(--color-text-muted);
    }

    &:disabled {
      color: var(--color-text-muted);
      cursor: not-allowed;
    }
  }
}
</style>
