<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiStatusBadge from '@/shared/components/ui/UiStatusBadge.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDate } from '@/shared/formatters'

import { useUpdatePasswordMutation, useUpdateProfileMutation } from '../composables/useProfile'

const auth = useAuthStore()

// --- Profile Form State ---
const profileForm = reactive({
  name: '',
  email: '',
})

const profileSuccessMessage = ref<string | null>(null)
const profileErrorMessage = ref<string | null>(null)
const profileFieldErrors = ref<Record<string, string[]>>({})

// Initialize profile values from current auth user
watch(
  () => auth.user,
  (user) => {
    if (user) {
      profileForm.name = user.name || ''
      profileForm.email = user.email || ''
    }
  },
  { immediate: true },
)

const isProfileDirty = computed(() => {
  return (
    profileForm.name !== (auth.user?.name || '') || profileForm.email !== (auth.user?.email || '')
  )
})

const updateProfileMutation = useUpdateProfileMutation()

async function handleProfileSubmit() {
  profileSuccessMessage.value = null
  profileErrorMessage.value = null
  profileFieldErrors.value = {}

  if (!profileForm.name.trim()) {
    profileFieldErrors.value = { name: ['Nama lengkap wajib diisi.'] }
    return
  }

  if (!profileForm.email.trim()) {
    profileFieldErrors.value = { email: ['Alamat email wajib diisi.'] }
    return
  }

  try {
    const updated = await updateProfileMutation.mutateAsync({
      name: profileForm.name.trim(),
      email: profileForm.email.trim(),
    })
    profileSuccessMessage.value = `Profil ${updated.name} berhasil diperbarui.`
  } catch (err) {
    if (isApiError(err)) {
      profileErrorMessage.value = err.message
      if (err.fieldErrors) {
        profileFieldErrors.value = err.fieldErrors
      }
    } else {
      profileErrorMessage.value = 'Gagal memperbarui profil. Silakan coba lagi.'
    }
  }
}

// --- Password Form State ---
const passwordForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const passwordSuccessMessage = ref<string | null>(null)
const passwordErrorMessage = ref<string | null>(null)
const passwordFieldErrors = ref<Record<string, string[]>>({})

const updatePasswordMutation = useUpdatePasswordMutation()

async function handlePasswordSubmit() {
  passwordSuccessMessage.value = null
  passwordErrorMessage.value = null
  passwordFieldErrors.value = {}

  const errors: Record<string, string[]> = {}
  if (!passwordForm.current_password) {
    errors.current_password = ['Kata sandi saat ini wajib diisi.']
  }
  if (!passwordForm.password) {
    errors.password = ['Kata sandi baru wajib diisi.']
  } else if (passwordForm.password.length < 8) {
    errors.password = ['Kata sandi baru minimal 8 karakter.']
  }
  if (passwordForm.password !== passwordForm.password_confirmation) {
    errors.password_confirmation = ['Konfirmasi kata sandi tidak cocok.']
  }

  if (Object.keys(errors).length > 0) {
    passwordFieldErrors.value = errors
    return
  }

  try {
    await updatePasswordMutation.mutateAsync({
      current_password: passwordForm.current_password,
      password: passwordForm.password,
      password_confirmation: passwordForm.password_confirmation,
    })

    passwordSuccessMessage.value = 'Kata sandi berhasil diperbarui.'
    passwordForm.current_password = ''
    passwordForm.password = ''
    passwordForm.password_confirmation = ''
  } catch (err) {
    if (isApiError(err)) {
      passwordErrorMessage.value = err.message
      if (err.fieldErrors) {
        passwordFieldErrors.value = err.fieldErrors
      }
    } else {
      passwordErrorMessage.value = 'Gagal memperbarui kata sandi. Silakan coba lagi.'
    }
  }
}

const userRoles = computed(() => auth.roles ?? [])
const memberSince = computed(() => {
  return auth.user?.created_at ? formatDate(auth.user.created_at) : '-'
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-page__container">
      <!-- Header -->
      <div class="profile-page__header">
        <h1 class="profile-page__title">Pengaturan Profil & Akun</h1>
        <p class="profile-page__desc">
          Perbarui data diri, kelola informasi akun, dan amankan akun dengan mengganti kata sandi.
        </p>
      </div>

      <div class="profile-page__grid">
        <!-- Section 1: Profil Pengguna -->
        <UiSurface class="profile-page__card" tone="default" elevation="raised">
          <div class="profile-page__card-header">
            <div class="profile-page__card-icon" aria-hidden="true">
              <i class="pi pi-user" />
            </div>
            <div>
              <h2 class="profile-page__card-title">Informasi Pribadi</h2>
              <p class="profile-page__card-subtitle">
                Informasi dasar nama dan alamat email yang terdaftar.
              </p>
            </div>
          </div>

          <!-- Profile Alerts -->
          <UiInlineAlert
            v-if="profileSuccessMessage"
            tone="success"
            title="Berhasil"
            data-testid="profile-success-alert"
          >
            <p>{{ profileSuccessMessage }}</p>
          </UiInlineAlert>

          <UiInlineAlert
            v-if="profileErrorMessage"
            tone="error"
            title="Gagal Memperbarui Profil"
            data-testid="profile-error-alert"
          >
            <p>{{ profileErrorMessage }}</p>
          </UiInlineAlert>

          <form class="profile-page__form" @submit.prevent="handleProfileSubmit">
            <!-- Nama Lengkap -->
            <UiField label="Nama Lengkap" required :error="profileFieldErrors.name?.[0]">
              <template #default="{ inputId, describedBy, invalid }">
                <input
                  :id="inputId"
                  v-model="profileForm.name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid"
                  data-testid="profile-name-input"
                />
              </template>
            </UiField>

            <!-- Email -->
            <UiField
              label="Alamat Email"
              required
              help="Digunakan untuk login dan verifikasi akun."
              :error="profileFieldErrors.email?.[0]"
            >
              <template #default="{ inputId, describedBy, invalid }">
                <input
                  :id="inputId"
                  v-model="profileForm.email"
                  type="email"
                  placeholder="nama@perusahaan.com"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid"
                  data-testid="profile-email-input"
                />
              </template>
            </UiField>

            <!-- Metadata/Roles (Read-Only) -->
            <div class="profile-page__meta-group">
              <span class="profile-page__meta-label">Peran & Hak Akses</span>
              <div class="profile-page__roles-list">
                <UiStatusBadge v-for="role in userRoles" :key="role" tone="info">
                  {{ role.replace(/_/g, ' ') }}
                </UiStatusBadge>
                <span v-if="userRoles.length === 0" class="profile-page__meta-muted">
                  Tidak ada peran khusus
                </span>
              </div>
            </div>

            <div class="profile-page__meta-group">
              <span class="profile-page__meta-label">Bergabung Sejak</span>
              <span class="profile-page__meta-value">{{ memberSince }}</span>
            </div>

            <!-- Profile Submit Button -->
            <div class="profile-page__form-actions">
              <UiButton
                type="submit"
                variant="primary"
                :disabled="!isProfileDirty || updateProfileMutation.isPending.value"
                data-testid="profile-save-btn"
              >
                <template v-if="updateProfileMutation.isPending.value" #icon>
                  <i class="pi pi-spin pi-spinner" aria-hidden="true" />
                </template>
                {{
                  updateProfileMutation.isPending.value ? 'Menyimpan...' : 'Simpan Perubahan Profil'
                }}
              </UiButton>
            </div>
          </form>
        </UiSurface>

        <!-- Section 2: Ganti Kata Sandi -->
        <UiSurface class="profile-page__card" tone="default" elevation="raised">
          <div class="profile-page__card-header">
            <div class="profile-page__card-icon" aria-hidden="true">
              <i class="pi pi-lock" />
            </div>
            <div>
              <h2 class="profile-page__card-title">Keamanan & Kata Sandi</h2>
              <p class="profile-page__card-subtitle">
                Ganti kata sandi secara berkala untuk menjaga keamanan akun Anda.
              </p>
            </div>
          </div>

          <!-- Password Alerts -->
          <UiInlineAlert
            v-if="passwordSuccessMessage"
            tone="success"
            title="Berhasil"
            data-testid="password-success-alert"
          >
            <p>{{ passwordSuccessMessage }}</p>
          </UiInlineAlert>

          <UiInlineAlert
            v-if="passwordErrorMessage"
            tone="error"
            title="Gagal Mengubah Kata Sandi"
            data-testid="password-error-alert"
          >
            <p>{{ passwordErrorMessage }}</p>
          </UiInlineAlert>

          <form class="profile-page__form" @submit.prevent="handlePasswordSubmit">
            <!-- Current Password -->
            <UiField
              label="Kata Sandi Saat Ini"
              required
              :error="passwordFieldErrors.current_password?.[0]"
            >
              <template #default="{ inputId, describedBy, invalid }">
                <input
                  :id="inputId"
                  v-model="passwordForm.current_password"
                  type="password"
                  autocomplete="current-password"
                  placeholder="Masukkan kata sandi saat ini"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid"
                  data-testid="profile-current-password-input"
                />
              </template>
            </UiField>

            <!-- New Password -->
            <UiField
              label="Kata Sandi Baru"
              required
              help="Minimal 8 karakter kombinasi huruf dan angka."
              :error="passwordFieldErrors.password?.[0]"
            >
              <template #default="{ inputId, describedBy, invalid }">
                <input
                  :id="inputId"
                  v-model="passwordForm.password"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Masukkan kata sandi baru"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid"
                  data-testid="profile-new-password-input"
                />
              </template>
            </UiField>

            <!-- Password Confirmation -->
            <UiField
              label="Konfirmasi Kata Sandi Baru"
              required
              :error="passwordFieldErrors.password_confirmation?.[0]"
            >
              <template #default="{ inputId, describedBy, invalid }">
                <input
                  :id="inputId"
                  v-model="passwordForm.password_confirmation"
                  type="password"
                  autocomplete="new-password"
                  placeholder="Ulangi kata sandi baru"
                  :aria-describedby="describedBy"
                  :aria-invalid="invalid"
                  data-testid="profile-password-confirmation-input"
                />
              </template>
            </UiField>

            <!-- Password Submit Button -->
            <div class="profile-page__form-actions">
              <UiButton
                type="submit"
                variant="primary"
                :disabled="
                  !passwordForm.current_password ||
                  !passwordForm.password ||
                  updatePasswordMutation.isPending.value
                "
                data-testid="password-save-btn"
              >
                <template v-if="updatePasswordMutation.isPending.value" #icon>
                  <i class="pi pi-spin pi-spinner" aria-hidden="true" />
                </template>
                {{ updatePasswordMutation.isPending.value ? 'Memperbarui...' : 'Ubah Kata Sandi' }}
              </UiButton>
            </div>
          </form>
        </UiSurface>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  padding-block: var(--space-6);
}

.profile-page__container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 960px;
  margin-inline: auto;
  padding-inline: var(--space-4);
}

.profile-page__header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-ink-strong);
  margin: 0;
}

.profile-page__desc {
  font-size: 0.875rem;
  color: var(--color-ink-muted);
  margin: 0;
}

.profile-page__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-5);
  align-items: start;
}

.profile-page__card {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-5);
}

.profile-page__card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
}

.profile-page__card-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius-control);
  background: var(--color-brand-subtle);
  color: var(--color-brand-text);
  font-size: 1.125rem;
}

.profile-page__card-title {
  font-size: 1.0625rem;
  font-weight: 650;
  color: var(--color-ink-strong);
  margin: 0 0 2px 0;
}

.profile-page__card-subtitle {
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
  margin: 0;
}

.profile-page__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.profile-page__meta-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: var(--space-2);
}

.profile-page__meta-label {
  font-size: 0.75rem;
  font-weight: 650;
  color: var(--color-ink-body);
}

.profile-page__meta-value {
  font-size: 0.875rem;
  color: var(--color-ink-muted);
}

.profile-page__roles-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.profile-page__meta-muted {
  font-size: 0.8125rem;
  color: var(--color-ink-muted);
}

.profile-page__form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border-subtle);
}

@media (max-width: 768px) {
  .profile-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
