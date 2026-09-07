<script setup lang="ts">
import { reactive, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type { CreatePermissionPayload } from '../api/access-control.api'

const props = defineProps<{
  open: boolean
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: CreatePermissionPayload]
}>()

const form = reactive({
  name: '',
})

const nameError = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.name = ''
      nameError.value = ''
    }
  },
  { immediate: true },
)

function validate(): boolean {
  nameError.value = ''
  const trimmed = form.name.trim()

  if (!trimmed) {
    nameError.value = 'Nama permission wajib diisi.'
    return false
  }

  if (!/^[A-Za-z0-9_:-]+$/.test(trimmed)) {
    nameError.value =
      'Permission hanya boleh memakai huruf, angka, underscore, titik dua, atau strip.'
    return false
  }

  return true
}

function handleSubmit() {
  if (!validate()) return

  emit('save', {
    name: form.name.trim(),
  })
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Tambah Custom Permission"
    width="sm"
    @update:open="emit('update:open', $event)"
  >
    <form class="perm-create-dialog__form" @submit.prevent="handleSubmit">
      <UiInlineAlert
        v-if="error"
        tone="error"
        title="Gagal menambahkan permission"
        class="perm-create-dialog__alert"
      >
        <p>{{ error }}</p>
      </UiInlineAlert>

      <UiField
        label="Nama Permission"
        required
        :error="nameError"
        help="Gunakan format aksi_entitas atau entitas::aksi (contoh: view_audit_report atau export::custom_pdf)."
      >
        <input
          v-model="form.name"
          type="text"
          placeholder="contoh: view_audit_report"
          class="perm-create-dialog__input"
          data-testid="permission-form-name"
        />
      </UiField>
    </form>

    <template #footer>
      <div class="perm-create-dialog__footer">
        <UiButton
          type="button"
          variant="secondary"
          :disabled="loading"
          @click="emit('update:open', false)"
        >
          Batal
        </UiButton>
        <UiButton
          type="button"
          variant="primary"
          :loading="loading"
          loading-label="Menyimpan..."
          data-testid="permission-form-submit"
          @click="handleSubmit"
        >
          Tambah Permission
        </UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.perm-create-dialog__form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.perm-create-dialog__alert {
  margin-bottom: 4px;
}

.perm-create-dialog__input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-control);
  border: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  color: var(--color-ink-strong);
  font-family: inherit;
  font-size: 0.875rem;
  transition: all var(--transition-normal);
}

.perm-create-dialog__input:focus {
  outline: none;
  border-color: var(--color-brand-amber);
  box-shadow: 0 0 0 3px var(--color-brand-amber-soft);
}

.perm-create-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
}
</style>
