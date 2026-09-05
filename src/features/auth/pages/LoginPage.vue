<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'

import { useAuthStore } from '@/features/auth'
import { safeRedirectPath } from '@/router/redirect'
import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiField from '@/shared/components/ui/UiField.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSurface from '@/shared/components/ui/UiSurface.vue'

const loginSchema = z.object({
  email: z.email('Masukkan alamat email yang valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
  remember: z.boolean(),
})

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const form = reactive({ email: '', password: '', remember: false })
const fieldErrors = reactive<Record<string, string>>({})
const formError = ref('')
const submitting = ref(false)

function resetErrors() {
  formError.value = ''
  Object.keys(fieldErrors).forEach((field) => delete fieldErrors[field])
}

async function handleSubmit() {
  resetErrors()

  const result = loginSchema.safeParse(form)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string' && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return
  }

  submitting.value = true

  try {
    await auth.login(result.data)
    await router.replace(safeRedirectPath(route.query.redirect) ?? { name: 'dashboard' })
  } catch (error) {
    if (isApiError(error)) {
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        const firstMessage = messages[0]
        if (firstMessage) fieldErrors[field] = firstMessage
      }
      formError.value = error.message
    } else {
      formError.value = 'Login belum dapat diproses. Silakan coba lagi.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main id="main-content" class="login-page" tabindex="-1">
    <UiSurface class="login-page__surface">
      <div class="login-page__heading">
        <p class="login-page__context">Akses internal</p>
        <h1>Masuk ke ruang kerja</h1>
        <p>Gunakan akun HJAR Anda untuk mengelola data pembanding properti.</p>
      </div>

      <UiInlineAlert
        v-if="auth.initializationError && !formError"
        title="Sesi belum dapat diperiksa"
        tone="warning"
      >
        <p>{{ auth.initializationError.message }}</p>
      </UiInlineAlert>

      <UiInlineAlert v-if="formError" title="Login gagal" tone="error">
        <p>{{ formError }}</p>
      </UiInlineAlert>

      <form class="login-page__form" novalidate @submit.prevent="handleSubmit">
        <UiField v-slot="field" label="Email" required :error="fieldErrors.email">
          <input
            :id="field.inputId"
            v-model.trim="form.email"
            type="email"
            name="email"
            autocomplete="username"
            inputmode="email"
            placeholder="nama@kjpp-hjar.co.id"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid || undefined"
            :disabled="submitting"
          />
        </UiField>

        <UiField v-slot="field" label="Kata sandi" required :error="fieldErrors.password">
          <input
            :id="field.inputId"
            v-model="form.password"
            type="password"
            name="password"
            autocomplete="current-password"
            :aria-describedby="field.describedBy"
            :aria-invalid="field.invalid || undefined"
            :disabled="submitting"
          />
        </UiField>

        <label class="login-page__remember">
          <input v-model="form.remember" type="checkbox" name="remember" :disabled="submitting" />
          <span>Ingat sesi saya di perangkat ini</span>
        </label>

        <UiButton
          class="login-page__submit"
          type="submit"
          variant="primary"
          :loading="submitting"
          loading-label="Sedang masuk"
        >
          Masuk
        </UiButton>
      </form>
    </UiSurface>
  </main>
</template>

<style scoped>
.login-page__surface {
  padding: 24px;
}

.login-page__heading {
  margin-bottom: 24px;
}

.login-page__context {
  margin-bottom: 6px;
  color: var(--color-warning-text);
  font-size: 0.75rem;
  font-weight: 650;
}

.login-page h1 {
  margin-bottom: 10px;
  font-size: 1.75rem;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.login-page__heading > p:last-child {
  margin-bottom: 0;
  color: var(--color-ink-muted);
}

.login-page__form {
  display: grid;
  gap: 16px;
  margin-top: 20px;
}

.login-page__remember {
  display: inline-flex;
  width: fit-content;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  color: var(--color-ink-body);
  cursor: pointer;
}

.login-page__remember input {
  width: 16px;
  height: 16px;
  accent-color: var(--color-action-primary);
}

.login-page__submit {
  width: 100%;
}
</style>
