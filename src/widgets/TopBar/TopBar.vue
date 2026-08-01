<script setup lang="ts">
// Presentational only — `status` in, `reconnect` out. Owns the window drag
// region since it's the one strip of chrome that should feel native/draggable;
// the reconnect button sits inside it but stays independently clickable
// (Tauri's data-tauri-drag-region only arms the exact element it's set on).
import { computed } from 'vue';

import type { ConnectionStatus as ConnectionStatusValue } from '@/shared/api/types/websocket';
import { Flex, Icon, Text } from '@/shared/ui';
import { ConnectionStatus } from '@/widgets/Status';

const props = defineProps<{
  status: ConnectionStatusValue;
}>();

defineEmits<{
  reconnect: [];
}>();

const isReconnectProminent = computed(() => props.status !== 'open');
</script>

<template>
  <Flex as="header" align="center" justify="between" class="top-bar" data-tauri-drag-region>
    <Flex align="center" gap="sm" class="top-bar__brand">
      <span class="top-bar__mark" aria-hidden="true" />
      <Text as="h1" variant="heading-md" truncate>AI Overlay</Text>
    </Flex>

    <Flex align="center" gap="sm" class="top-bar__actions">
      <ConnectionStatus :status="props.status" />

      <span class="top-bar__divider" aria-hidden="true" />

      <button
        type="button"
        class="top-bar__reconnect"
        :class="{ 'top-bar__reconnect--prominent': isReconnectProminent }"
        title="Reconnect"
        aria-label="Reconnect"
        @click="$emit('reconnect')"
      >
        <Icon
          size="sm"
          :class="{ 'top-bar__reconnect-icon--spin': props.status === 'reconnecting' }"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-3.05-6.74" />
            <path d="M21 4v5h-5" />
          </svg>
        </Icon>
      </button>
    </Flex>
  </Flex>
</template>

<style scoped lang="scss">
.top-bar {
  padding: $space-3 $space-4;
  border-bottom: 1px solid var(--color-border);

  &__brand {
    min-width: 0;
  }

  &__mark {
    width: $space-4;
    height: $space-4;
    flex-shrink: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--color-accent), var(--color-accent-hover));
    box-shadow: 0 0 12px color-mix(in srgb, var(--color-accent) 45%, transparent);
  }

  &__actions {
    flex-shrink: 0;
    padding: $space-1 $space-2;
    border-radius: $radius-lg;
    background-color: color-mix(in srgb, var(--color-surface) 65%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-border) 55%, transparent);
  }

  &__divider {
    width: 1px;
    height: $space-4;
    flex-shrink: 0;
    background-color: var(--color-border);
  }

  &__reconnect {
    display: flex;
    align-items: center;
    justify-content: center;
    width: $space-5;
    height: $space-5;
    padding: 0;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: var(--color-text-muted);
    opacity: $opacity-hover;
    cursor: pointer;
    transition:
      background-color $transition-fast,
      color $transition-fast,
      opacity $transition-fast;

    &:hover {
      background-color: var(--color-bg-elevated);
      color: var(--color-text-primary);
      opacity: 1;
    }

    &--prominent {
      color: var(--color-accent);
      opacity: 1;
    }
  }
}

:deep(.top-bar__reconnect-icon--spin) {
  animation: top-bar-spin 900ms $easing-linear infinite;
}

@keyframes top-bar-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  :deep(.top-bar__reconnect-icon--spin) {
    animation: none;
  }
}
</style>
