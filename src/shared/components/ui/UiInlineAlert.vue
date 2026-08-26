<script setup lang="ts">
import { computed } from 'vue'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    title: string
    tone?: AlertTone
    dismissible?: boolean
  }>(),
  {
    tone: 'info',
    dismissible: false,
  },
)

defineEmits<{ dismiss: [] }>()

const icons: Record<AlertTone, string> = {
  info: 'pi pi-info-circle',
  success: 'pi pi-check-circle',
  warning: 'pi pi-exclamation-triangle',
  error: 'pi pi-times-circle',
}
const icon = computed(() => icons[props.tone])
</script>

<template>
  <div class="ui-alert" :class="`ui-alert--${tone}`" role="alert">
    <i :class="icon" aria-hidden="true" />
    <div>
      <p class="ui-alert__title">{{ title }}</p>
      <div class="ui-alert__body"><slot /></div>
    </div>
    <button
      v-if="dismissible"
      class="ui-alert__dismiss"
      type="button"
      aria-label="Tutup pesan"
      @click="$emit('dismiss')"
    >
      <i class="pi pi-times" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.ui-alert {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: flex-start;
  gap: 10px;
  border-radius: var(--radius-control);
  padding: 12px;
}

.ui-alert--info {
  background: oklch(0.97 0.014 254.6);
  color: var(--color-info);
}

.ui-alert--success {
  background: oklch(0.962 0.044 156.74);
  color: var(--color-success);
}

.ui-alert--warning {
  background: var(--color-brand-amber-soft);
  color: var(--color-warning-text);
}

.ui-alert--error {
  background: oklch(0.971 0.013 17.38);
  color: oklch(0.444 0.177 26.9);
}

.ui-alert__title {
  margin: 0;
  color: currentColor;
  font-weight: 700;
}

.ui-alert__body {
  color: var(--color-ink-body);
}

.ui-alert__body :deep(p:last-child) {
  margin-bottom: 0;
}

.ui-alert__dismiss {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: currentColor;
  cursor: pointer;
}

.ui-alert__dismiss:hover {
  background: rgb(15 23 42 / 0.07);
}
</style>
