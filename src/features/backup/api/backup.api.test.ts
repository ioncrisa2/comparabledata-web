import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import {
  createBackup,
  deleteBackup,
  fetchBackupCatalog,
  getDownloadBackupUrl,
  importBackup,
  restoreUploads,
  type RestoreUploadsPayload,
  verifyBackup,
} from './backup.api'

describe('backup.api', () => {
  it('fetches backup catalog with artifacts and readiness', async () => {
    mockServer.use(
      http.get('*/api/v1/backup/artifacts', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Katalog backup berhasil diambil.',
          data: {
            artifacts: [
              {
                id: 'backup-2026-09-01-full',
                type: 'full',
                type_label: 'Backup lengkap',
                filename: 'backup_20260901.tar.gz',
                size: 15420000,
                size_label: '14.7 MB',
                checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                checksum_short: 'e3b0c442',
                created_at: '2026-09-01T00:00:00Z',
                created_by: 'Super Admin',
                origin: 'system',
                verified: true,
                verified_at: '2026-09-01T00:05:00Z',
                last_restore: null,
                download_url: '/api/v1/backup/artifacts/backup-2026-09-01-full/download',
              },
            ],
            legacy_artifacts: [],
            readiness: {
              zip: true,
              storage_writable: true,
              signing_key: true,
              restore_enabled: true,
              uploads_restore_ready: 'ready',
              database_restore_ready: false,
              database_restore_note: 'Restore database belum diimplementasikan dan tetap dikunci.',
              max_package_mb: 1024,
              retention_days: 30,
            },
            can: {
              create_backup: true,
              restore_uploads: true,
              delete_backup: true,
            },
          },
        }),
      ),
    )

    const catalog = await fetchBackupCatalog()
    expect(catalog.artifacts).toHaveLength(1)
    expect(catalog.artifacts[0]?.id).toBe('backup-2026-09-01-full')
    expect(catalog.readiness.database_restore_ready).toBe(false)
  })

  it('creates backup artifact', async () => {
    let capturedType = ''
    mockServer.use(
      http.post('*/api/v1/backup/artifacts', async ({ request }) => {
        const body = (await request.json()) as { type: string }
        capturedType = body.type
        return HttpResponse.json({
          status: 'success',
          message: 'Backup berhasil dibuat.',
          data: {
            id: 'backup-new',
            type: 'database',
            type_label: 'Database',
            filename: 'backup_new.sql.gz',
            size: 1024,
            size_label: '1 KB',
            checksum: 'abc',
            checksum_short: 'abc',
            created_at: '2026-09-07T08:00:00Z',
            created_by: 'Admin',
            origin: 'manual',
            verified: true,
            verified_at: null,
            last_restore: null,
            download_url: '/download',
          },
        })
      }),
    )

    const result = await createBackup('database')
    expect(capturedType).toBe('database')
    expect(result.artifact.id).toBe('backup-new')
  })

  it('imports backup file via FormData', async () => {
    mockServer.use(
      http.post('*/api/v1/backup/imports', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Paket berhasil diimpor.',
          data: {
            id: 'imported-1',
            type: 'uploads',
            type_label: 'Uploaded files',
            filename: 'imported.tar.gz',
            size: 2048,
            size_label: '2 KB',
            checksum: 'def',
            checksum_short: 'def',
            created_at: '2026-09-07T08:00:00Z',
            created_by: 'Admin',
            origin: 'import',
            verified: true,
            verified_at: null,
            last_restore: null,
            download_url: '/download',
          },
        }),
      ),
    )

    const file = new File(['dummy content'], 'test-backup.tar.gz', { type: 'application/gzip' })
    const result = await importBackup(file)
    expect(result.artifact.id).toBe('imported-1')
  })

  it('verifies artifact checksum', async () => {
    mockServer.use(
      http.post('*/api/v1/backup/artifacts/:artifact/verify', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Signature dan checksum backup valid.',
          data: {
            id: 'backup-1',
            checksum: 'valid-checksum-hash',
            verified: true,
          },
        }),
      ),
    )

    const result = await verifyBackup('backup-1')
    expect(result.verified).toBe(true)
    expect(result.checksum).toBe('valid-checksum-hash')
  })

  it('restores uploads with high-friction confirmation', async () => {
    let capturedBody: RestoreUploadsPayload | undefined
    mockServer.use(
      http.post('*/api/v1/backup/artifacts/:artifact/restore-uploads', async ({ request }) => {
        capturedBody = (await request.json()) as RestoreUploadsPayload
        return HttpResponse.json({
          status: 'success',
          message: 'Uploaded files berhasil dipulihkan.',
          data: {
            restored_artifact_id: 'backup-1',
          },
        })
      }),
    )

    const result = await restoreUploads('backup-1', {
      current_password: 'secret_password',
      confirmation: 'backup-1',
    })

    expect(capturedBody).toEqual({
      current_password: 'secret_password',
      confirmation: 'backup-1',
    })
    expect(result.restored_artifact_id).toBe('backup-1')
  })

  it('deletes backup artifact', async () => {
    mockServer.use(
      http.delete('*/api/v1/backup/artifacts/:artifact', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Backup berhasil dihapus.',
          data: null,
        }),
      ),
    )

    const msg = await deleteBackup('backup-1')
    expect(msg).toBe('Backup berhasil dihapus.')
  })

  it('generates correct download url', () => {
    expect(getDownloadBackupUrl('backup 1.tar.gz')).toBe(
      '/api/v1/backup/artifacts/backup%201.tar.gz/download',
    )
  })
})
