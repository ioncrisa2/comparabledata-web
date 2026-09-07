<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { isApiError } from '@/shared/api/error'
import AsyncPanel from '@/shared/components/patterns/AsyncPanel.vue'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiConfirmDialog from '@/shared/components/ui/UiConfirmDialog.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'

import type { SystemMode } from '../api/settings.api'
import {
  useClearCacheMutation,
  useSettingsQuery,
  useUpdateSettingsMutation,
} from '../composables/useSettings'

const settingsQuery = useSettingsQuery()
const updateMutation = useUpdateSettingsMutation()
const clearCacheMutation = useClearCacheMutation()

// Form state
const companyName = ref('')
const supportEmail = ref('')
const appVersion = ref('')
const primaryColor = ref('#2563eb')
const systemMode = ref<SystemMode>('live')
const logoFile = ref<File | null>(null)
const logoPreviewUrl = ref<string | null>(null)
const existingLogoUrl = ref<string | null>(null)

// UI Feedback
const feedback = ref<{
  title: string
  body: string
  tone: 'success' | 'error' | 'info' | 'warning'
} | null>(null)
const isClearCacheDialogOpen = ref(false)

// Populate form when data arrives
watch(
  () => settingsQuery.data.value?.settings,
  (s) => {
    if (s) {
      companyName.value = s.company_name || ''
      supportEmail.value = s.support_email || ''
      appVersion.value = s.app_version || '1.0.0'
      primaryColor.value = s.primary_color || '#2563eb'
      systemMode.value = s.system_mode || 'live'
      existingLogoUrl.value = (s.app_logo_url as string) || (s.app_logo as string) || null
      logoFile.value = null
      logoPreviewUrl.value = null
    }
  },
  { immediate: true },
)

const canUpdate = computed(() => {
  const c = settingsQuery.data.value?.can
  return c?.update_settings !== false && c?.update_settings !== 'false'
})

function handleLogoChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    if (file.size > 2048 * 1024) {
      feedback.value = {
        title: 'Ukuran Berkas Terlalu Besar',
        body: 'Ukuran logo maksimal adalah 2 MB (2048 KB). Silakan pilih file lain.',
        tone: 'error',
      }
      return
    }

    logoFile.value = file
    logoPreviewUrl.value = URL.createObjectURL(file)
  }
}

function removeLogoSelection() {
  logoFile.value = null
  if (logoPreviewUrl.value) {
    URL.revokeObjectURL(logoPreviewUrl.value)
    logoPreviewUrl.value = null
  }
}

async function handleSaveSettings() {
  feedback.value = null

  // Validate color format
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(primaryColor.value)) {
    feedback.value = {
      title: 'Format Warna Tidak Valid',
      body: 'Warna primer harus dalam format hexadecimal (misal: #2563eb).',
      tone: 'error',
    }
    return
  }

  const fd = new FormData()
  fd.append('company_name', companyName.value.trim())
  fd.append('support_email', supportEmail.value.trim())
  fd.append('app_version', appVersion.value.trim())
  fd.append('primary_color', primaryColor.value.trim())
  fd.append('system_mode', systemMode.value)

  if (logoFile.value) {
    fd.append('app_logo', logoFile.value)
  }

  try {
    const res = await updateMutation.mutateAsync(fd)
    feedback.value = {
      title: 'Pengaturan Disimpan',
      body: res.message || 'Konfigurasi sistem berhasil diperbarui.',
      tone: 'success',
    }
    logoFile.value = null
    logoPreviewUrl.value = null
  } catch (err) {
    if (isApiError(err)) {
      feedback.value = {
        title: 'Gagal Menyimpan Pengaturan',
        body: err.message,
        tone: 'error',
      }
    } else {
      feedback.value = {
        title: 'Gagal Menyimpan Pengaturan',
        body: 'Terjadi kesalahan sistem saat memperbarui pengaturan.',
        tone: 'error',
      }
    }
  }
}

async function handleConfirmClearCache() {
  isClearCacheDialogOpen.value = false
  feedback.value = null

  try {
    const res = await clearCacheMutation.mutateAsync()
    feedback.value = {
      title: 'Pembersihan Berhasil',
      body: res.message || 'Semua cache aplikasi berhasil dibersihkan.',
      tone: 'success',
    }
  } catch (err) {
    if (isApiError(err)) {
      feedback.value = {
        title: 'Gagal Membersihkan Cache',
        body: err.message,
        tone: 'error',
      }
    } else {
      feedback.value = {
        title: 'Gagal Membersihkan Cache',
        body: 'Terjadi kesalahan saat meminta pembersihan cache.',
        tone: 'error',
      }
    }
  }
}
const panelState = computed<'loading' | 'error' | 'success'>(() => {
  if (settingsQuery.isPending.value) return 'loading'
  if (settingsQuery.isError.value) return 'error'
  return 'success'
})
</script>

<template>
  <main id="main-content" class="settings-page" tabindex="-1">
    <header class="settings-header">
      <div class="settings-header__titles">
        <h1>Pengaturan Sistem</h1>
        <p>
          Kelola identitas aplikasi, branding, mode operasional sistem, dan pemeliharaan cache
          server.
        </p>
      </div>
    </header>

    <!-- Feedback notification -->
    <UiInlineAlert
      v-if="feedback"
      class="settings-alert"
      :tone="feedback.tone"
      :title="feedback.title"
      dismissible
      @dismiss="feedback = null"
    >
      <p>{{ feedback.body }}</p>
    </UiInlineAlert>

    <AsyncPanel
      :state="panelState"
      :error-message="
        isApiError(settingsQuery.error.value)
          ? settingsQuery.error.value.message
          : 'Pengaturan sistem tidak dapat ditemukan.'
      "
      @retry="settingsQuery.refetch()"
    >
      <form class="settings-form" @submit.prevent="handleSaveSettings">
        <!-- 1. Identitas & Branding -->
        <UiSurface class="settings-section">
          <div class="section-title-wrap">
            <div class="section-icon">
              <i class="pi pi-building" aria-hidden="true" />
            </div>
            <div>
              <h2>Identitas & Informasi Instansi</h2>
              <p class="section-subtitle">
                Nama instansi, email bantuan, dan logo yang ditampilkan di antarmuka sistem.
              </p>
            </div>
          </div>

          <div class="settings-grid">
            <UiField label="Nama Instansi / Perusahaan" required>
              <template #default="{ inputId }">
                <input
                  :id="inputId"
                  v-model="companyName"
                  type="text"
                  placeholder="Contoh: PT HJAR Valuasi Mandiri"
                  required
                  :disabled="!canUpdate || updateMutation.isPending.value"
                  data-testid="company-name-input"
                />
              </template>
            </UiField>

            <UiField label="Email Kontak Bantuan (Support)" required>
              <template #default="{ inputId }">
                <input
                  :id="inputId"
                  v-model="supportEmail"
                  type="email"
                  placeholder="Contoh: support@hjar.id"
                  required
                  :disabled="!canUpdate || updateMutation.isPending.value"
                  data-testid="support-email-input"
                />
              </template>
            </UiField>

            <UiField label="Versi Aplikasi">
              <template #default="{ inputId }">
                <input
                  :id="inputId"
                  v-model="appVersion"
                  type="text"
                  placeholder="1.0.0"
                  :disabled="!canUpdate || updateMutation.isPending.value"
                  data-testid="app-version-input"
                />
              </template>
            </UiField>

            <UiField
              label="Warna Aksen Primer (Brand Color)"
              help="Gunakan kode hex valid (contoh: #2563eb)"
            >
              <template #default="{ inputId }">
                <div class="color-picker-wrap">
                  <input
                    :id="inputId"
                    v-model="primaryColor"
                    type="color"
                    class="color-swatch-picker"
                    :disabled="!canUpdate || updateMutation.isPending.value"
                  />
                  <input
                    v-model="primaryColor"
                    type="text"
                    class="color-hex-input font-mono"
                    placeholder="#2563eb"
                    maxlength="7"
                    :disabled="!canUpdate || updateMutation.isPending.value"
                    data-testid="primary-color-input"
                  />
                  <span
                    class="color-preview"
                    :style="{ backgroundColor: primaryColor }"
                    aria-hidden="true"
                  />
                </div>
              </template>
            </UiField>

            <!-- Logo Upload -->
            <div class="col-span-full logo-upload-container">
              <span class="logo-field-label">Logo Aplikasi / Instansi</span>
              <p class="logo-field-hint">Format didukung: PNG, JPG, WebP, SVG. Maksimal 2 MB.</p>

              <div class="logo-preview-row">
                <div class="logo-box">
                  <img
                    v-if="logoPreviewUrl || existingLogoUrl"
                    :src="logoPreviewUrl || existingLogoUrl || ''"
                    alt="Pratinjau Logo Aplikasi"
                    class="logo-img"
                  />
                  <div v-else class="logo-placeholder">
                    <i class="pi pi-image" aria-hidden="true" />
                    <span>Belum ada logo</span>
                  </div>
                </div>

                <div class="logo-actions">
                  <label class="ui-button ui-button--secondary ui-button--sm upload-logo-btn">
                    <i class="pi pi-upload" aria-hidden="true" />
                    <span>Pilih Berkas Logo</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      class="sr-only"
                      :disabled="!canUpdate || updateMutation.isPending.value"
                      @change="handleLogoChange"
                    />
                  </label>

                  <button
                    v-if="logoPreviewUrl"
                    type="button"
                    class="ui-button ui-button--secondary ui-button--sm text-danger"
                    @click="removeLogoSelection"
                  >
                    <i class="pi pi-times" aria-hidden="true" />
                    Batal Pilih
                  </button>
                  <span v-if="logoFile" class="text-xs text-muted font-medium">
                    Berkas dipilih: {{ logoFile.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </UiSurface>

        <!-- 2. Mode Sistem & Kesiapan Operasional -->
        <UiSurface class="settings-section">
          <div class="section-title-wrap">
            <div class="section-icon">
              <i class="pi pi-sliders-h" aria-hidden="true" />
            </div>
            <div>
              <h2>Mode Operasional Sistem</h2>
              <p class="section-subtitle">
                Atur ketersediaan akses sistem untuk seluruh pengguna terdaftar dan publik.
              </p>
            </div>
          </div>

          <div class="mode-options-grid">
            <!-- Mode Live -->
            <label class="mode-card" :class="{ 'mode-card--active': systemMode === 'live' }">
              <div class="mode-card-header">
                <input
                  v-model="systemMode"
                  type="radio"
                  name="system_mode"
                  value="live"
                  :disabled="!canUpdate || updateMutation.isPending.value"
                />
                <strong>Normal / Live</strong>
                <UiStatusBadge tone="success">Aktif</UiStatusBadge>
              </div>
              <p class="mode-card-desc">
                Sistem beroperasi normal. Semua modul dan data dapat diakses sesuai izin hak akses
                masing-masing akun.
              </p>
            </label>

            <!-- Mode Maintenance -->
            <label class="mode-card" :class="{ 'mode-card--active': systemMode === 'maintenance' }">
              <div class="mode-card-header">
                <input
                  v-model="systemMode"
                  type="radio"
                  name="system_mode"
                  value="maintenance"
                  :disabled="!canUpdate || updateMutation.isPending.value"
                />
                <strong>Pemeliharaan (Maintenance)</strong>
                <UiStatusBadge tone="warning">Terbatas</UiStatusBadge>
              </div>
              <p class="mode-card-desc">
                Akses publik dan kontributor dibatasi. Hanya Super Admin yang diizinkan mengelola
                data selama perbaikan.
              </p>
            </label>

            <!-- Mode Off -->
            <label class="mode-card" :class="{ 'mode-card--active': systemMode === 'off' }">
              <div class="mode-card-header">
                <input
                  v-model="systemMode"
                  type="radio"
                  name="system_mode"
                  value="off"
                  :disabled="!canUpdate || updateMutation.isPending.value"
                />
                <strong>Nonaktif (Offline)</strong>
                <UiStatusBadge tone="danger">Nonaktif</UiStatusBadge>
              </div>
              <p class="mode-card-desc">
                Seluruh aktivitas data dihentikan sementara untuk migrasi struktur atau darurat
                teknis.
              </p>
            </label>
          </div>
        </UiSurface>

        <!-- Save Button -->
        <div v-if="canUpdate" class="settings-save-row">
          <UiButton
            type="submit"
            variant="primary"
            :loading="updateMutation.isPending.value"
            loading-label="Menyimpan Pengaturan..."
            data-testid="save-settings-button"
          >
            <template #icon><i class="pi pi-check" aria-hidden="true" /></template>
            Simpan Pengaturan
          </UiButton>
        </div>
      </form>

      <!-- 3. Pemeliharaan & Cache Server -->
      <UiSurface class="settings-section settings-section--maintenance mt-6">
        <div class="section-title-wrap">
          <div class="section-icon section-icon--amber">
            <i class="pi pi-server" aria-hidden="true" />
          </div>
          <div>
            <h2>Pemeliharaan Cache Server</h2>
            <p class="section-subtitle">
              Pembersihan cache aplikasi berguna saat terjadi perubahan skema data, rute API, atau
              optimasi kinerja runtime.
            </p>
          </div>
        </div>

        <div class="clear-cache-box">
          <div class="clear-cache-info">
            <strong>Bersihkan Seluruh Cache Aplikasi</strong>
            <p>
              Tindakan ini akan mengosongkan cache query backend, route cache, config cache, dan
              compiled view pada server backend.
            </p>
          </div>

          <UiButton
            variant="secondary"
            :loading="clearCacheMutation.isPending.value"
            loading-label="Membersihkan..."
            data-testid="clear-cache-button"
            @click="isClearCacheDialogOpen = true"
          >
            <template #icon><i class="pi pi-trash" aria-hidden="true" /></template>
            Bersihkan Cache
          </UiButton>
        </div>
      </UiSurface>
    </AsyncPanel>

    <!-- Dialog Konfirmasi Clear Cache -->
    <UiConfirmDialog
      :open="isClearCacheDialogOpen"
      title="Bersihkan Cache Aplikasi?"
      description="Apakah Anda yakin ingin mengosongkan seluruh cache server? Proses ini akan memuat ulang konfigurasi framework dari berkas awal."
      confirm-label="Ya, Bersihkan Cache"
      cancel-label="Batal"
      confirm-variant="danger"
      :busy="clearCacheMutation.isPending.value"
      @confirm="handleConfirmClearCache"
      @cancel="isClearCacheDialogOpen = false"
    />
  </main>
</template>

<style scoped>
.settings-page {
  width: min(100% - 32px, 1100px);
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
}

.settings-header {
  margin-bottom: 1.5rem;
}

.settings-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.settings-header p {
  color: var(--color-muted);
  font-size: 0.9375rem;
  margin: 0.25rem 0 0;
}

.settings-alert {
  margin-bottom: 1.5rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-section {
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
}

.section-title-wrap {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.section-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-md);
  background-color: var(--color-primary-bg, #eff6ff);
  color: var(--color-primary, #2563eb);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.section-icon--amber {
  background-color: #fef3c7;
  color: #d97706;
}

.section-title-wrap h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--color-muted);
  margin: 0.25rem 0 0;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

@media (max-width: 640px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

.col-span-full {
  grid-column: 1 / -1;
}

.color-picker-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.color-swatch-picker {
  width: 2.75rem;
  height: 2.5rem;
  padding: 0.125rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.color-hex-input {
  width: 120px;
}

.color-preview {
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.15);
}

/* Logo Upload */
.logo-upload-container {
  padding: 1rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-subtle, #f8fafc);
  border: 1px dashed var(--color-border);
}

.logo-field-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text);
  display: block;
}

.logo-field-hint {
  font-size: 0.8125rem;
  color: var(--color-muted);
  margin: 0.125rem 0 0.75rem;
}

.logo-preview-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.logo-box {
  width: 100px;
  height: 64px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-muted);
  font-size: 0.6875rem;
}

.logo-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.upload-logo-btn {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Mode Options */
.mode-options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .mode-options-grid {
    grid-template-columns: 1fr;
  }
}

.mode-card {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  background-color: var(--color-surface);
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mode-card:hover {
  border-color: var(--color-primary);
}

.mode-card--active {
  border-color: var(--color-primary);
  background-color: var(--color-primary-subtle, #f0f7ff);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.mode-card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mode-card-header strong {
  font-size: 0.9375rem;
  color: var(--color-text);
  flex: 1;
}

.mode-card-desc {
  font-size: 0.8125rem;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.4;
}

.settings-save-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

/* Clear Cache */
.clear-cache-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding: 1rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-subtle, #f8fafc);
}

.clear-cache-info strong {
  display: block;
  font-size: 0.9375rem;
  color: var(--color-text);
}

.clear-cache-info p {
  font-size: 0.8125rem;
  color: var(--color-muted);
  margin: 0.25rem 0 0;
}

.mt-6 {
  margin-top: 1.5rem;
}
</style>
