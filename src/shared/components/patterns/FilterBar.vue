<script setup lang="ts">
export type ActiveFilter = {
  key: string
  label: string
  value: string
}

defineProps<{
  filters: ActiveFilter[]
}>()

defineEmits<{
  remove: [key: string]
  reset: []
}>()
</script>

<template>
  <section class="filter-bar" aria-label="Filter data">
    <div class="filter-bar__controls"><slot /></div>
    <div v-if="filters.length" class="filter-bar__active" aria-label="Filter aktif">
      <span class="filter-bar__label">Filter aktif</span>
      <button
        v-for="filter in filters"
        :key="filter.key"
        class="filter-bar__chip"
        type="button"
        :aria-label="`Hapus filter ${filter.label}: ${filter.value}`"
        @click="$emit('remove', filter.key)"
      >
        <span
          >{{ filter.label }}: <strong>{{ filter.value }}</strong></span
        >
        <i class="pi pi-times" aria-hidden="true" />
      </button>
      <button class="filter-bar__reset" type="button" @click="$emit('reset')">Hapus semua</button>
    </div>
  </section>
</template>

<style scoped>
.filter-bar {
  display: grid;
  gap: 12px;
}

.filter-bar__controls,
.filter-bar__active {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-bar__label {
  margin-right: 2px;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-weight: 650;
}

.filter-bar__chip {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface);
  color: var(--color-ink-body);
  padding-inline: 10px;
  font-size: 0.75rem;
  cursor: pointer;
}

.filter-bar__chip:hover {
  border-color: var(--color-ink-muted);
  background: var(--color-surface-inset);
}

.filter-bar__reset {
  min-height: 32px;
  border: 0;
  background: transparent;
  color: var(--color-action-primary);
  padding-inline: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

@media (pointer: coarse) {
  .filter-bar__chip,
  .filter-bar__reset {
    min-height: 44px;
  }
}
</style>
