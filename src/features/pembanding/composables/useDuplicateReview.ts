import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter,toValue } from 'vue'

import { fetchDuplicateReview, resolveDuplicateReview } from '../api/duplicate-review.api'
import { pembandingKeys } from '../api/pembanding.keys'

export function useDuplicateReviewQuery(submissionId: MaybeRefOrGetter<string>) {
  const resolved = computed(() => toValue(submissionId))

  return useQuery({
    queryKey: computed(() => ['pembanding-submissions', resolved.value]),
    queryFn: ({ signal }) => fetchDuplicateReview(resolved.value, signal),
    enabled: computed(() => Boolean(resolved.value)),
    staleTime: 60_000,
  })
}

export function useResolveDuplicateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      submissionId,
      strategy,
      candidateId,
    }: {
      submissionId: string
      strategy: 'use_existing' | 'replace_existing'
      candidateId: number
    }) => resolveDuplicateReview(submissionId, strategy, candidateId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pembandingKeys.lists() })
    },
  })
}
