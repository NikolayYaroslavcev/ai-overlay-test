<script setup lang="ts">
// Purely presentational — a styled submit button. InputArea's <form> handles
// both Enter-to-send and click-to-send, so this component owns no logic.
import { Icon } from '@/shared/ui';

withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);
</script>

<template>
  <button
    type="submit"
    class="send-button"
    :disabled="disabled"
    aria-label="Send message"
    title="Send message"
  >
    <Icon size="sm">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </Icon>
  </button>
</template>

<style scoped lang="scss">
.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: $space-6;
  height: $space-6;
  border: none;
  border-radius: 50%;
  background-color: var(--color-accent);
  color: var(--color-bg);
  cursor: pointer;
  transition:
    background-color $transition-fast,
    opacity $transition-fast,
    transform $transition-fast;

  &:hover:not(:disabled) {
    background-color: var(--color-accent-hover);
  }

  &:active:not(:disabled) {
    transform: scale(0.94);
  }

  &:disabled {
    background-color: var(--color-surface);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
}
</style>
