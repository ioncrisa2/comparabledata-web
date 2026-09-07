import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { mockServer } from '@/test/mocks/server'

import BackupPage from './BackupPage.vue'

describe('BackupPage', () => {
  const mockCatalogData = {
    status: 'success',
    data: {
      readiness: {
        storage_writable: true,
        signing_key: true,
        uploads_restore_ready: 'ready',
        database_restore_note: 'Restore database belum diimplementasikan dan tetap dikunci.',
        max_package_mb: 250,
      },
      artifacts: [
        {
          id: 'backup-2026-09-07-001',
          filename: 'comparabledata-db-20260907.sql.gz',
          type: 'database' as const,
          type_label: 'Basis Data',
          size_bytes: 1048576,
          size_label: '1.00 MB',
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          checksum_short: 'e3b0c44298fc',
          verified: true,
          created_at: '2026-09-07T08:00:00Z',
          created_by: 'Super Admin',
        },
        {
          id: 'backup-2026-09-07-002',
          filename: 'comparabledata-uploads-20260907.tar.gz',
          type: 'uploads' as const,
          type_label: 'Foto Unggahan',
          size_bytes: 5242880,
          size_label: '5.00 MB',
          checksum: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
          checksum_short: 'a591a6d40bf4',
          verified: false,
          created_at: '2026-09-07T08:15:00Z',
          created_by: 'Super Admin',
        },
      ],
      legacy_artifacts: [],
      can: {
        create_backup: true,
        import_backup: true,
        delete_backup: true,
        restore_uploads: true,
      },
    },
  }

  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return mount(BackupPage, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
        stubs: {
          CreateBackupDialog: true,
          ImportBackupDialog: true,
          RestoreUploadsDialog: true,
          DeleteBackupDialog: true,
        },
      },
    })
  }

  it('renders catalog page header, action buttons, readiness cards, and security policy banner', async () => {
    mockServer.use(http.get('*/api/v1/backup/artifacts', () => HttpResponse.json(mockCatalogData)))

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Cadangan & Pemulihan Sistem')
      expect(wrapper.find('[data-testid="open-create-backup-btn"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="open-import-backup-btn"]').exists()).toBe(true)

      // Readiness cards
      expect(wrapper.text()).toContain('Penyimpanan Server')
      expect(wrapper.text()).toContain('Siap & Writable')
      expect(wrapper.text()).toContain('Kunci Tanda Tangan SHA')
      expect(wrapper.text()).toContain('Pemulihan Foto Uploads')
      expect(wrapper.text()).toContain('Database Restore Policy')
      expect(wrapper.text()).toContain('Khusus Konsol CLI')

      // Database restore policy banner (BACKUP-1228)
      const notice = wrapper.find('[data-testid="database-restore-notice"]')
      expect(notice.exists()).toBe(true)
      expect(notice.text()).toContain('Restore database belum diimplementasikan dan tetap dikunci.')
    })
  })

  it('renders artifact catalog rows with verify, download, restore (for uploads), and delete buttons', async () => {
    mockServer.use(http.get('*/api/v1/backup/artifacts', () => HttpResponse.json(mockCatalogData)))

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      const rows = wrapper.findAll('[data-testid="artifact-row"]')
      expect(rows).toHaveLength(2)

      const firstRow = rows[0]
      expect(firstRow).toBeDefined()
      // First row is database: should NOT have restore uploads button
      expect(firstRow?.text()).toContain('comparabledata-db-20260907.sql.gz')
      expect(firstRow?.text()).toContain('Basis Data')
      expect(firstRow?.find('[data-testid="verify-artifact-btn"]').exists()).toBe(true)
      expect(firstRow?.find('[data-testid="download-artifact-btn"]').exists()).toBe(true)
      expect(firstRow?.find('[data-testid="restore-uploads-btn"]').exists()).toBe(false)
      expect(firstRow?.find('[data-testid="delete-artifact-btn"]').exists()).toBe(true)

      const secondRow = rows[1]
      expect(secondRow).toBeDefined()
      // Second row is uploads: should have restore uploads button
      expect(secondRow?.text()).toContain('comparabledata-uploads-20260907.tar.gz')
      expect(secondRow?.text()).toContain('Foto Unggahan')
      expect(secondRow?.find('[data-testid="restore-uploads-btn"]').exists()).toBe(true)
    })
  })

  it('renders empty state when no artifacts are present', async () => {
    mockServer.use(
      http.get('*/api/v1/backup/artifacts', () =>
        HttpResponse.json({
          status: 'success',
          data: {
            ...mockCatalogData.data,
            artifacts: [],
          },
        }),
      ),
    )

    const wrapper = createWrapper()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Belum ada berkas cadangan')
    })
  })
})
