<script setup lang="ts">
// Purely presentational, no props — mirrors an assistant bubble's shape so it
// reads as "the next message is forming here" rather than a generic spinner.
</script>

<template>
  <div class="typing" role="status" aria-label="Assistant is typing">
    <span class="typing__dot" />
    <span class="typing__dot" />
    <span class="typing__dot" />
  </div>
</template>

<style scoped lang="scss">
.typing {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  padding: $space-3 $space-3;
  border-radius: $radius-lg;
  border-bottom-left-radius: $radius-sm;
  background-color: color-mix(in srgb, var(--color-surface) 100%, var(--color-text-primary) 6%);
  border: 1px solid color-mix(in srgb, var(--color-border) 70%, transparent);
  animation: message-in $duration-fast $easing-standard both;

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--color-text-muted);
    animation: typing-bounce 1200ms $easing-standard infinite;

    &:nth-child(2) {
      animation-delay: 150ms;
    }
    &:nth-child(3) {
      animation-delay: 300ms;
    }
  }
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-3px);
    opacity: 1;
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

@media (prefers-reduced-motion: reduce) {
  .typing {
    animation: none;
  }
  .typing__dot {
    animation: none;
    opacity: 0.8;
  }
}
</style>
