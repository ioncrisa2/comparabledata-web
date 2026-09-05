<template>
  <main id="main-content" class="system-state" tabindex="-1">
    <div class="system-state__mark" aria-hidden="true"><i class="pi pi-lock" /></div>
    <div>
      <p class="system-state__context">Akses dibatasi</p>
      <h1>Anda tidak memiliki izin</h1>
      <p>Sesi Anda tetap aktif, tetapi akun ini tidak diizinkan membuka halaman tersebut.</p>
      <RouterLink class="ui-button ui-button--primary" :to="{ name: 'dashboard' }">
        Kembali ke halaman utama
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
a {
  text-decoration: none;
}
</style>
