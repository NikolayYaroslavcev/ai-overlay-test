<script setup lang="ts">
import { Overlay } from '@/widgets/Overlay';
</script>

<template>
  <div class="app">
    <Overlay />
  </div>
</template>

<style scoped lang="scss">
.app {
  // Fixed + inset instead of height: 100% — the mount point (#app in
  // index.html) has no defined height of its own, so a percentage height
  // here would resolve against `auto` and let the document grow to fit
  // content instead of capping at the window, which is what breaks
  // Conversation's internal scrolling (see widgets/Chat/Conversation.vue).
  position: fixed;
  inset: 0;
  padding: $space-2;
}
</style>
