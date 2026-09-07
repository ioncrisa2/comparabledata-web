<script setup lang="ts">
import { computed, ref } from 'vue'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type { ImportBatchDetailData } from '../api/bulk-import.api'
import { useBulkApplyMutation } from '../composables/useBulkImport'

const props = defineProps<{
  open: boolean
  batchId: number | string
  selectedCount: number
  options: ImportBatchDetailData['options']
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [updatedCount: number]
}>()

const mutation = useBulkApplyMutation()

type AllowedField =
  | 'status_pemberi_informasi_id'
  | 'bentuk_tanah_id'
  | 'posisi_tanah_id'
  | 'kondisi_tanah_id'
  | 'topografi_id'
  | 'dokumen_tanah_id'
  | 'peruntukan_id'

const fieldOptions = [
  { value: 'status_pemberi_informasi_id', label: 'Status Pemberi Informasi' },
  { value: 'bentuk_tanah_id', label: 'Bentuk Tanah' },
  { value: 'posisi_tanah_id', label: 'Posisi Tanah' },
  { value: 'kondisi_tanah_id', label: 'Kondisi Tanah' },
  { value: 'topografi_id', label: 'Topografi' },
  { value: 'dokumen_tanah_id', label: 'Dokumen Tanah / Legalitas' },
  { value: 'peruntukan_id', label: 'Peruntukan' },
]

const selectedField = ref<AllowedField>('status_pemberi_informasi_id')
const selectedValue = ref<number | ''>('')
const formError = ref('')

const availableValues = computed(() => {
  if (!props.options) return []
  switch (selectedField.value) {
    case 'status_pemberi_informasi_id':
      return props.options.statusPemberiInfos ?? []
    case 'bentuk_tanah_id':
      return props.options.bentukTanahs ?? []
    case 'posisi_tanah_id':
      return props.options.posisiTanahs ?? []
    case 'kondisi_tanah_id':
      return props.options.kondisiTanahs ?? []
    case 'topografi_id':
      return props.options.topografis ?? []
    case 'dokumen_tanah_id':
      return props.options.dokumenTanahs ?? []
    case 'peruntukan_id':
      return props.options.peruntukans ?? []
    default:
      return []
  }
})

function onFieldChange() {
  selectedValue.value = ''
  formError.value = ''
}

async function submit() {
  formError.value = ''
  if (!selectedValue.value) {
    formError.value = 'Silakan pilih nilai yang akan diterapkan.'
    return
  }

  try {
    const res = await mutation.mutateAsync({
      batchId: props.batchId,
      payload: {
        field: selectedField.value,
        value: Number(selectedValue.value),
      },
    })
    emit('success', res.updated_rows)
    emit('update:open', false)
  } catch (err) {
    if (isApiError(err)) {
      formError.value = err.message
    } else {
      formError.value = 'Gagal menerapkan nilai massal. Coba lagi.'
    }
  }
}

function close() {
  if (mutation.isPending.value) return
  formError.value = ''
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    title="Terapkan Nilai Massal"
    :description="`Perbarui atribut data sekaligus untuk ${selectedCount} baris yang dipilih.`"
    width="sm"
    :dismissable="!mutation.isPending.value"
    @update:open="close"
  >
    <div class="bulk-apply-dialog">
      <UiInlineAlert tone="info" title="Informasi Penerapan">
        <p>
          Nilai yang Anda pilih akan menimpa data pada
          <strong>{{ selectedCount }} baris</strong> yang saat ini tercentang.
        </p>
      </UiInlineAlert>

      <UiField label="Pilih Kolom / Atribut" required>
        <template #default="{ inputId }">
          <select
            :id="inputId"
            v-model="selectedField"
            :disabled="mutation.isPending.value"
            @change="onFieldChange"
          >
            <option v-for="opt in fieldOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField label="Nilai Baru" required>
        <template #default="{ inputId }">
          <select :id="inputId" v-model="selectedValue" :disabled="mutation.isPending.value">
            <option value="" disabled>-- Pilih nilai --</option>
            <option v-for="item in availableValues" :key="item.value" :value="Number(item.value)">
              {{ item.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiInlineAlert v-if="formError" tone="error" title="Gagal Menerapkan Nilai">
        <p>{{ formError }}</p>
      </UiInlineAlert>
    </div>

    <template #footer>
      <UiButton variant="secondary" :disabled="mutation.isPending.value" @click="close">
        Batal
      </UiButton>
      <UiButton
        variant="primary"
        :disabled="!selectedValue || mutation.isPending.value"
        :loading="mutation.isPending.value"
        @click="submit"
      >
        Terapkan ke {{ selectedCount }} Baris
      </UiButton>
    </template>
  </UiDialog>
</template>

<style scoped>
.bulk-apply-dialog {
  display: grid;
  gap: 16px;
}

select {
  width: 100%;
}
</style>
