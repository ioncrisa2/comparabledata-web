<script setup lang="ts">
import { computed, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    for?: string
    required?: boolean
    help?: string
    error?: string
  }>(),
  {
    for: undefined,
    required: false,
    help: undefined,
    error: undefined,
  },
)

const generatedId = useId()
const inputId = computed(() => props.for ?? `field-${generatedId}`)
const helpId = computed(() => `${inputId.value}-help`)
const errorId = computed(() => `${inputId.value}-error`)
const describedBy = computed(() => {
  const ids = []
  if (props.help) ids.push(helpId.value)
  if (props.error) ids.push(errorId.value)
  return ids.join(' ') || undefined
})
</script>

<template>
  <div class="ui-field" :class="{ 'ui-field--invalid': Boolean(error) }">
    <label class="ui-field__label" :for="inputId">
      {{ label }}
      <span v-if="required" class="ui-field__required" aria-hidden="true">*</span>
      <span v-if="required" class="sr-only">wajib</span>
    </label>
    <slot :input-id="inputId" :described-by="describedBy" :invalid="Boolean(error)" />
    <p v-if="help" :id="helpId" class="ui-field__help">{{ help }}</p>
    <p v-if="error" :id="errorId" class="ui-field__error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true" />
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
.ui-field {
  display: grid;
  gap: 6px;
}

.ui-field__label {
  color: var(--color-ink-body);
  font-size: 0.75rem;
  font-weight: 650;
}

.ui-field__required,
.ui-field__error {
  color: var(--color-danger);
}

.ui-field__help,
.ui-field__error {
  margin: 0;
  font-size: 0.75rem;
}

.ui-field__help {
  color: var(--color-ink-muted);
}

.ui-field__error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.ui-field :deep(input),
.ui-field :deep(select),
.ui-field :deep(textarea) {
  width: 100%;
  min-height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink-strong);
  padding: 9px 12px;
}

.ui-field :deep(input::placeholder),
.ui-field :deep(textarea::placeholder) {
  color: var(--color-ink-muted);
  opacity: 1;
}

.ui-field :deep(input:hover:not(:disabled)),
.ui-field :deep(select:hover:not(:disabled)),
.ui-field :deep(textarea:hover:not(:disabled)) {
  border-color: var(--color-ink-muted);
}

.ui-field :deep(input:focus-visible),
.ui-field :deep(select:focus-visible),
.ui-field :deep(textarea:focus-visible) {
  border-color: var(--color-action-primary);
}

.ui-field--invalid :deep(input),
.ui-field--invalid :deep(select),
.ui-field--invalid :deep(textarea) {
  border-color: var(--color-danger);
}

.ui-field :deep(:disabled) {
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
  cursor: not-allowed;
}

@media (pointer: coarse) {
  .ui-field :deep(input),
  .ui-field :deep(select),
  .ui-field :deep(textarea) {
    min-height: 44px;
  }
}
</style>
