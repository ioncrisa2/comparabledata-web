<script setup lang="ts">
import { ref } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import { useRequestDeleteMutation } from '../composables/usePembandingMutations'

const props = defineProps<{
  open: boolean
  pembandingId: string
  pembandingLabel: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const mutation = useRequestDeleteMutation()

const reason = ref('')
const reasonError = ref('')

function validate(): boolean {
  reasonError.value = ''
  if (!reason.value.trim()) {
    reasonError.value = 'Alasan penghapusan wajib diisi.'
    return false
  }
  if (reason.value.trim().length < 20) {
    reasonError.value = 'Alasan harus minimal 20 karakter.'
    return false
  }
  return true
}

async function submit() {
  if (!validate()) return

  await mutation.mutateAsync(
    { id: props.pembandingId, reason: reason.value.trim() },
    {
      onSuccess: () => {
        emit('success')
        emit('update:open', false)
        reason.value = ''
      },
    },
  )
}

function close() {
  if (mutation.isPending.value) return
  reason.value = ''
  reasonError.value = ''
  mutation.reset()
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Request Hapus Data"
    :description="`Permintaan hapus untuk data: ${pembandingLabel}`"
    :dismissable="!mutation.isPending.value"
    width="sm"
    @update:open="close"
  >
    <div class="delete-dialog">
      <p class="delete-dialog__info">
        Data tidak akan langsung dihapus. Permintaan ini akan ditinjau oleh admin sebelum data
        dapat dihapus (misal jika ada aset yang sama atau terinput ganda).
      </p>

      <UiField
        label="Alasan penghapusan"
        required
        :error="reasonError"
        help="Wajib diisi, minimal 20 karakter. Jelaskan mengapa data ini perlu dihapus."
      >
        <template #default="{ inputId, describedBy, invalid }">
          <textarea
            :id="inputId"
            v-model="reason"
            rows="4"
            placeholder="Contoh: Aset ini terinput ganda dengan data pembanding lain, atau sudah tidak berlaku."
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :disabled="mutation.isPending.value"
          />
        </template>
      </UiField>

      <UiInlineAlert
        v-if="mutation.isError.value"
        tone="error"
        title="Permintaan gagal dikirim"
      >
        <p>
          {{
            isApiError(mutation.error.value)
              ? mutation.error.value.message
              : 'Terjadi gangguan. Coba lagi beberapa saat.'
          }}
        </p>
      </UiInlineAlert>
    </div>

    <template #footer>
      <UiButton :disabled="mutation.isPending.value" @click="close">Batal</UiButton>
      <UiButton variant="danger" :loading="mutation.isPending.value" @click="submit">
        Kirim Request Hapus
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.delete-dialog {
  display: grid;
  gap: 16px;
}

.delete-dialog__info {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-control);
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
  font-size: 0.875rem;
  line-height: 1.5;
}

textarea {
  width: 100%;
  min-height: 100px;
  resize: vertical;
}
</style>
