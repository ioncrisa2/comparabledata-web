import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { type Ref, unref } from 'vue'

import {
  createWilayah,
  type CreateWilayahPayload,
  deleteWilayah,
  fetchWilayahList,
  updateWilayah,
  type UpdateWilayahPayload,
  type WilayahFilterParams,
  type WilayahResource,
} from '../api/wilayah.api'

export function useWilayahListQuery(
  resource: Ref<WilayahResource> | WilayahResource,
  params: Ref<WilayahFilterParams> | WilayahFilterParams,
) {
  return useQuery({
    queryKey: ['wilayah-list', resource, params],
    queryFn: ({ signal }) =>
      fetchWilayahList(unref(resource), unref(params), { signal }),
    staleTime: 30_000,
  })
}

export function useCreateWilayahMutation(resource: Ref<WilayahResource> | WilayahResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateWilayahPayload) =>
      createWilayah(unref(resource), payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wilayah-list'] })
      void queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })
}

export function useUpdateWilayahMutation(resource: Ref<WilayahResource> | WilayahResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWilayahPayload }) =>
      updateWilayah(unref(resource), id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wilayah-list'] })
      void queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })
}

export function useDeleteWilayahMutation(resource: Ref<WilayahResource> | WilayahResource) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteWilayah(unref(resource), id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['wilayah-list'] })
      void queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })
}
