<script setup lang="ts">
import UiButton, { type ButtonVariant } from './UiButton.vue'
import UiDialog from './UiDialog.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description: string
    confirmLabel?: string
    cancelLabel?: string
    confirmVariant?: Extract<ButtonVariant, 'primary' | 'danger'>
    busy?: boolean
  }>(),
  {
    confirmLabel: 'Konfirmasi',
    cancelLabel: 'Batal',
    confirmVariant: 'primary',
    busy: false,
  },
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

function cancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <UiDialog
    :open="open"
    :title="title"
    :description="description"
    width="sm"
    :dismissable="!busy"
    @update:open="$emit('update:open', $event)"
  >
    <slot />
    <template #footer>
      <UiButton :disabled="busy" @click="cancel">{{ cancelLabel }}</UiButton>
      <UiButton :variant="confirmVariant" :loading="busy" @click="$emit('confirm')">
        {{ confirmLabel }}
      </UiButton>
    </template>
  </UiDialog>
</template>
