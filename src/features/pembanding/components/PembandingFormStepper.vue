<script setup lang="ts">
import { FORM_STEPS } from '../types/form'

const props = defineProps<{
  currentStep: number
  totalSteps?: number
}>()

defineEmits<{
  'go-to': [step: number]
}>()

const steps = FORM_STEPS
</script>

<template>
  <nav class="form-stepper" aria-label="Langkah formulir">
    <ol class="form-stepper__list">
      <li
        v-for="(step, index) in steps"
        :key="index"
        class="form-stepper__item"
        :class="{
          'form-stepper__item--done': index < props.currentStep,
          'form-stepper__item--active': index === props.currentStep,
        }"
      >
        <button
          type="button"
          class="form-stepper__button"
          :aria-current="index === props.currentStep ? 'step' : undefined"
          :disabled="index > props.currentStep"
          @click="$emit('go-to', index)"
        >
          <span class="form-stepper__indicator" aria-hidden="true">
            <i v-if="index < props.currentStep" class="pi pi-check" />
            <span v-else>{{ index + 1 }}</span>
          </span>
          <span class="form-stepper__label">
            <strong>{{ step.label }}</strong>
            <small>{{ step.description }}</small>
          </span>
        </button>
        <span v-if="index < steps.length - 1" class="form-stepper__connector" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.form-stepper__list {
  display: flex;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
}

.form-stepper__item {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.form-stepper__button {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  padding: 4px 0;
  cursor: pointer;
  text-align: left;
  white-space: nowrap;
}

.form-stepper__button:disabled {
  cursor: default;
}

.form-stepper__indicator {
  display: flex;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 700;
  transition: border-color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.form-stepper__item--done .form-stepper__indicator {
  border-color: var(--color-action-primary);
  background: var(--color-action-primary);
  color: var(--color-surface);
}

.form-stepper__item--active .form-stepper__indicator {
  border-color: var(--color-action-primary);
  background: var(--color-brand-amber-soft);
  color: var(--color-action-primary);
}

.form-stepper__label {
  display: grid;
}

.form-stepper__label strong {
  color: var(--color-ink-strong);
  font-size: 0.8125rem;
  line-height: 1.3;
}

.form-stepper__item--active .form-stepper__label strong {
  color: var(--color-action-primary);
}

.form-stepper__label small {
  color: var(--color-ink-muted);
  font-size: 0.6875rem;
}

.form-stepper__connector {
  flex: 1;
  height: 2px;
  margin-inline: 8px;
  background: var(--color-border-soft);
}

.form-stepper__item--done .form-stepper__connector {
  background: var(--color-action-primary);
}

@media (max-width: 639px) {
  .form-stepper__label {
    display: none;
  }

  .form-stepper__button {
    gap: 0;
  }
}
</style>
