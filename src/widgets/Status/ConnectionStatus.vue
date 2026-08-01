<script setup lang="ts">
// Presentational only — driven entirely by the `status` prop, sourced from
// the real chat store (see widgets/Overlay/Overlay.vue).
import { computed } from 'vue';

import type { ConnectionStatus as ConnectionStatusValue } from '@/shared/api/types/websocket';
import { Flex, Loader, Text } from '@/shared/ui';

const props = defineProps<{
  status: ConnectionStatusValue;
}>();

const meta = computed(() => {
  switch (props.status) {
    case 'open':
      return { label: 'Connected', color: 'success' as const };
    case 'connecting':
      return { label: 'Connecting…', color: 'warning' as const };
    case 'reconnecting':
      return { label: 'Reconnecting…', color: 'warning' as const };
    case 'error':
      return { label: 'Connection error', color: 'danger' as const };
    case 'closed':
      return { label: 'Disconnected', color: 'muted' as const };
    case 'idle':
    default:
      return { label: 'Idle', color: 'muted' as const };
  }
});

const isBusy = computed(() => props.status === 'connecting' || props.status === 'reconnecting');
</script>

<template>
  <Flex align="center" gap="sm" class="connection-status" role="status" aria-live="polite">
    <span
      class="connection-status__dot"
      :class="`connection-status__dot--${status}`"
      aria-hidden="true"
    />
    <Text variant="caption" :color="meta.color">{{ meta.label }}</Text>
    <Loader v-if="isBusy" size="sm" />
  </Flex>
</template>

<style scoped lang="scss">
.connection-status {
  &__dot {
    width: 7px;
    height: 7px;
    flex-shrink: 0;
    border-radius: 50%;
    background-color: var(--color-text-muted);
    transition: background-color $transition-base;

    &--open {
      background-color: var(--color-success);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-success) 25%, transparent);
    }
    &--connecting,
    &--reconnecting {
      background-color: var(--color-warning);
    }
    &--error {
      background-color: var(--color-danger);
    }
    &--idle,
    &--closed {
      background-color: var(--color-text-muted);
    }
  }
}
</style>
