<script setup lang="ts">
// Vertical layout primitive. For horizontal or direction-configurable layout,
// use Flex instead — Stack exists so the common "column of things with a gap"
// case doesn't need a direction prop at every call site.

type Gap = 'none' | 'sm' | 'md' | 'lg';
type Align = 'start' | 'center' | 'end' | 'stretch';
type Justify = 'start' | 'center' | 'end' | 'between';

withDefaults(
  defineProps<{
    as?: string;
    gap?: Gap;
    align?: Align;
    justify?: Justify;
  }>(),
  {
    as: 'div',
    gap: 'none',
    align: 'stretch',
    justify: 'start',
  },
);
</script>

<template>
  <component
    :is="as"
    class="stack"
    :class="[`stack--gap-${gap}`, `stack--align-${align}`, `stack--justify-${justify}`]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.stack {
  display: flex;
  flex-direction: column;

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
}
</style>
