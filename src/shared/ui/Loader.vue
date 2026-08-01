<script setup lang="ts">
// Indeterminate spinner. Own element (not built on Icon) since it animates
// and carries `role="status"` rather than wrapping arbitrary slotted content.

type Size = 'sm' | 'md' | 'lg';

withDefaults(
  defineProps<{
    size?: Size;
    label?: string;
  }>(),
  {
    size: 'md',
    label: 'Loading',
  },
);
</script>

<template>
  <span class="loader" :class="`loader--size-${size}`" role="status" :aria-label="label" />
</template>

<style scoped lang="scss">
.loader {
  display: inline-block;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: loader-spin 700ms $easing-linear infinite;

  &--size-sm {
    width: $space-3;
    height: $space-3;
  }
  &--size-md {
    width: $space-4;
    height: $space-4;
  }
  &--size-lg {
    width: $space-6;
    height: $space-6;
  }
}

@keyframes loader-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
