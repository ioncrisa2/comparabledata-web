<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/features/auth'
import { isApiError } from '@/shared/api/error'
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'

const auth = useAuthStore()
const router = useRouter()
const loggingOut = ref(false)
const logoutError = ref('')

async function handleLogout() {
  loggingOut.value = true
  logoutError.value = ''

  try {
    await auth.logout()
    await router.replace({ name: 'auth.login' })
  } catch (error) {
    logoutError.value = isApiError(error)
      ? error.message
      : 'Sesi belum dapat diakhiri. Silakan coba lagi.'
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="app-layout">
    <header class="app-layout__topbar">
      <RouterLink class="app-layout__brand" :to="{ name: 'dashboard' }" aria-label="Dashboard">
        <span class="app-layout__mark" aria-hidden="true">HJ</span>
        <span>HJAR Sysinfo</span>
      </RouterLink>

      <div class="app-layout__account">
        <span class="app-layout__identity">
          <strong>{{ auth.user?.name }}</strong>
          <small>{{ auth.user?.email }}</small>
        </span>
        <UiButton
          variant="secondary"
          :loading="loggingOut"
          loading-label="Sedang keluar"
          @click="handleLogout"
        >
          <template #icon><i class="pi pi-sign-out" aria-hidden="true" /></template>
          Keluar
        </UiButton>
      </div>
    </header>

    <UiInlineAlert v-if="logoutError" class="app-layout__alert" title="Gagal keluar" tone="error">
      <p>{{ logoutError }}</p>
    </UiInlineAlert>

    <slot />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--color-canvas);
}

.app-layout__topbar {
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  border-bottom: 1px solid var(--color-border-soft);
  background: var(--color-surface);
  padding: 10px max(16px, calc((100% - 1120px) / 2));
}

.app-layout__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--color-ink-strong);
  font-weight: 700;
  text-decoration: none;
}

.app-layout__mark {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 8px;
  background: var(--color-ink-strong);
  color: var(--color-brand-amber);
  font-size: 0.75rem;
}

.app-layout__account,
.app-layout__identity {
  display: flex;
  align-items: center;
}

.app-layout__account {
  gap: 16px;
}

.app-layout__identity {
  align-items: flex-end;
  flex-direction: column;
  line-height: 1.3;
}

.app-layout__identity strong {
  color: var(--color-ink-strong);
  font-size: 0.8125rem;
}

.app-layout__identity small {
  color: var(--color-ink-muted);
}

.app-layout__alert {
  width: min(100% - 32px, 1120px);
  margin: 16px auto 0;
}

@media (max-width: 639px) {
  .app-layout__identity {
    display: none;
  }
}
</style>
