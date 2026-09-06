import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { type Ref, unref } from 'vue'

import {
  createDictionaryItem,
  type CreateDictionaryItemPayload,
  deleteDictionaryItem,
  fetchDictionaryCategories,
  fetchDictionaryItems,
  reorderDictionaryItems,
  updateDictionaryItem,
  type UpdateDictionaryItemPayload,
  updateDictionaryStatus,
} from '../api/master-data.api'

export function useDictionaryCategoriesQuery() {
  return useQuery({
    queryKey: ['dictionary-categories'],
    queryFn: ({ signal }) => fetchDictionaryCategories({ signal }),
    staleTime: 60_000,
  })
}

export function useDictionaryItemsQuery(
  type: Ref<string> | string,
  activeOnly: Ref<boolean> | boolean = false,
) {
  return useQuery({
    queryKey: ['dictionary-items', type, activeOnly],
    queryFn: ({ signal }) =>
      fetchDictionaryItems(unref(type), unref(activeOnly), { signal }),
    enabled: () => Boolean(unref(type)),
    staleTime: 30_000,
  })
}

export function useCreateDictionaryItemMutation(type: Ref<string> | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateDictionaryItemPayload) =>
      createDictionaryItem(unref(type), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary-items', type] })
      void queryClient.invalidateQueries({ queryKey: ['dictionary-categories'] })
      void queryClient.invalidateQueries({ queryKey: ['pembanding', 'form-options'] })
    },
  })
}

export function useUpdateDictionaryItemMutation(type: Ref<string> | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateDictionaryItemPayload }) =>
      updateDictionaryItem(unref(type), id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary-items', type] })
      void queryClient.invalidateQueries({ queryKey: ['dictionary-categories'] })
      void queryClient.invalidateQueries({ queryKey: ['pembanding', 'form-options'] })
    },
  })
}

export function useUpdateDictionaryStatusMutation(type: Ref<string> | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number | string; isActive: boolean }) =>
      updateDictionaryStatus(unref(type), id, isActive),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary-items', type] })
      void queryClient.invalidateQueries({ queryKey: ['dictionary-categories'] })
      void queryClient.invalidateQueries({ queryKey: ['pembanding', 'form-options'] })
    },
  })
}

export function useDeleteDictionaryItemMutation(type: Ref<string> | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => deleteDictionaryItem(unref(type), id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary-items', type] })
      void queryClient.invalidateQueries({ queryKey: ['dictionary-categories'] })
      void queryClient.invalidateQueries({ queryKey: ['pembanding', 'form-options'] })
    },
  })
}

export function useReorderDictionaryItemsMutation(type: Ref<string> | string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => reorderDictionaryItems(unref(type), ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['dictionary-items', type] })
      void queryClient.invalidateQueries({ queryKey: ['pembanding', 'form-options'] })
    },
  })
}
