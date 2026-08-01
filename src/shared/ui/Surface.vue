<script setup lang="ts">
// Themed container: the only primitive that sets background/border/elevation.
// Reach for this instead of a bare <div> with ad-hoc `var(--color-*)` rules
// whenever a component needs a distinct visual layer (panel, card, popover).

type Variant = 'surface' | 'elevated' | 'bg';
type Padding = 'none' | 'sm' | 'md' | 'lg';
type Radius = 'none' | 'sm' | 'md' | 'lg';
type Elevation = 'none' | 'sm' | 'md' | 'lg';

withDefaults(
  defineProps<{
    as?: string;
    variant?: Variant;
    padding?: Padding;
    radius?: Radius;
    elevation?: Elevation;
    bordered?: boolean;
  }>(),
  {
    as: 'div',
    variant: 'surface',
    padding: 'none',
    radius: 'md',
    elevation: 'none',
    bordered: false,
  },
);
</script>

<template>
  <component
    :is="as"
    class="surface"
    :class="[
      `surface--variant-${variant}`,
      `surface--padding-${padding}`,
      `surface--radius-${radius}`,
      `surface--elevation-${elevation}`,
      { 'surface--bordered': bordered },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.surface {
  &--variant-surface {
    background-color: var(--color-surface);
  }
  &--variant-elevated {
    background-color: var(--color-bg-elevated);
  }
  &--variant-bg {
    background-color: var(--color-bg);
  }

  &--padding-sm {
    padding: $space-2;
  }
  &--padding-md {
    padding: $space-4;
  }
  &--padding-lg {
    padding: $space-6;
  }

  &--radius-none {
    border-radius: 0;
  }
  &--radius-sm {
    border-radius: $radius-sm;
  }
  &--radius-md {
    border-radius: $radius-md;
  }
  &--radius-lg {
    border-radius: $radius-lg;
  }

  &--elevation-sm {
    box-shadow: $shadow-sm;
  }
  &--elevation-md {
    box-shadow: $shadow-md;
  }
  &--elevation-lg {
    box-shadow: $shadow-lg;
  }

  &--bordered {
    border: 1px solid var(--color-border);
  }
}
</style>
