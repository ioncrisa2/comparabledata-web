<script setup lang="ts">
import UiButton from '@/shared/components/ui/UiButton.vue'

withDefaults(
  defineProps<{
    dirty?: boolean
    loading?: boolean
    disabled?: boolean
    submitLabel?: string
    cancelLabel?: string
  }>(),
  {
    dirty: false,
    loading: false,
    disabled: false,
    submitLabel: 'Simpan perubahan',
    cancelLabel: 'Batal',
  },
)

defineEmits<{
  submit: []
  cancel: []
}>()
</script>

<template>
  <footer class="form-actions">
    <p class="form-actions__status" aria-live="polite">
      <i :class="dirty ? 'pi pi-circle-fill' : 'pi pi-check-circle'" aria-hidden="true" />
      {{ dirty ? 'Ada perubahan yang belum disimpan' : 'Semua perubahan telah disimpan' }}
    </p>
    <div class="form-actions__buttons">
      <UiButton :disabled="loading" @click="$emit('cancel')">{{ cancelLabel }}</UiButton>
      <UiButton
        variant="primary"
        :loading="loading"
        :disabled="disabled || !dirty"
        @click="$emit('submit')"
      >
        {{ submitLabel }}
      </UiButton>
    </div>
  </footer>
</template>

<style scoped>
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 16px;
}

.form-actions__status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}

.form-actions__status .pi-circle-fill {
  color: var(--color-warning-text);
  font-size: 0.5rem;
}

.form-actions__status .pi-check-circle {
  color: var(--color-success);
}

.form-actions__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 639px) {
  .form-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .form-actions__buttons > * {
    flex: 1;
  }
}
</style>
