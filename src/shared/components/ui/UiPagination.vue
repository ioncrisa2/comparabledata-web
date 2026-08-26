<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    page: number
    perPage: number
    total: number
    perPageOptions?: number[]
    disabled?: boolean
  }>(),
  {
    perPageOptions: () => [10, 25, 50],
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
  'update:perPage': [perPage: number]
}>()

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const safePage = computed(() => Math.min(Math.max(1, props.page), pageCount.value))
const firstItem = computed(() => (props.total === 0 ? 0 : (safePage.value - 1) * props.perPage + 1))
const lastItem = computed(() => Math.min(safePage.value * props.perPage, props.total))

function changePerPage(event: Event) {
  emit('update:perPage', Number((event.target as HTMLSelectElement).value))
  emit('update:page', 1)
}
</script>

<template>
  <nav class="ui-pagination" aria-label="Paginasi data">
    <p class="ui-pagination__summary" aria-live="polite">
      {{ firstItem }}–{{ lastItem }} dari {{ total }} data
    </p>
    <div class="ui-pagination__controls">
      <label>
        <span>Per halaman</span>
        <select :value="perPage" :disabled="disabled" @change="changePerPage">
          <option v-for="option in perPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>
      <button
        type="button"
        aria-label="Halaman sebelumnya"
        :disabled="disabled || safePage <= 1"
        @click="emit('update:page', safePage - 1)"
      >
        <i class="pi pi-chevron-left" aria-hidden="true" />
      </button>
      <span class="ui-pagination__page">Halaman {{ safePage }} dari {{ pageCount }}</span>
      <button
        type="button"
        aria-label="Halaman berikutnya"
        :disabled="disabled || safePage >= pageCount"
        @click="emit('update:page', safePage + 1)"
      >
        <i class="pi pi-chevron-right" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<style scoped>
.ui-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid var(--color-border-soft);
  padding-top: 14px;
}

.ui-pagination__summary,
.ui-pagination__page {
  margin: 0;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.ui-pagination__controls,
.ui-pagination__controls label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ui-pagination__controls label span {
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}

.ui-pagination select,
.ui-pagination button {
  min-height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-ink-body);
}

.ui-pagination select {
  padding-inline: 8px;
}

.ui-pagination button {
  width: 36px;
  cursor: pointer;
}

.ui-pagination button:hover:not(:disabled) {
  background: var(--color-surface-inset);
}

.ui-pagination :disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 639px) {
  .ui-pagination {
    align-items: flex-start;
    flex-direction: column;
  }

  .ui-pagination__controls {
    width: 100%;
    justify-content: space-between;
  }

  .ui-pagination__controls label span {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }
}

@media (pointer: coarse) {
  .ui-pagination select,
  .ui-pagination button {
    min-height: 44px;
  }

  .ui-pagination button {
    width: 44px;
  }
}
</style>
