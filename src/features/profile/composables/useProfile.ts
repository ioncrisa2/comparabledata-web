import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { useAuthStore } from '@/features/auth'

import {
  updatePassword,
  type UpdatePasswordPayload,
  updateProfile,
  type UpdateProfilePayload,
} from '../api/profile.api'

export function useUpdateProfileMutation() {
  const auth = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (updatedUser) => {
      auth.user = updatedUser
      void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      void queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) => updatePassword(payload),
  })
}
