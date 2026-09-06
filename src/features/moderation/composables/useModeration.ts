import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter,toValue } from 'vue'

import { pembandingKeys } from '@/features/pembanding/api/pembanding.keys'

import {
  approveDeleteRequest,
  fetchModeration,
  forceDeletePembanding,
  type ModerationFilters,
  rejectDeleteRequest,
  restorePembanding,
} from '../api/moderation.api'

export const moderationKeys = {
  all: ['moderation'] as const,
  lists: () => [...moderationKeys.all, 'list'] as const,
  list: (filters: ModerationFilters) => [...moderationKeys.lists(), filters] as const,
}

export function useModerationQuery(filters: MaybeRefOrGetter<ModerationFilters>) {
  const resolved = computed(() => toValue(filters))

  return useQuery({
    queryKey: computed(() => moderationKeys.list(resolved.value)),
    queryFn: ({ signal }) => fetchModeration(resolved.value, signal),
  })
}

export function useApproveDeleteRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => approveDeleteRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.all })
      void queryClient.invalidateQueries({ queryKey: pembandingKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRejectDeleteRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reviewNote }: { id: string | number; reviewNote: string }) =>
      rejectDeleteRequest(id, reviewNote),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.all })
    },
  })
}

export function useRestorePembandingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => restorePembanding(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.all })
      void queryClient.invalidateQueries({ queryKey: pembandingKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useForceDeletePembandingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string | number) => forceDeletePembanding(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: moderationKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
