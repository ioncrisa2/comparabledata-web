<script setup lang="ts">
import UiButton, { type ButtonVariant } from './UiButton.vue'

withDefaults(
  defineProps<{
    label: string
    icon: string
    variant?: ButtonVariant
    loading?: boolean
    disabled?: boolean
    title?: string
  }>(),
  {
    variant: 'ghost',
    loading: false,
    disabled: false,
    title: undefined,
  },
)

defineEmits<{ click: [event: MouseEvent] }>()
</script>

<template>
  <UiButton
    class="ui-icon-button"
    :variant="variant"
    :loading="loading"
    :disabled="disabled"
    :aria-label="label"
    :title="title"
    @click="$emit('click', $event)"
  >
    <template #icon><i :class="icon" aria-hidden="true" /></template>
    <span class="sr-only">{{ label }}</span>
  </UiButton>
</template>

<style scoped>
.ui-icon-button {
  width: 40px;
  flex: 0 0 40px;
  padding: 0;
}

@media (pointer: coarse) {
  .ui-icon-button {
    width: 44px;
    flex-basis: 44px;
  }
}
</style>
