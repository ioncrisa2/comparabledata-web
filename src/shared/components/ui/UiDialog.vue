<script setup lang="ts">
import Dialog from 'primevue/dialog'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    dismissable?: boolean
    width?: 'sm' | 'md' | 'lg'
  }>(),
  {
    description: undefined,
    dismissable: true,
    width: 'md',
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

function updateOpen(value: boolean) {
  emit('update:open', value)
  if (!value) emit('close')
}
</script>

<template>
  <Dialog
    :visible="props.open"
    modal
    :closable="dismissable"
    :close-on-escape="dismissable"
    :dismissable-mask="dismissable"
    :class="[`ui-dialog--${width}`]"
    :draggable="false"
    @update:visible="updateOpen"
  >
    <template #header>
      <div class="ui-dialog__heading">
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
    </template>

    <div class="ui-dialog__content"><slot /></div>

    <template v-if="$slots.footer" #footer>
      <div class="ui-dialog__footer"><slot name="footer" /></div>
    </template>
  </Dialog>
</template>

<style>
.p-dialog.ui-dialog--sm {
  width: min(calc(100vw - 32px), 420px);
}

.p-dialog.ui-dialog--md {
  width: min(calc(100vw - 32px), 600px);
}

.p-dialog.ui-dialog--lg {
  width: min(calc(100vw - 32px), 820px);
}

.p-dialog {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-overlay);
  box-shadow: var(--shadow-overlay);
}

.p-dialog .p-dialog-header {
  align-items: flex-start;
  padding: 20px 20px 12px;
}

.p-dialog .p-dialog-content {
  padding: 8px 20px 20px;
}

.p-dialog .p-dialog-footer {
  padding: 0 20px 20px;
}

.ui-dialog__heading h2 {
  margin: 0;
  font-size: 1.125rem;
  line-height: 1.35;
}

.ui-dialog__heading p {
  max-width: 60ch;
  margin: 5px 0 0;
  color: var(--color-ink-muted);
  font-size: 0.875rem;
}

.ui-dialog__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 479px) {
  .p-dialog {
    max-height: calc(100vh - 24px);
  }

  .ui-dialog__footer > * {
    flex: 1 1 auto;
  }
}
</style>
