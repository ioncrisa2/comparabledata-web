<script setup lang="ts">
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'

withDefaults(
  defineProps<{
    state: 'initial' | 'loading' | 'error' | 'success'
    errorTitle?: string
    errorMessage?: string
  }>(),
  {
    errorTitle: 'Data belum dapat dimuat',
    errorMessage: 'Periksa koneksi lalu coba lagi.',
  },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="async-panel" :aria-busy="state === 'loading'">
    <slot v-if="state === 'initial'" name="initial" />

    <slot v-else-if="state === 'loading'" name="loading">
      <div class="async-panel__loading" aria-label="Memuat data" role="status">
        <UiSkeleton width="42%" />
        <UiSkeleton />
        <UiSkeleton width="76%" />
      </div>
    </slot>

    <slot v-else-if="state === 'error'" name="error">
      <UiInlineAlert :title="errorTitle" tone="error">
        <p>{{ errorMessage }}</p>
        <UiButton size="sm" @click="$emit('retry')">Coba lagi</UiButton>
      </UiInlineAlert>
    </slot>

    <slot v-else />
  </section>
</template>

<style scoped>
.async-panel__loading {
  display: grid;
  gap: 10px;
}

.async-panel :deep(.ui-alert__body .ui-button) {
  margin-top: 10px;
}
</style>
