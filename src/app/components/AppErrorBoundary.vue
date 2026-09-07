<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const hasError = ref(false)
const capturedError = ref<Error | null>(null)
const isDev = import.meta.env.DEV

onErrorCaptured((error) => {
  hasError.value = true
  capturedError.value = error instanceof Error ? error : new Error(String(error))
  console.error('Unhandled application error', error)
  return false
})

function reloadApplication() {
  window.location.reload()
}
</script>

<template>
  <main v-if="hasError" id="main-content" class="system-state" tabindex="-1">
    <div class="system-state__mark" aria-hidden="true">
      <i class="pi pi-exclamation-triangle" />
    </div>
    <div>
      <p class="system-state__context">HJAR Sysinfo</p>
      <h1>Aplikasi tidak dapat ditampilkan</h1>
      <p>
        Terjadi kesalahan yang tidak terduga. Muat ulang aplikasi. Jika masalah berlanjut, sertakan
        waktu kejadian saat menghubungi administrator.
      </p>
      <div
        v-if="isDev && capturedError"
        style="
          margin: 16px 0;
          text-align: left;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px;
          font-family: monospace;
          font-size: 0.8125rem;
          color: #991b1b;
          max-width: 800px;
          overflow-x: auto;
        "
      >
        <strong>{{ capturedError.name }}: {{ capturedError.message }}</strong>
        <pre style="margin-top: 8px; white-space: pre-wrap; word-break: break-all">{{
          capturedError.stack
        }}</pre>
      </div>
      <button class="ui-button ui-button--primary" type="button" @click="reloadApplication">
        Muat ulang aplikasi
      </button>
    </div>
  </main>
  <slot v-else />
</template>
