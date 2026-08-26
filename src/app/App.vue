<script setup lang="ts">
import AppErrorBoundary from '@/app/components/AppErrorBoundary.vue'
import AppRouteAnnouncer from '@/app/components/AppRouteAnnouncer.vue'
import AppRouteLayout from '@/app/components/AppRouteLayout.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">Lewati ke konten utama</a>
  <AppRouteAnnouncer />
  <AppErrorBoundary>
    <AppRouteLayout />
  </AppErrorBoundary>
</template>
