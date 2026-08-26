<script setup lang="ts">
import UiButton from '@/shared/components/ui/UiButton.vue'
import UiEmptyState from '@/shared/components/ui/UiEmptyState.vue'
import UiInlineAlert from '@/shared/components/ui/UiInlineAlert.vue'
import UiSkeleton from '@/shared/components/ui/UiSkeleton.vue'

withDefaults(
  defineProps<{
    state: 'loading' | 'error' | 'empty' | 'success'
    title: string
    emptyTitle?: string
    emptyDescription?: string
    filtered?: boolean
    loadingRows?: number
  }>(),
  {
    emptyTitle: 'Belum ada data',
    emptyDescription: 'Data akan tampil di sini setelah tersedia.',
    filtered: false,
    loadingRows: 5,
  },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="data-table-shell" :aria-label="title" :aria-busy="state === 'loading'">
    <div v-if="$slots.toolbar" class="data-table-shell__toolbar"><slot name="toolbar" /></div>

    <div v-if="state === 'loading'" class="data-table-shell__loading" role="status">
      <span class="sr-only">Memuat {{ title }}</span>
      <UiSkeleton v-for="row in loadingRows" :key="row" height="42px" />
    </div>

    <UiInlineAlert v-else-if="state === 'error'" title="Data gagal dimuat" tone="error">
      <p>Terjadi gangguan saat mengambil data. Coba kembali tanpa mengubah filter Anda.</p>
      <UiButton size="sm" @click="$emit('retry')">Coba lagi</UiButton>
    </UiInlineAlert>

    <UiEmptyState
      v-else-if="state === 'empty'"
      :title="emptyTitle"
      :description="emptyDescription"
      :filtered="filtered"
    >
      <template v-if="$slots.emptyActions" #actions><slot name="emptyActions" /></template>
    </UiEmptyState>

    <div v-else class="data-table-shell__viewport" tabindex="0">
      <slot />
    </div>

    <div v-if="state === 'success' && $slots.pagination" class="data-table-shell__pagination">
      <slot name="pagination" />
    </div>
  </section>
</template>

<style scoped>
.data-table-shell {
  display: grid;
  gap: 14px;
}

.data-table-shell__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.data-table-shell__loading {
  display: grid;
  gap: 8px;
}

.data-table-shell__viewport {
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-control);
}

.data-table-shell__viewport:focus-visible {
  outline-offset: 2px;
}

.data-table-shell :deep(table) {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  text-align: left;
}

.data-table-shell :deep(th),
.data-table-shell :deep(td) {
  border-bottom: 1px solid var(--color-border-soft);
  padding: 11px 14px;
}

.data-table-shell :deep(th) {
  background: var(--color-surface-inset);
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.data-table-shell :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.data-table-shell :deep(.ui-alert__body .ui-button) {
  margin-top: 10px;
}
</style>
