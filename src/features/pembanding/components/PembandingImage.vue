<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    mode?: 'thumbnail' | 'detail'
  }>(),
  {
    src: null,
    mode: 'thumbnail',
  },
)

const failed = ref(false)
watch(
  () => props.src,
  () => (failed.value = false),
)
</script>

<template>
  <div class="pembanding-image" :class="`pembanding-image--${mode}`">
    <img v-if="src && !failed" :src="src" :alt="alt" loading="lazy" @error="failed = true" />
    <div
      v-else
      class="pembanding-image__fallback"
      role="img"
      :aria-label="`Foto tidak tersedia: ${alt}`"
    >
      <i class="pi pi-image" aria-hidden="true" />
      <span v-if="mode === 'detail'">Foto properti belum tersedia</span>
    </div>
  </div>
</template>

<style scoped>
.pembanding-image {
  overflow: hidden;
  background: var(--color-surface-inset);
}

.pembanding-image--thumbnail {
  width: 56px;
  height: 56px;
  border-radius: 8px;
}

.pembanding-image--detail {
  width: 100%;
  min-height: 280px;
  border-radius: var(--radius-surface);
}

.pembanding-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pembanding-image__fallback {
  display: grid;
  width: 100%;
  height: 100%;
  min-height: inherit;
  place-content: center;
  justify-items: center;
  gap: 10px;
  color: var(--color-ink-muted);
  text-align: center;
}

.pembanding-image__fallback i {
  font-size: 1.25rem;
}

.pembanding-image--detail .pembanding-image__fallback i {
  font-size: 2rem;
}
</style>
