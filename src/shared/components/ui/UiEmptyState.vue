<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description: string
    icon?: string
    filtered?: boolean
  }>(),
  {
    icon: 'pi pi-inbox',
    filtered: false,
  },
)
</script>

<template>
  <div class="ui-empty-state" role="status">
    <div class="ui-empty-state__icon" aria-hidden="true"><i :class="icon" /></div>
    <div>
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
      <p v-if="filtered" class="ui-empty-state__filter-note">
        <i class="pi pi-filter" aria-hidden="true" /> Hasil dibatasi oleh filter aktif.
      </p>
      <div v-if="$slots.actions" class="ui-empty-state__actions"><slot name="actions" /></div>
    </div>
  </div>
</template>

<style scoped>
.ui-empty-state {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding-block: 24px;
}

.ui-empty-state__icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border-radius: var(--radius-control);
  background: var(--color-surface-inset);
  color: var(--color-ink-body);
}

.ui-empty-state h3 {
  margin-bottom: 4px;
  font-size: 1rem;
}

.ui-empty-state p {
  max-width: 65ch;
  margin-bottom: 0;
  color: var(--color-ink-muted);
}

.ui-empty-state__filter-note {
  margin-top: 8px;
  color: var(--color-warning-text) !important;
  font-size: 0.75rem;
  font-weight: 650;
}

.ui-empty-state__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
</style>
