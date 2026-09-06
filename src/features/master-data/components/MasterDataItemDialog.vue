<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import UiButton from '@/shared/components/ui/UiButton.vue'
import UiDialog from '@/shared/components/ui/UiDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

import type { DictionaryItem } from '../api/master-data.api'

const props = defineProps<{
  open: boolean
  categoryType: string
  categoryLabel: string
  categoryExtra?: string[]
  item?: DictionaryItem | null
  busy?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: { name: string; is_active: boolean; badge_color?: string | null; marker_icon_url?: string | null }]
}>()

const isEdit = computed(() => Boolean(props.item))
const title = computed(() =>
  isEdit.value ? `Ubah Data ${props.categoryLabel}` : `Tambah ${props.categoryLabel}`,
)

const name = ref('')
const isActive = ref(true)
const badgeColor = ref('')
const markerIconUrl = ref('')
const validationError = ref<string | null>(null)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      validationError.value = null
      if (props.item) {
        name.value = props.item.name || ''
        isActive.value = props.item.is_active ?? true
        badgeColor.value = props.item.badge_color || ''
        markerIconUrl.value = props.item.marker_icon_url || ''
      } else {
        name.value = ''
        isActive.value = true
        badgeColor.value = '#0284c7'
        markerIconUrl.value = ''
      }
    }
  },
  { immediate: true },
)

function validate(): boolean {
  validationError.value = null
  if (!name.value.trim()) {
    validationError.value = 'Nama master data wajib diisi.'
    return false
  }
  if (name.value.trim().length < 2) {
    validationError.value = 'Nama master data minimal 2 karakter.'
    return false
  }
  return true
}

function handleSubmit() {
  if (!validate()) return

  emit('save', {
    name: name.value.trim(),
    is_active: isActive.value,
    badge_color: props.categoryExtra?.includes('badge_color') ? (badgeColor.value || null) : undefined,
    marker_icon_url: props.categoryExtra?.includes('marker_icon_url') ? (markerIconUrl.value || null) : undefined,
  })
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
    :description="`Kelola nilai referensi master data untuk kategori ${categoryLabel}.`"
    width="sm"
    :dismissable="!busy"
    @update:open="emit('update:open', $event)"
    @close="handleClose"
  >
    <form class="master-data-dialog" @submit.prevent="handleSubmit">
      <UiInlineAlert
        v-if="validationError || error"
        tone="error"
        title="Terjadi kesalahan"
      >
        <p>{{ validationError || error }}</p>
      </UiInlineAlert>

      <!-- Name Field -->
      <UiField label="Nama Referensi" required :error="validationError || undefined">
        <input
          v-model="name"
          type="text"
          class="master-data-dialog__input"
          placeholder="Contoh: Tanah Kosong, Ruko, dsb."
          :disabled="busy"
          data-testid="master-data-name-input"
        />
      </UiField>

      <!-- Extra: Badge Color (misal untuk Jenis Listing) -->
      <UiField
        v-if="categoryExtra?.includes('badge_color')"
        label="Warna Badge"
        help="Pilih warna penanda visual pada tabel dan peta."
      >
        <div class="master-data-dialog__color-picker">
          <input
            v-model="badgeColor"
            type="color"
            class="master-data-dialog__color-swatch"
            :disabled="busy"
          />
          <input
            v-model="badgeColor"
            type="text"
            class="master-data-dialog__input"
            placeholder="#0284c7"
            :disabled="busy"
          />
        </div>
      </UiField>

      <!-- Extra: Marker Icon URL -->
      <UiField
        v-if="categoryExtra?.includes('marker_icon_url')"
        label="URL Icon Marker (Opsional)"
      >
        <input
          v-model="markerIconUrl"
          type="text"
          class="master-data-dialog__input"
          placeholder="https://.../icon.png"
          :disabled="busy"
        />
      </UiField>

      <!-- Active Status -->
      <div class="master-data-dialog__checkbox-row">
        <label class="master-data-dialog__checkbox-label">
          <input
            v-model="isActive"
            type="checkbox"
            :disabled="busy"
            data-testid="master-data-active-checkbox"
          />
          <div>
            <strong>Status Aktif</strong>
            <p>Data aktif dapat dipilih saat kontributor atau penilai menginput data pembanding.</p>
          </div>
        </label>
      </div>
    </form>

    <template #footer>
      <div class="master-data-dialog__footer">
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
          data-testid="master-data-save-btn"
          @click="handleSubmit"
        >
          {{ isEdit ? 'Simpan Perubahan' : 'Tambah Data' }}
        </UiButton>
      </div>
    </template>
  </UiDialog>
</template>

<style scoped>
.master-data-dialog {
  display: grid;
  gap: 16px;
}

.master-data-dialog__input {
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

.master-data-dialog__input:focus {
  border-color: var(--color-action-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.master-data-dialog__color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.master-data-dialog__color-swatch {
  width: 44px;
  height: 40px;
  padding: 2px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-control);
  background: var(--color-surface);
  cursor: pointer;
}

.master-data-dialog__checkbox-row {
  padding: 10px 12px;
  background: var(--color-surface-inset);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-control);
}

.master-data-dialog__checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  font-size: 0.875rem;
}

.master-data-dialog__checkbox-label input {
  margin-top: 3px;
}

.master-data-dialog__checkbox-label strong {
  color: var(--color-ink-strong);
  display: block;
}

.master-data-dialog__checkbox-label p {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--color-ink-muted);
}

.master-data-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
