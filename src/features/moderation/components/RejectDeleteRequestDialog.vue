<script setup lang="ts">
import { ref } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import { useRejectDeleteRequestMutation } from '../composables/useModeration'

const props = defineProps<{
  open: boolean
  requestId: number | string | null
  targetLabel: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
  conflict: [message: string]
}>()

const mutation = useRejectDeleteRequestMutation()

const reviewNote = ref('')
const noteError = ref('')

function validate(): boolean {
  noteError.value = ''
  if (!reviewNote.value.trim()) {
    noteError.value = 'Catatan review penolakan wajib diisi.'
    return false
  }
  return true
}

async function submit() {
  if (!props.requestId || !validate()) return

  try {
    await mutation.mutateAsync({
      id: props.requestId,
      reviewNote: reviewNote.value.trim(),
    })
    emit('success')
    emit('update:open', false)
    reviewNote.value = ''
  } catch (error) {
    if (
      isApiError(error) &&
      (error.code === 'ALREADY_PROCESSED' ||
        error.status === 422 ||
        error.status === 404 ||
        error.message.toLowerCase().includes('sudah diproses'))
    ) {
      emit('conflict', error.message)
    }
  }
}

function close() {
  if (mutation.isPending.value) return
  reviewNote.value = ''
  noteError.value = ''
  mutation.reset()
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Tolak permohonan hapus"
    :description="`Tolak permohonan hapus untuk: ${targetLabel}`"
    :dismissable="!mutation.isPending.value"
    width="sm"
    @update:open="close"
  >
    <div class="reject-dialog">
      <p class="reject-dialog__info">
        Berikan catatan evaluasi mengapa permohonan hapus ini ditolak. Catatan ini akan dicatat
        dalam riwayat audit permohonan.
      </p>

      <UiField
        label="Catatan review"
        required
        :error="noteError"
        help="Wajib diisi. Jelaskan alasan penolakan permohonan hapus."
      >
        <template #default="{ inputId, describedBy, invalid }">
          <textarea
            :id="inputId"
            v-model="reviewNote"
            rows="4"
            placeholder="Contoh: Data telah diverifikasi di lapangan dan bukan merupakan aset duplikat."
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :disabled="mutation.isPending.value"
          />
        </template>
      </UiField>

      <UiInlineAlert v-if="mutation.isError.value" tone="error" title="Gagal menolak permohonan">
        <p>
          {{
            isApiError(mutation.error.value)
              ? mutation.error.value.message
              : 'Terjadi gangguan saat memproses penolakan. Coba lagi.'
          }}
        </p>
      </UiInlineAlert>
    </div>

    <template #footer>
      <UiButton :disabled="mutation.isPending.value" @click="close">Batal</UiButton>
      <UiButton variant="danger" :loading="mutation.isPending.value" @click="submit">
        Tolak Permohonan
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.reject-dialog {
  display: grid;
  gap: 16px;
}

.reject-dialog__info {
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
