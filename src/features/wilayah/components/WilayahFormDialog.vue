<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type {
  CreateWilayahPayload,
  WilayahItem,
  WilayahOptions,
  WilayahResource,
  WilayahResourceMeta,
} from '../api/wilayah.api'

const props = defineProps<{
  open: boolean
  resource: WilayahResource
  resourceMeta?: WilayahResourceMeta
  options?: WilayahOptions
  item?: WilayahItem | null
  parentPresetId?: string
  busy?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: CreateWilayahPayload]
}>()

const isEdit = computed(() => Boolean(props.item))
const title = computed(() =>
  isEdit.value
    ? `Ubah Nama ${props.resourceMeta?.singular || 'Wilayah'}`
    : `Tambah ${props.resourceMeta?.singular || 'Wilayah'} Baru`,
)

const name = ref('')
const provinceCode = ref('')
const selectedProvinceId = ref('')
const selectedRegencyId = ref('')
const selectedDistrictId = ref('')
const validationError = ref<string | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      validationError.value = null
      if (props.item) {
        name.value = props.item.name || ''
      } else {
        name.value = ''
        provinceCode.value = ''
        selectedProvinceId.value = props.parentPresetId || ''
        selectedRegencyId.value = props.parentPresetId || ''
        selectedDistrictId.value = props.parentPresetId || ''
      }
    }
  },
  { immediate: true },
)

function validate(): boolean {
  validationError.value = null
  if (!name.value.trim()) {
    validationError.value = 'Nama wilayah wajib diisi.'
    return false
  }

  if (!isEdit.value) {
    if (props.resource === 'provinces') {
      if (!provinceCode.value.trim() || !/^\d{2}$/.test(provinceCode.value.trim())) {
        validationError.value = 'Kode provinsi harus berupa 2 digit angka (contoh: 32).'
        return false
      }
    } else if (props.resource === 'regencies' && !selectedProvinceId.value) {
      validationError.value = 'Provinsi induk wajib dipilih.'
      return false
    } else if (props.resource === 'districts' && !selectedRegencyId.value) {
      validationError.value = 'Kabupaten/Kota induk wajib dipilih.'
      return false
    } else if (props.resource === 'villages' && !selectedDistrictId.value) {
      validationError.value = 'Kecamatan induk wajib dipilih.'
      return false
    }
  }

  return true
}

function handleSubmit() {
  if (!validate()) return

  const payload: CreateWilayahPayload = {
    name: name.value.trim(),
  }

  if (!isEdit.value) {
    if (props.resource === 'provinces') {
      payload.id = provinceCode.value.trim()
    } else if (props.resource === 'regencies') {
      payload.province_id = selectedProvinceId.value
    } else if (props.resource === 'districts') {
      payload.regency_id = selectedRegencyId.value
    } else if (props.resource === 'villages') {
      payload.district_id = selectedDistrictId.value
    }
  }

  emit('save', payload)
}

function handleClose() {
  if (props.busy) return
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="title"
    :description="`Pengelolaan wilayah administratif pada tingkat ${resourceMeta?.label || resource}.`"
    width="sm"
    :dismissable="!busy"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <form class="wilayah-dialog" @submit.prevent="handleSubmit">
      <UiInlineAlert
        v-if="validationError || error"
        tone="error"
        title="Terjadi kesalahan"
      >
        <p>{{ validationError || error }}</p>
      </UiInlineAlert>

      <!-- If creating a Province: manual 2-digit code -->
      <UiField
        v-if="!isEdit && resource === 'provinces'"
        label="Kode Provinsi"
        required
        help="2 digit angka resmi BPS/Kemendagri (contoh: 32 untuk Jawa Barat)."
      >
        <input
          v-model="provinceCode"
          type="text"
          maxlength="2"
          class="wilayah-dialog__input"
          placeholder="Contoh: 32"
          :disabled="busy"
          data-testid="wilayah-code-input"
        />
      </UiField>

      <!-- If creating Regency: select Province -->
      <UiField
        v-if="!isEdit && resource === 'regencies'"
        label="Provinsi Induk"
        required
      >
        <select
          v-model="selectedProvinceId"
          class="wilayah-dialog__select"
          :disabled="busy"
          data-testid="wilayah-parent-select"
        >
          <option value="" disabled>Pilih Provinsi...</option>
          <option
            v-for="opt in options?.provinces"
            :key="opt.id"
            :value="opt.id"
          >
            {{ opt.id }} - {{ opt.name }}
          </option>
        </select>
      </UiField>

      <!-- If creating District: select Regency -->
      <UiField
        v-if="!isEdit && resource === 'districts'"
        label="Kabupaten / Kota Induk"
        required
      >
        <select
          v-model="selectedRegencyId"
          class="wilayah-dialog__select"
          :disabled="busy"
          data-testid="wilayah-parent-select"
        >
          <option value="" disabled>Pilih Kabupaten/Kota...</option>
          <option
            v-for="opt in options?.regencies"
            :key="opt.id"
            :value="opt.id"
          >
            {{ opt.id }} - {{ opt.name }}
          </option>
        </select>
      </UiField>

      <!-- If creating Village: select District -->
      <UiField
        v-if="!isEdit && resource === 'villages'"
        label="Kecamatan Induk"
        required
      >
        <select
          v-model="selectedDistrictId"
          class="wilayah-dialog__select"
          :disabled="busy"
          data-testid="wilayah-parent-select"
        >
          <option value="" disabled>Pilih Kecamatan...</option>
          <option
            v-for="opt in options?.districts"
            :key="opt.id"
            :value="opt.id"
          >
            {{ opt.id }} - {{ opt.name }}
          </option>
        </select>
      </UiField>

      <!-- Name Field -->
      <UiField label="Nama Wilayah" required>
        <input
          v-model="name"
          type="text"
          class="wilayah-dialog__input"
          :placeholder="`Nama ${resourceMeta?.singular || 'wilayah'}...`"
          :disabled="busy"
          data-testid="wilayah-name-input"
        />
      </UiField>
    </form>

    <template #footer>
      <div class="wilayah-dialog__footer">
        <UiButton
          variant="secondary"
          :disabled="busy"
          @click="handleClose"
        >
          Batal
        </UiButton>
        <UiButton
          variant="primary"
          :loading="busy"
          loading-label="Menyimpan..."
          data-testid="wilayah-save-btn"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Simpan Perubahan' : 'Tambah Wilayah' }}
        </UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.wilayah-dialog {
  display: grid;
  gap: 16px;
}

.wilayah-dialog__input,
.wilayah-dialog__select {
  width: 100%;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  color: var(--color-ink-strong);
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.wilayah-dialog__input:focus,
.wilayah-dialog__select:focus {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.wilayah-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
