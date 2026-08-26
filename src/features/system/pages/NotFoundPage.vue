<template>
  <main id="main-content" class="system-state" tabindex="-1">
    <div class="system-state__mark" aria-hidden="true"><i class="pi pi-search" /></div>
    <div>
      <p class="system-state__context">Halaman tidak ditemukan</p>
      <h1>Alamat ini tidak tersedia</h1>
      <p>Periksa kembali alamat halaman atau kembali ke halaman utama aplikasi.</p>
      <RouterLink class="ui-button ui-button--primary" :to="{ name: 'foundation' }">
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
