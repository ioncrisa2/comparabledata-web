import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

import {
  acceptRegistrationRequest,
  createInvitation,
  fetchInvitations,
  fetchRegistrationRequests,
  rejectRegistrationRequest,
  revokeInvitation,
  submitRegistration,
  type SubmitRegistrationPayload,
  verifyRegistrationToken,
} from '../api/invitations.api'

export const INVITATIONS_QUERY_KEY = ['data-contributor-invitations'] as const
export const REGISTRATION_REQUESTS_QUERY_KEY = ['data-contributor-registration-requests'] as const

export function useInvitationsQuery() {
  return useQuery({
    queryKey: INVITATIONS_QUERY_KEY,
    queryFn: ({ signal }) => fetchInvitations({ signal }),
  })
}

export function useRegistrationRequestsQuery() {
  return useQuery({
    queryKey: REGISTRATION_REQUESTS_QUERY_KEY,
    queryFn: ({ signal }) => fetchRegistrationRequests({ signal }),
  })
}

export function useCreateInvitationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => createInvitation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY })
    },
  })
}

export function useRevokeInvitationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => revokeInvitation(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVITATIONS_QUERY_KEY })
    },
  })
}

export function useAcceptRegistrationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => acceptRegistrationRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REGISTRATION_REQUESTS_QUERY_KEY })
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useRejectRegistrationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string | null }) =>
      rejectRegistrationRequest(id, { reject_reason: reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REGISTRATION_REQUESTS_QUERY_KEY })
    },
  })
}

export function useTokenVerificationQuery(token: MaybeRefOrGetter<string>) {
  const resolvedToken = computed(() => toValue(token))
  return useQuery({
    queryKey: computed(() => ['public-contributor-token', resolvedToken.value]),
    queryFn: ({ signal }) => verifyRegistrationToken(resolvedToken.value, { signal }),
    enabled: computed(() => Boolean(resolvedToken.value)),
    retry: false,
  })
}

export function useSubmitRegistrationMutation(token: MaybeRefOrGetter<string>) {
  return useMutation({
    mutationFn: (payload: SubmitRegistrationPayload) => submitRegistration(toValue(token), payload),
  })
}
