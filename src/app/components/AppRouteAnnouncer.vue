<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const announcement = ref('')

watch(
  () => route.meta.title,
  (title) => {
    announcement.value = title ? `Halaman ${title}` : ''
  },
  { immediate: true },
)
</script>

<template>
  <p class="sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
</template>
