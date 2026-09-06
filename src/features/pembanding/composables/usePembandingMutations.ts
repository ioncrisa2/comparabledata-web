import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useRouter } from 'vue-router'

import { isApiError } from '@/shared/api/error'

import {
  createPembanding,
  deletePembanding,
  requestDeletePembanding,
  updatePembanding,
} from '../api/pembanding.api'
import { pembandingKeys } from '../api/pembanding.keys'

export function useCreatePembandingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) => createPembanding(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pembandingKeys.lists() })
    },
  })
}

export function useUpdatePembandingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      updatePembanding(id, formData),
    onSuccess: (updatedRecord) => {
      const id = String(updatedRecord.id)
      queryClient.setQueryData(pembandingKeys.detail(id), updatedRecord)
      void queryClient.invalidateQueries({ queryKey: pembandingKeys.lists() })
    },
  })
}

export function useDeletePembandingMutation() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: (id: string) => deletePembanding(id),
    onSuccess: async (_, id) => {
      queryClient.removeQueries({ queryKey: pembandingKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: pembandingKeys.lists() })
      await router.push({ name: 'pembanding.list' })
    },
  })
}

export function useRequestDeleteMutation() {
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      requestDeletePembanding(id, reason),
  })
}

/**
 * Mengekstrak field errors dari response 422 ValidationException ke dalam
 * record { fieldName: 'pesan error pertama' }.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (!isApiError(error)) return {}
  const raw = (error as { errors?: Record<string, string[]> }).errors
  if (!raw || typeof raw !== 'object') return {}
  const result: Record<string, string> = {}
  for (const [key, messages] of Object.entries(raw)) {
    if (Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string') {
      result[key] = messages[0]
    }
  }
  return result
}
