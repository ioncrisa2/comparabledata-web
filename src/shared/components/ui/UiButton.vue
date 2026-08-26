<script setup lang="ts">
import { useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    disabled?: boolean
    loadingLabel?: string
  }>(),
  {
    type: 'button',
    variant: 'secondary',
    size: 'md',
    loading: false,
    disabled: false,
    loadingLabel: 'Memproses',
  },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()
const attrs = useAttrs()

function handleClick(event: MouseEvent) {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<template>
  <button
    v-bind="attrs"
    class="ui-button"
    :class="[`ui-button--${variant}`, `ui-button--${size}`]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
    @click="handleClick"
  >
    <i v-if="loading" class="pi pi-spinner pi-spin" aria-hidden="true" />
    <slot name="icon" />
    <span><slot /></span>
    <span v-if="loading" class="sr-only">{{ loadingLabel }}</span>
  </button>
</template>

<style scoped>
.ui-button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: var(--radius-control);
  padding-inline: 16px;
  font-weight: 650;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.ui-button--sm {
  min-height: 36px;
  padding-inline: 12px;
  font-size: 0.8125rem;
}

.ui-button--primary {
  background: var(--color-action-primary);
  color: var(--color-surface);
}

.ui-button--primary:hover:not(:disabled) {
  background: var(--color-action-primary-hover);
}

.ui-button--primary:active:not(:disabled) {
  background: var(--color-action-primary-active);
}

.ui-button--secondary {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-ink-body);
}

.ui-button--secondary:hover:not(:disabled) {
  border-color: var(--color-ink-muted);
  background: var(--color-canvas);
}

.ui-button--secondary:active:not(:disabled) {
  background: var(--color-surface-inset);
}

.ui-button--ghost {
  background: transparent;
  color: var(--color-ink-body);
}

.ui-button--ghost:hover:not(:disabled),
.ui-button--ghost:active:not(:disabled) {
  background: var(--color-surface-inset);
}

.ui-button--danger {
  background: var(--color-danger);
  color: var(--color-surface);
}

.ui-button--danger:hover:not(:disabled) {
  background: oklch(0.505 0.213 27.52);
}

.ui-button--danger:active:not(:disabled) {
  background: oklch(0.444 0.177 26.9);
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@media (pointer: coarse) {
  .ui-button,
  .ui-button--sm {
    min-height: 44px;
  }
}
</style>
