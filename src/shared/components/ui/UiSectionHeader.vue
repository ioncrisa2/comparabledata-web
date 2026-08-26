<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    description?: string
    headingLevel?: 2 | 3
  }>(),
  {
    description: undefined,
    headingLevel: 2,
  },
)
</script>

<template>
  <header class="ui-section-header">
    <div>
      <component :is="`h${headingLevel}`">{{ title }}</component>
      <p v-if="description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="ui-section-header__actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.ui-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.ui-section-header h2,
.ui-section-header h3 {
  margin-bottom: 4px;
  font-size: 1rem;
  line-height: 1.4;
}

.ui-section-header p {
  max-width: 70ch;
  margin: 0;
  color: var(--color-ink-muted);
}

.ui-section-header__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 639px) {
  .ui-section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .ui-section-header__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
