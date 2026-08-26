<script setup lang="ts">
import { onErrorCaptured, ref } from 'vue'

const hasError = ref(false)

onErrorCaptured((error) => {
  hasError.value = true
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
      <button class="ui-button ui-button--primary" type="button" @click="reloadApplication">
        Muat ulang aplikasi
      </button>
    </div>
  </main>
  <slot v-else />
</template>
