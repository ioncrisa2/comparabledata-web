<script setup lang="ts">
import { computed, ref } from 'vue'

import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import { formatPhoneInput } from '@/shared/formatters'

import type { PembandingFormOptions } from '../api/pembanding.api'
import type { FormErrors, PembandingFormData } from '../types/form'

const MAX_SIZE_MB = 15
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const props = defineProps<{
  modelValue: PembandingFormData
  options: PembandingFormOptions | undefined
  errors: FormErrors
  disabled?: boolean
  /** Apakah gambar sudah ada (mode edit) */
  existingImageUrl?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PembandingFormData]
}>()

function update<K extends keyof PembandingFormData>(key: K, value: PembandingFormData[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const displayPhone = computed(() => {
  return formatPhoneInput(props.modelValue.nomer_telepon_pemberi_informasi)
})

function onPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  const rawValue = input.value
  const oldCursorPos = input.selectionStart ?? rawValue.length

  // Hitung jumlah digit sebelum kursor
  const beforeCursor = rawValue.slice(0, oldCursorPos)
  const digitsBefore = beforeCursor.replace(/\D/g, '').length

  const formatted = formatPhoneInput(rawValue)
  input.value = formatted
  update('nomer_telepon_pemberi_informasi', formatted)

  if (!formatted) {
    return
  }

  // Jika user mengetik di ujung teks, posisikan cursor di akhir
  if (oldCursorPos >= rawValue.length - 1) {
    input.setSelectionRange(formatted.length, formatted.length)
    return
  }

  // Posisikan cursor setelah digit ke-N
  let digitCount = 0
  let targetPos = formatted.length
  for (let i = 0; i < formatted.length; i++) {
    const char = formatted[i]
    if (char && /\d/.test(char)) {
      digitCount++
      if (digitCount === digitsBefore) {
        targetPos = i + 1
        break
      }
    }
  }


  input.setSelectionRange(targetPos, targetPos)
}

function onPhoneKeydown(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement
  if (event.key === 'Backspace') {
    const val = input.value.trim()
    const digits = val.replace(/\D/g, '')
    // Jika tidak ada nomor pelanggan tersisa (hanya +62, 0, atau +62 8), hapus bersih
    if (
      !digits ||
      digits === '62' ||
      digits === '0' ||
      (digits.length === 3 && digits.startsWith('62') && input.selectionStart === input.value.length)
    ) {
      event.preventDefault()
      input.value = ''
      update('nomer_telepon_pemberi_informasi', '')
    }
  }
}

function onPhoneBlur() {
  const digits = (props.modelValue.nomer_telepon_pemberi_informasi || '').replace(/\D/g, '')
  if (!digits || digits === '62' || digits === '0') {
    update('nomer_telepon_pemberi_informasi', '')
  }
}

const imageError = ref('')
const previewUrl = ref<string | null>(null)


function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  imageError.value = ''

  if (!file) {
    previewUrl.value = null
    update('image', null)
    return
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    imageError.value = 'Format file tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.'
    return
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    imageError.value = `Ukuran file melebihi batas ${MAX_SIZE_MB} MB.`
    return
  }

  previewUrl.value = URL.createObjectURL(file)
  update('image', file)
}
</script>

<template>
  <div class="form-step">
    <p class="form-step__intro">
      Isi data narasumber, unggah foto properti, dan tambahkan catatan jika diperlukan.
    </p>

    <h3 class="form-step__section-title-first">Sumber informasi</h3>
    <div class="form-step__grid">
      <UiField label="Nama pemberi informasi" required :error="errors.nama_pemberi_informasi">
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="text"
            placeholder="Nama lengkap"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.nama_pemberi_informasi"
            :disabled="disabled"
            @input="update('nama_pemberi_informasi', ($event.target as HTMLInputElement).value)"
          />
        </template>
      </UiField>

      <UiField label="Status pemberi informasi" :error="errors.status_pemberi_informasi_id">
        <template #default="{ inputId, describedBy, invalid }">
          <select
            :id="inputId"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="modelValue.status_pemberi_informasi_id"
            :disabled="disabled || !options"
            @change="update('status_pemberi_informasi_id', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Pilih status</option>
            <option
              v-for="opt in options?.statusPemberiInfos"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </template>
      </UiField>

      <UiField
        label="Nomor telepon"
        :error="errors.nomer_telepon_pemberi_informasi"
        help="Format otomatis: +62 8xx xxxx xxxx"
      >
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="tel"
            placeholder="+62 8xx xxxx xxxx"
            :aria-describedby="describedBy"
            :aria-invalid="invalid"
            :value="displayPhone"
            :disabled="disabled"
            @input="onPhoneInput"
            @keydown="onPhoneKeydown"
            @blur="onPhoneBlur"
          />
        </template>
      </UiField>

    </div>

    <h3 class="form-step__section-title">Foto properti</h3>
    <div class="form-step__image-section">
      <div v-if="existingImageUrl && !previewUrl" class="form-step__existing-image">
        <img :src="existingImageUrl" alt="Foto properti saat ini" />
        <small>Foto saat ini — unggah baru untuk mengganti</small>
      </div>
      <div v-else-if="previewUrl" class="form-step__preview">
        <img :src="previewUrl" alt="Pratinjau foto baru" />
        <small>Pratinjau foto baru</small>
      </div>

      <UiField
        label="Unggah foto"
        :required="!existingImageUrl"
        :error="errors.image ?? imageError"
        help="JPEG, PNG, WebP, atau GIF — maks. 15 MB"
      >
        <template #default="{ inputId, describedBy, invalid }">
          <input
            :id="inputId"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            :aria-describedby="describedBy"
            :aria-invalid="invalid || Boolean(imageError)"
            :disabled="disabled"
            @change="onFileChange"
          />
        </template>
      </UiField>

      <UiInlineAlert v-if="imageError" tone="error" title="File tidak valid">
        <p>{{ imageError }}</p>
      </UiInlineAlert>
    </div>

    <h3 class="form-step__section-title">Catatan</h3>
    <UiField label="Catatan tambahan" :error="errors.catatan">
      <template #default="{ inputId, describedBy, invalid }">
        <textarea
          :id="inputId"
          rows="4"
          placeholder="Informasi tambahan yang relevan..."
          :aria-describedby="describedBy"
          :aria-invalid="invalid"
          :value="modelValue.catatan"
          :disabled="disabled"
          @input="update('catatan', ($event.target as HTMLTextAreaElement).value)"
        />
      </template>
    </UiField>
  </div>
</template>

<style scoped>
.form-step__intro {
  margin: 0 0 20px;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.form-step__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 20px;
}

.form-step__section-title-first {
  margin: 0 0 16px;
  font-size: 0.875rem;
}

.form-step__section-title {
  margin: 20px 0 16px;
  font-size: 0.875rem;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 16px;
}

.form-step__image-section {
  display: grid;
  gap: 12px;
}

.form-step__existing-image,
.form-step__preview {
  display: grid;
  gap: 6px;
}

.form-step__existing-image img,
.form-step__preview img {
  width: 100%;
  max-width: 320px;
  height: 200px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-control);
  object-fit: cover;
}

.form-step__existing-image small,
.form-step__preview small {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}

textarea {
  width: 100%;
  min-height: 100px;
  resize: vertical;
}

@media (max-width: 639px) {
  .form-step__grid {
    grid-template-columns: 1fr;
  }
}
</style>
