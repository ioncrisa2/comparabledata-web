import { apiClient } from '@/shared/api/client'
import { ApiError } from '@/shared/api/error'

export type BackupType = 'database' | 'uploads' | 'full'

export interface BackupArtifact {
  id: string
  type: string
  type_label: string
  filename: string
  size: number
  size_label: string
  checksum: string
  checksum_short: string
  created_at: string
  created_by: string
  origin: string
  verified: boolean
  verified_at: string | null
  last_restore: string | null
  download_url: string
}

export interface LegacyBackupArtifact {
  id: string
  type: string
  type_label: string
  filename: string
  size: string
  size_label: string
  created_at: string
  restorable: boolean
}

export interface BackupReadiness {
  zip: boolean
  storage_writable: boolean
  signing_key: boolean
  restore_enabled: boolean
  uploads_restore_ready: string
  database_restore_ready: boolean
  database_restore_note: string
  max_package_mb: number
  retention_days: number
}

export interface BackupCatalogData {
  artifacts: BackupArtifact[]
  legacy_artifacts: LegacyBackupArtifact[]
  readiness: BackupReadiness
  can: Record<string, boolean | string>
}

export interface RestoreUploadsPayload {
  current_password: string
  confirmation: string
}

function invalidResponse(action: string): ApiError {
  return new ApiError({
    status: null,
    code: 'INVALID_RESPONSE',
    message: `Format data ${action} dari server tidak sesuai.`,
  })
}

export async function fetchBackupCatalog(signal?: AbortSignal): Promise<BackupCatalogData> {
  const { data } = await apiClient.GET('/v1/backup/artifacts', { signal })

  if (data && data.data) {
    const rawData = data.data
    return {
      artifacts: rawData.artifacts || [],
      legacy_artifacts: rawData.legacy_artifacts || [],
      readiness: rawData.readiness,
      can: rawData.can || {},
    }
  }

  throw invalidResponse('katalog cadangan')
}

export async function createBackup(
  type: BackupType,
): Promise<{ message: string; artifact: BackupArtifact }> {
  const { data, error } = await apiClient.POST('/v1/backup/artifacts', {
    body: { type },
  })

  if (error || !data) {
    throw new ApiError({
      status: null,
      code: 'BACKUP_CREATE_FAILED',
      message: 'Gagal membuat arsip cadangan baru.',
    })
  }

  return {
    message: data.message || 'Cadangan berhasil dibuat.',
    artifact: data.data as unknown as BackupArtifact,
  }
}

export async function importBackup(
  file: File,
): Promise<{ message: string; artifact: BackupArtifact }> {
  const formData = new FormData()
  formData.append('package', file)

  const { data, error } = await apiClient.POST('/v1/backup/imports', {
    body: formData as never,
    bodySerializer: (b) => b,
    headers: { 'Content-Type': undefined },
  })

  if (error || !data) {
    throw new ApiError({
      status: null,
      code: 'BACKUP_IMPORT_FAILED',
      message: 'Gagal mengimpor berkas cadangan eksternal.',
    })
  }

  return {
    message: data.message || 'Paket berhasil diimpor.',
    artifact: data.data as unknown as BackupArtifact,
  }
}

export async function verifyBackup(
  artifact: string,
): Promise<{ message: string; verified: boolean; checksum: string }> {
  const { data, error } = await apiClient.POST('/v1/backup/artifacts/{artifact}/verify', {
    params: {
      path: { artifact },
    },
  })

  if (error || !data) {
    throw new ApiError({
      status: null,
      code: 'BACKUP_VERIFY_FAILED',
      message: 'Verifikasi integritas cadangan gagal atau signature tidak valid.',
    })
  }

  return {
    message: data.message || 'Integritas arsip valid.',
    verified: Boolean(data.data?.verified),
    checksum: String(data.data?.checksum ?? ''),
  }
}

export async function deleteBackup(artifact: string): Promise<string> {
  const { data, error } = await apiClient.DELETE('/v1/backup/artifacts/{artifact}', {
    params: {
      path: { artifact },
    },
  })

  if (error || !data) {
    throw new ApiError({
      status: null,
      code: 'BACKUP_DELETE_FAILED',
      message: 'Gagal menghapus arsip cadangan.',
    })
  }

  return data.message || 'Arsip cadangan berhasil dihapus.'
}

export async function restoreUploads(
  artifact: string,
  payload: RestoreUploadsPayload,
): Promise<{ message: string; restored_artifact_id: string }> {
  const { data, error } = await apiClient.POST('/v1/backup/artifacts/{artifact}/restore-uploads', {
    params: {
      path: { artifact },
    },
    body: payload,
  })

  if (error || !data) {
    throw new ApiError({
      status: null,
      code: 'RESTORE_UPLOADS_FAILED',
      message: 'Gagal memulihkan direktori uploads.',
    })
  }

  return {
    message: data.message || 'Berkas uploads berhasil dipulihkan.',
    restored_artifact_id: String(data.data?.restored_artifact_id ?? ''),
  }
}

export function getDownloadBackupUrl(artifact: string): string {
  return `/api/v1/backup/artifacts/${encodeURIComponent(artifact)}/download`
}
