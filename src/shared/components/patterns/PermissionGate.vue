<script setup lang="ts">
withDefaults(
  defineProps<{
    allowed: boolean
    hideWhenDenied?: boolean
  }>(),
  {
    hideWhenDenied: true,
  },
)
</script>

<template>
  <slot v-if="allowed" />
  <slot v-else-if="!hideWhenDenied" name="denied">
    <span class="permission-gate__message">
      <i class="pi pi-lock" aria-hidden="true" /> Akses tidak tersedia
    </span>
  </slot>
</template>

<style scoped>
.permission-gate__message {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-ink-muted);
  font-size: 0.75rem;
}
</style>
