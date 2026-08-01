<script setup lang="ts">
// General-purpose flex layout primitive (row by default). Use Stack instead
// when the layout is a plain vertical list — it reads clearer at call sites.

type Direction = 'row' | 'column';
type Gap = 'none' | 'sm' | 'md' | 'lg';
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around';

withDefaults(
  defineProps<{
    as?: string;
    direction?: Direction;
    gap?: Gap;
    align?: Align;
    justify?: Justify;
    wrap?: boolean;
  }>(),
  {
    as: 'div',
    direction: 'row',
    gap: 'none',
    align: 'stretch',
    justify: 'start',
    wrap: false,
  },
);
</script>

<template>
  <component
    :is="as"
    class="flex"
    :class="[
      `flex--direction-${direction}`,
      `flex--gap-${gap}`,
      `flex--align-${align}`,
      `flex--justify-${justify}`,
      { 'flex--wrap': wrap },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.flex {
  display: flex;

  &--direction-row {
    flex-direction: row;
  }
  &--direction-column {
    flex-direction: column;
  }

  &--gap-sm {
    gap: $space-2;
  }
  &--gap-md {
    gap: $space-4;
  }
  &--gap-lg {
    gap: $space-6;
  }

  &--align-start {
    align-items: flex-start;
  }
  &--align-center {
    align-items: center;
  }
  &--align-end {
    align-items: flex-end;
  }
  &--align-stretch {
    align-items: stretch;
  }
  &--align-baseline {
    align-items: baseline;
  }

  &--justify-start {
    justify-content: flex-start;
  }
  &--justify-center {
    justify-content: center;
  }
  &--justify-end {
    justify-content: flex-end;
  }
  &--justify-between {
    justify-content: space-between;
  }
  &--justify-around {
    justify-content: space-around;
  }

  &--wrap {
    flex-wrap: wrap;
  }
}
</style>
