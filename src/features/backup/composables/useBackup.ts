import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import {
  type BackupType,
  createBackup,
  deleteBackup,
  fetchBackupCatalog,
  importBackup,
  restoreUploads,
  type RestoreUploadsPayload,
  verifyBackup,
} from '../api/backup.api'

export const backupKeys = {
  all: ['backup'] as const,
  catalog: () => [...backupKeys.all, 'catalog'] as const,
}

export function useBackupCatalogQuery() {
  return useQuery({
    queryKey: backupKeys.catalog(),
    queryFn: ({ signal }) => fetchBackupCatalog(signal),
  })
}

export function useCreateBackupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (type: BackupType) => createBackup(type),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupKeys.all })
    },
  })
}

export function useImportBackupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => importBackup(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupKeys.all })
    },
  })
}

export function useVerifyBackupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (artifact: string) => verifyBackup(artifact),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupKeys.all })
    },
  })
}

export function useDeleteBackupMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (artifact: string) => deleteBackup(artifact),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupKeys.all })
    },
  })
}

export function useRestoreUploadsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ artifact, payload }: { artifact: string; payload: RestoreUploadsPayload }) =>
      restoreUploads(artifact, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: backupKeys.all })
    },
  })
}
