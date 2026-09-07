import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import { useAuthStore } from '@/features/auth'

import type { Pembanding } from '../api/pembanding.api'

export function usePembandingAccess(record: MaybeRefOrGetter<Pembanding | undefined>) {
  const auth = useAuthStore()
  const canAccess = computed(() => {
    const item = toValue(record)
    return Boolean(
      auth.user &&
      item &&
      (!auth.roles.includes('data_contributor') ||
        String(item.created_by.id) === String(auth.user.id)),
    )
  })

  return { canAccess }
}
