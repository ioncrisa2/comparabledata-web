import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { type Ref, unref } from 'vue'

import { useAuthStore } from '@/features/auth'

import {
  bulkDeleteUsers,
  createUser,
  type CreateUserPayload,
  deleteUser,
  fetchRoleOptions,
  fetchUsers,
  toggleUserStatus,
  updateUser,
  type UpdateUserPayload,
  type UserFilterParams,
} from '../api/users.api'

export function useUsersQuery(params: Ref<UserFilterParams> | UserFilterParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: ({ signal }) => fetchUsers(unref(params), { signal }),
    staleTime: 30_000,
  })
}

export function useRoleOptionsQuery() {
  return useQuery({
    queryKey: ['role-options'],
    queryFn: ({ signal }) => fetchRoleOptions({ signal }),
    staleTime: 300_000,
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (Number(auth.user?.id) === Number(data.id)) {
        void auth.initialize()
      }
    },
  })
}

export function useToggleUserStatusMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  return useMutation({
    mutationFn: (id: number | string) => toggleUserStatus(id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      if (Number(auth.user?.id) === Number(data.id)) {
        void auth.initialize()
      }
    },
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

export function useBulkDeleteUsersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => bulkDeleteUsers(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}
