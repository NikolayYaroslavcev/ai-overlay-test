<script setup lang="ts">
// Sizing/color wrapper around an inline SVG passed via the default slot.
// No icon set is chosen yet (deferred per ADR 0001) — this primitive is the
// seam that keeps icon sizing/coloring consistent regardless of which set
// eventually fills the slot content.

type Size = 'sm' | 'md' | 'lg';

withDefaults(
  defineProps<{
    size?: Size;
    // No default: absence is meaningful (decorative icon -> aria-hidden)
    // rather than a value that merely hasn't been set yet.
    // eslint-disable-next-line vue/require-default-prop
    label?: string;
  }>(),
  {
    size: 'md',
  },
);
</script>

<template>
  <span
    class="icon"
    :class="`icon--size-${size}`"
    role="img"
    :aria-hidden="label ? undefined : 'true'"
    :aria-label="label"
  >
    <slot />
  </span>
</template>

<style scoped lang="scss">
.icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: currentColor;

  :deep(svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }

  // Sized off the type scale so icons default to matching the text they sit
  // next to, instead of needing a separate icon-size scale.
  &--size-sm {
    width: $font-size-sm;
    height: $font-size-sm;
  }
  &--size-md {
    width: $font-size-md;
    height: $font-size-md;
  }
  &--size-lg {
    width: $font-size-lg;
    height: $font-size-lg;
  }
}
</style>
