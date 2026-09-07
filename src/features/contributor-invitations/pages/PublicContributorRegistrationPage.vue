<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'

import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'
import { formatDateTime } from '@/shared/formatters'

import type { SubmitRegistrationData } from '../api/invitations.api'
import {
  useSubmitRegistrationMutation,
  useTokenVerificationQuery,
} from '../composables/useContributorInvitations'

const route = useRoute()
const router = useRouter()

const token = computed(() => String(route.params.token ?? ''))

// Token Verification Query
const {
  data: tokenData,
  isLoading: isTokenLoading,
  isError: isTokenError,
  error: tokenVerificationError,
} = useTokenVerificationQuery(token)

const isValidToken = computed(() => {
  if (isTokenLoading.value || isTokenError.value) return false
  return Boolean(tokenData.value?.is_valid ?? tokenData.value?.valid)
})

// Registration Form Schema & State
const registrationSchema = z
  .object({
    display_name: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter.'),
    phone: z.string().trim().min(8, 'Nomor telepon minimal 8 karakter.'),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter.'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi.'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['password_confirmation'],
  })

const form = reactive({
  display_name: '',
  phone: '',
  password: '',
  password_confirmation: '',
})

const fieldErrors = reactive<Record<string, string>>({})
const formError = ref('')
const submittedData = ref<SubmitRegistrationData | null>(null)
const emailCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

const submitMutation = useSubmitRegistrationMutation(token)

function resetErrors() {
  formError.value = ''
  Object.keys(fieldErrors).forEach((key) => delete fieldErrors[key])
}

async function handleSubmit() {
  resetErrors()

  const result = registrationSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fieldErrors[field]) {
        fieldErrors[field] = issue.message
      }
    }
    return
  }

  try {
    const res = await submitMutation.mutateAsync(result.data)
    submittedData.value = res
  } catch (error) {
    if (isApiError(error)) {
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        const first = messages[0]
        if (first) fieldErrors[field] = first
      }
      formError.value = error.message
    } else {
      formError.value = 'Pendaftaran belum dapat diproses. Silakan periksa kembali formulir Anda.'
    }
  }
}

async function copyGeneratedEmail() {
  if (!submittedData.value?.generated_email) return
  const text = submittedData.value.generated_email

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    emailCopied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      emailCopied.value = false
    }, 3000)
  } catch {
    // Clipboard API failure fallback
  }
}
</script>

<template>
  <main id="main-content" class="contributor-register-page" tabindex="-1">
    <!-- STATE 1: Memeriksa Token (Loading) -->
    <UiSurface v-if="isTokenLoading" class="contributor-register-page__surface">
      <div class="contributor-register-page__state-box">
        <i
          class="pi pi-spinner pi-spin contributor-register-page__state-icon contributor-register-page__state-icon--loading"
          aria-hidden="true"
        />
        <h1 class="contributor-register-page__state-title">Memverifikasi Tautan...</h1>
        <p class="contributor-register-page__state-desc">
          Mohon tunggu sebentar, sistem sedang memverifikasi token undangan pendaftaran Anda.
        </p>
      </div>
    </UiSurface>

    <!-- STATE 2: Token Tidak Valid / Kedaluwarsa / Digunakan (Invalid/Expired/Used) -->
    <UiSurface
      v-else-if="!isValidToken && !submittedData"
      class="contributor-register-page__surface"
    >
      <div class="contributor-register-page__state-box">
        <div
          class="contributor-register-page__icon-circle contributor-register-page__icon-circle--error"
        >
          <i class="pi pi-exclamation-triangle" aria-hidden="true" />
        </div>
        <h1 class="contributor-register-page__state-title">Tautan Tidak Valid</h1>
        <p class="contributor-register-page__state-desc">
          {{
            tokenData?.message ||
            (isApiError(tokenVerificationError)
              ? tokenVerificationError.message
              : 'Link registrasi tidak valid, sudah digunakan, atau sudah kedaluwarsa.')
          }}
        </p>
        <p class="contributor-register-page__state-hint">
          Silakan hubungi administrator HJAR untuk mendapatkan tautan undangan yang baru.
        </p>
        <UiButton
          variant="secondary"
          class="contributor-register-page__back-btn"
          @click="router.push({ name: 'auth.login' })"
        >
          Kembali ke Halaman Masuk
        </UiButton>
      </div>
    </UiSurface>

    <!-- STATE 3: Pendaftaran Berhasil Dikirim (Submitted Success) -->
    <UiSurface v-else-if="submittedData" class="contributor-register-page__surface">
      <div class="contributor-register-page__state-box">
        <div
          class="contributor-register-page__icon-circle contributor-register-page__icon-circle--success"
        >
          <i class="pi pi-check" aria-hidden="true" />
        </div>
        <h1 class="contributor-register-page__state-title">Pendaftaran Terkirim!</h1>
        <p class="contributor-register-page__state-desc">
          {{
            submittedData.message ||
            'Permohonan pendaftaran Anda telah berhasil dikirim dan sedang menunggu persetujuan admin.'
          }}
        </p>

        <!-- Generated Email Showcase -->
        <div class="contributor-register-page__email-card">
          <span class="contributor-register-page__email-label">Email Akun Anda:</span>
          <div class="contributor-register-page__email-row">
            <code class="contributor-register-page__email-code">{{
              submittedData.generated_email
            }}</code>
            <UiButton
              type="button"
              size="sm"
              variant="secondary"
              :icon="emailCopied ? 'pi pi-check' : 'pi pi-copy'"
              @click="copyGeneratedEmail"
            >
              {{ emailCopied ? 'Tersalin' : 'Salin' }}
            </UiButton>
          </div>
          <p class="contributor-register-page__email-notice">
            Simpan email ini untuk digunakan saat masuk ke sistem setelah akun Anda disetujui oleh
            Administrator.
          </p>
        </div>

        <UiButton
          variant="primary"
          class="contributor-register-page__back-btn"
          @click="router.push({ name: 'auth.login' })"
        >
          Ke Halaman Masuk
        </UiButton>
      </div>
    </UiSurface>

    <!-- STATE 4: Formulir Pendaftaran Kontributor (Token Valid) -->
    <UiSurface v-else class="contributor-register-page__surface">
      <div class="contributor-register-page__heading">
        <p class="contributor-register-page__context">Undangan Terverifikasi</p>
        <h1>Pendaftaran Kontributor</h1>
        <p>
          Lengkapi data diri Anda untuk mengajukan pendaftaran akun penilai/kontributor data
          pembanding.
        </p>
        <p v-if="tokenData?.expires_at" class="contributor-register-page__expiry">
          <i class="pi pi-clock" aria-hidden="true" />
          Berlaku hingga {{ formatDateTime(tokenData.expires_at) }}
        </p>
      </div>

      <UiInlineAlert v-if="formError" title="Gagal mengirim pendaftaran" tone="error" class="mb-4">
        <p>{{ formError }}</p>
      </UiInlineAlert>

      <form class="contributor-register-page__form" novalidate @submit.prevent="handleSubmit">
        <UiField
          v-slot="field"
          label="Nama Lengkap"
          required
          :error="fieldErrors.display_name"
          help="Nama ini akan dicantumkan sebagai nama penilai / penyedia data."
        >
          <input
            :id="field.inputId"
            v-model.trim="form.display_name"
            type="text"
            name="display_name"
            autocomplete="name"
            placeholder="Contoh: Budi Santoso, S.T."
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid || undefined"
            :disabled="submitMutation.isPending.value"
          />
        </UiField>

        <UiField
          v-slot="field"
          label="Nomor Telepon / WhatsApp"
          required
          :error="fieldErrors.phone"
          help="Nomor kontak aktif yang dapat dihubungi untuk keperluan konfirmasi."
        >
          <input
            :id="field.inputId"
            v-model.trim="form.phone"
            type="tel"
            name="phone"
            autocomplete="tel"
            inputmode="tel"
            placeholder="Contoh: 081234567890"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid || undefined"
            :disabled="submitMutation.isPending.value"
          />
        </UiField>

        <UiField
          v-slot="field"
          label="Kata Sandi"
          required
          :error="fieldErrors.password"
          help="Gunakan minimal 8 karakter untuk keamanan akun Anda."
        >
          <input
            :id="field.inputId"
            v-model="form.password"
            type="password"
            name="password"
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid || undefined"
            :disabled="submitMutation.isPending.value"
          />
        </UiField>

        <UiField
          v-slot="field"
          label="Konfirmasi Kata Sandi"
          required
          :error="fieldErrors.password_confirmation"
        >
          <input
            :id="field.inputId"
            v-model="form.password_confirmation"
            type="password"
            name="password_confirmation"
            autocomplete="new-password"
            placeholder="Ketik ulang kata sandi"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid || undefined"
            :disabled="submitMutation.isPending.value"
          />
        </UiField>

        <UiButton
          class="contributor-register-page__submit"
          type="submit"
          variant="primary"
          :loading="submitMutation.isPending.value"
          loading-label="Sedang mengirim pendaftaran"
        >
          Kirim Pendaftaran
        </UiButton>

        <div class="contributor-register-page__footer-nav">
          <RouterLink :to="{ name: 'auth.login' }" class="contributor-register-page__login-link">
            Sudah memiliki akun? Masuk di sini
          </RouterLink>
        </div>
      </form>
    </UiSurface>
  </main>
</template>

<style scoped>
.contributor-register-page__surface {
  padding: 28px;
}

.contributor-register-page__heading {
  margin-bottom: 24px;
}

.contributor-register-page__context {
  margin-bottom: 6px;
  color: var(--color-brand-amber-strong, #d97706);
  font-size: 0.75rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.contributor-register-page h1 {
  margin-bottom: 8px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--color-ink-strong, #0f172a);
}

.contributor-register-page__heading > p {
  margin-bottom: 0;
  color: var(--color-ink-muted, #64748b);
  font-size: 0.875rem;
}

.contributor-register-page__expiry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 4px 10px;
  background: var(--color-surface-inset, #f8fafc);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--color-ink-body, #475569);
}

.contributor-register-page__form {
  display: grid;
  gap: 18px;
}

.contributor-register-page__submit {
  width: 100%;
  margin-top: 6px;
}

.contributor-register-page__footer-nav {
  text-align: center;
  margin-top: 8px;
}

.contributor-register-page__login-link {
  font-size: 0.8125rem;
  color: var(--color-ink-muted, #64748b);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.contributor-register-page__login-link:hover {
  color: var(--color-ink-strong, #0f172a);
}

/* State Box (Loading / Error / Success) */
.contributor-register-page__state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 8px;
}

.contributor-register-page__state-icon {
  font-size: 2.25rem;
  margin-bottom: 16px;
}

.contributor-register-page__state-icon--loading {
  color: var(--color-brand-amber, #f59e0b);
}

.contributor-register-page__icon-circle {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin-bottom: 16px;
  font-size: 1.5rem;
}

.contributor-register-page__icon-circle--error {
  background: #fee2e2;
  color: #dc2626;
}

.contributor-register-page__icon-circle--success {
  background: #dcfce7;
  color: #16a34a;
}

.contributor-register-page__state-title {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--color-ink-strong, #0f172a);
  margin-bottom: 8px;
}

.contributor-register-page__state-desc {
  font-size: 0.875rem;
  color: var(--color-ink-body, #334155);
  line-height: 1.5;
  max-width: 380px;
  margin-bottom: 12px;
}

.contributor-register-page__state-hint {
  font-size: 0.75rem;
  color: var(--color-ink-muted, #64748b);
  margin-bottom: 20px;
}

.contributor-register-page__back-btn {
  width: 100%;
  margin-top: 8px;
}

/* Generated Email Card */
.contributor-register-page__email-card {
  width: 100%;
  background: var(--color-surface-inset, #f8fafc);
  border: 1px solid var(--color-border-soft, #e2e8f0);
  border-radius: var(--radius-surface, 10px);
  padding: 14px 16px;
  text-align: left;
  margin: 16px 0;
}

.contributor-register-page__email-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-ink-muted, #64748b);
  margin-bottom: 6px;
}

.contributor-register-page__email-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: #ffffff;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border, #e2e8f0);
}

.contributor-register-page__email-code {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-ink-strong, #0f172a);
  word-break: break-all;
}

.contributor-register-page__email-notice {
  font-size: 0.75rem;
  color: var(--color-ink-muted, #64748b);
  line-height: 1.4;
  margin: 10px 0 0;
}
</style>
