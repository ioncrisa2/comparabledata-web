<script setup lang="ts">
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

withDefaults(
  defineProps<{
    icon?: string
    tone?: StatusTone
  }>(),
  {
    icon: 'pi pi-circle-fill',
    tone: 'neutral',
  },
)
</script>

<template>
  <span class="ui-status" :class="`ui-status--${tone}`">
    <i :class="icon" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.ui-status {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.4;
}

.ui-status i {
  font-size: 0.55rem;
}

.ui-status--info {
  background: oklch(0.97 0.014 254.6);
  color: var(--color-info);
}

.ui-status--success {
  background: oklch(0.962 0.044 156.74);
  color: var(--color-success);
}

.ui-status--warning {
  background: var(--color-brand-amber-soft);
  color: var(--color-warning-text);
}

.ui-status--danger {
  background: oklch(0.971 0.013 17.38);
  color: oklch(0.444 0.177 26.9);
}
</style>
