<script setup lang="ts">
withDefaults(
  defineProps<{
    as?: 'article' | 'div' | 'section'
    inset?: boolean
  }>(),
  {
    as: 'section',
    inset: false,
  },
)
</script>

<template>
  <component :is="as" class="ui-surface" :class="{ 'ui-surface--inset': inset }">
    <slot />
  </component>
</template>

<style scoped>
.ui-surface {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-surface);
  background: var(--color-surface);
  padding: 16px;
}

.ui-surface--inset {
  border-color: transparent;
  background: var(--color-surface-inset);
}
</style>
