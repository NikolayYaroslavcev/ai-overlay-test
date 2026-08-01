<script setup lang="ts">
// Presentational only — renders whatever ChatMessage it's given. Fully
// respects the domain model's `status` field (pending/streaming/error) so it
// behaves correctly the moment real messages replace the mock ones, with no
// changes needed here.
import { computed } from 'vue';

import type { ChatMessage } from '@/entities/chat';
import { Text } from '@/shared/ui';
import { formatTimestamp } from '@/utils/formatters/formatTimestamp';

const props = defineProps<{
  message: ChatMessage;
}>();

const isUser = computed(() => props.message.role === 'user');
</script>

<template>
  <div
    class="message"
    :class="[`message--${props.message.role}`, `message--${props.message.status}`]"
  >
    <div class="message__bubble">
      <Text
        as="p"
        variant="body-sm"
        :color="isUser ? 'inherit' : 'primary'"
        class="message__content"
      >
        {{ props.message.content
        }}<span
          v-if="props.message.status === 'streaming'"
          class="message__cursor"
          aria-hidden="true"
        />
      </Text>
    </div>
    <Text
      as="span"
      variant="caption"
      :color="props.message.status === 'error' ? 'danger' : 'muted'"
      class="message__time"
    >
      {{
        props.message.status === 'error'
          ? 'Failed to send'
          : formatTimestamp(props.message.createdAt)
      }}
    </Text>
  </div>
</template>

<style scoped lang="scss">
.message {
  display: flex;
  flex-direction: column;
  max-width: min(80%, 30rem);
  animation: message-in $duration-fast $easing-standard both;

  &--user {
    align-self: flex-end;
    align-items: flex-end;
  }

  &--assistant {
    align-self: flex-start;
    align-items: flex-start;
  }

  &--pending {
    opacity: $opacity-hover;
  }

  &__bubble {
    padding: $space-2 $space-3;
    border-radius: $radius-lg;
    word-break: break-word;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  &--user &__bubble {
    background-color: var(--color-accent);
    color: var(--color-bg);
    border-bottom-right-radius: $radius-sm;
  }

  &--assistant &__bubble {
    background-color: color-mix(in srgb, var(--color-surface) 100%, var(--color-text-primary) 6%);
    border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
    border-bottom-left-radius: $radius-sm;
  }

  &--error &__bubble {
    background-color: color-mix(in srgb, var(--color-danger) 7%, var(--color-surface));
    border: 1px solid color-mix(in srgb, var(--color-danger) 40%, transparent);
    color: var(--color-text-primary);
  }

  &__content {
    display: block;
  }

  &__cursor {
    display: inline-block;
    width: 2px;
    height: 0.9em;
    margin-left: 2px;
    vertical-align: text-bottom;
    background-color: currentColor;
    animation: message-cursor-blink 900ms steps(1) infinite;
  }

  &__time {
    margin-top: $space-1;
    padding: 0 $space-1;
  }
}

@keyframes message-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes message-cursor-blink {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .message {
    animation: none;
  }
  .message__cursor {
    animation: none;
  }
}
</style>
