import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { useAuthStore } from '@/features/auth'

import {
  createPermission,
  type CreatePermissionPayload,
  createRole,
  type CreateRolePayload,
  deletePermission,
  deleteRole,
  fetchPermissions,
  fetchRoles,
  updateRole,
  type UpdateRolePayload,
} from '../api/access-control.api'

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: ({ signal }) => fetchRoles({ signal }),
    staleTime: 60_000,
  })
}

export function usePermissionsQuery() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: ({ signal }) => fetchPermissions({ signal }),
    staleTime: 120_000,
  })
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRole(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['role-options'] })
    },
  })
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateRolePayload }) =>
      updateRole(id, payload),
    onSuccess: async () => {
      // The role may have been renamed; reload effective access instead of comparing names.
      await auth.initialize({ force: true })
      // Cached feature data may also depend on the permissions that just changed.
      void queryClient.invalidateQueries()
    },
  })
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => deleteRole(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['role-options'] })
    },
  })
}

export function useCreatePermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePermissionPayload) => createPermission(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissions'] })
    },
  })
}

export function useDeletePermissionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number | string) => deletePermission(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['permissions'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}
