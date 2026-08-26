<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    rounded?: boolean
  }>(),
  {
    width: '100%',
    height: '1rem',
    rounded: false,
  },
)
</script>

<template>
  <span
    class="ui-skeleton"
    :class="{ 'ui-skeleton--rounded': rounded }"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<style scoped>
.ui-skeleton {
  display: block;
  overflow: hidden;
  border-radius: 6px;
  background: var(--color-border);
  position: relative;
}

.ui-skeleton::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.75), transparent);
  content: '';
  translate: -100% 0;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

.ui-skeleton--rounded {
  border-radius: 999px;
}

@keyframes skeleton-shimmer {
  to {
    translate: 100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ui-skeleton::after {
    display: none;
  }
}
</style>
