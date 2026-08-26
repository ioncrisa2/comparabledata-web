<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppLayout from '@/app/layouts/AppLayout.vue'
import AuthLayout from '@/app/layouts/AuthLayout.vue'
import PublicLayout from '@/app/layouts/PublicLayout.vue'

const route = useRoute()
const layouts = {
  app: AppLayout,
  auth: AuthLayout,
  public: PublicLayout,
}

const activeLayout = computed(() => layouts[route.meta.layout ?? 'public'])
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="activeLayout">
      <component :is="Component" />
    </component>
  </RouterView>
</template>
