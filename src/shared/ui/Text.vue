<script setup lang="ts">
// Typography primitive. Renders the shared `.text-*` classes from
// shared/styles/_typography.scss so components stop writing one-off
// font-size/weight/line-height rules — reach for a new `variant` there
// (and here) before adding a local override.

type Variant = 'heading-lg' | 'heading-md' | 'body' | 'body-sm' | 'caption' | 'mono';
type Color =
  'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'warning' | 'danger' | 'inherit';

withDefaults(
  defineProps<{
    as?: string;
    variant?: Variant;
    color?: Color;
    truncate?: boolean;
  }>(),
  {
    as: 'span',
    variant: 'body',
    color: 'primary',
    truncate: false,
  },
);
</script>

<template>
  <component :is="as" :class="[`text-${variant}`, `text--color-${color}`, { truncate }]">
    <slot />
  </component>
</template>

<style scoped lang="scss">
// `.text-caption` (global) sets its own muted color. These rules still win:
// Vue's scoped-style attribute selector adds specificity a plain global
// class doesn't have, so the `color` prop always overrides the variant default.
.text {
  &--color-primary {
    color: var(--color-text-primary);
  }
  &--color-secondary {
    color: var(--color-text-secondary);
  }
  &--color-muted {
    color: var(--color-text-muted);
  }
  &--color-accent {
    color: var(--color-accent);
  }
  &--color-success {
    color: var(--color-success);
  }
  &--color-warning {
    color: var(--color-warning);
  }
  &--color-danger {
    color: var(--color-danger);
  }
  &--color-inherit {
    color: inherit;
  }
}
</style>
