import { expect, test } from '@playwright/test'

test.describe('Notifications and Backup E2E', () => {
  test('notifications topbar bell, dropdown, and full page workflow (SYS-1213 to SYS-1215)', async ({
    page,
  }) => {
    let markAllReadCalled = false
    let markSingleReadCalled = false

    // 1. Mock authentication
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Super Admin',
            email: 'admin@hjar.id',
            roles: ['super_admin'],
            permissions: ['view_search', 'view_backup'],
          },
        },
      }),
    )

    await page.route('**/api/v1/notifications/read-all', (route) => {
      markAllReadCalled = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Semua notifikasi ditandai telah dibaca.',
          unread_count: 0,
        },
      })
    })

    await page.route('**/api/v1/notifications/notif-1/read', (route) => {
      markSingleReadCalled = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Notifikasi ditandai telah dibaca.',
        },
      })
    })

    // 2. Mock notifications list
    await page.route(/.*\/api\/v1\/notifications(\?.*)?$/, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          json: {
            status: 'success',
            unread_count: markAllReadCalled ? 0 : 2,
            data: [
              {
                id: 'notif-1',
                type: 'moderation_request',
                data: {
                  title: 'Permohonan Hapus Data',
                  message: 'Pengguna Ayu mengajukan permohonan hapus data pembanding #101.',
                  url: '/moderation',
                },
                read_at: markAllReadCalled || markSingleReadCalled ? '2026-09-07T08:00:00Z' : null,
                created_at: '2026-09-07T07:45:00Z',
              },
              {
                id: 'notif-2',
                type: 'system_alert',
                data: {
                  title: 'Pencadangan Selesai',
                  message: 'Snapshot basis data berkala berhasil dibuat.',
                  url: '/backup',
                },
                read_at: markAllReadCalled ? '2026-09-07T08:00:00Z' : null,
                created_at: '2026-09-07T06:00:00Z',
              },
            ],
            meta: {
              current_page: 1,
              per_page: 15,
              total: 2,
              last_page: 1,
            },
          },
        })
      }

      return route.continue()
    })

    // Navigate to dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // 1. Topbar Bell Icon and Badge
    const bellBtn = page.locator('[data-testid="notification-bell-btn"]')
    await expect(bellBtn).toBeVisible()

    const badge = page.locator('[data-testid="notification-badge"]')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveText('2')

    // 2. Open popover dropdown
    await bellBtn.click()
    const dropdown = page.locator('[data-testid="notification-dropdown"]')
    await expect(dropdown).toBeVisible()
    await expect(dropdown).toContainText('Permohonan Hapus Data')
    await expect(dropdown).toContainText('Pencadangan Selesai')

    // 3. Mark all as read from dropdown
    const markAllBtn = page.locator('[data-testid="mark-all-read-btn"]')
    await expect(markAllBtn).toBeVisible()
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/read-all')),
      markAllBtn.click(),
    ])
    expect(markAllReadCalled).toBe(true)

    // 4. Click "Lihat Semua Notifikasi"
    const viewAllBtn = page.locator('[data-testid="view-all-notifications-btn"]')
    await expect(viewAllBtn).toBeVisible()
    await viewAllBtn.click()

    // 5. Navigate to full Notifications page
    await page.waitForURL('**/notifications')
    await expect(page.locator('h1')).toContainText('Pusat Notifikasi')

    // Tabs
    const tabAll = page.locator('[data-testid="tab-all-notifications"]')
    const tabUnread = page.locator('[data-testid="tab-unread-notifications"]')
    await expect(tabAll).toBeVisible()
    await expect(tabUnread).toBeVisible()

    // List displays items
    await expect(page.locator('.notifications-list')).toBeVisible()
    await expect(page.locator('.notifications-list')).toContainText('Permohonan Hapus Data')
  })

  test('backup & restore catalog, verify, uploads restore, and locked database policy (BACKUP-1220 to BACKUP-1230)', async ({
    page,
  }) => {
    let verifyCalled = false
    let createCalled = false
    let restoreCalled = false
    let deleteCalled = false

    // 1. Mock authentication as Super Admin
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Super Admin',
            email: 'admin@hjar.id',
            roles: ['super_admin'],
            permissions: ['view_backup', 'create_backup', 'restore_backup', 'delete_backup'],
          },
        },
      }),
    )

    // 2. Mock notifications (for bell in topbar)
    await page.route(/.*\/api\/v1\/notifications(\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          status: 'success',
          unread_count: 0,
          data: [],
          meta: { current_page: 1, per_page: 5, total: 0, last_page: 1 },
        },
      }),
    )

    // 3. Mock Backup Catalog
    await page.route(/.*\/api\/v1\/backup\/artifacts$/, (route) => {
      const method = route.request().method()

      if (method === 'GET') {
        return route.fulfill({
          json: {
            status: 'success',
            message: 'Katalog backup berhasil diambil.',
            data: {
              readiness: {
                storage_writable: true,
                signing_key: true,
                uploads_restore_ready: 'ready',
                database_restore_note:
                  'Restore database belum diimplementasikan dan tetap dikunci.',
                max_package_mb: 250,
              },
              artifacts: [
                {
                  id: 'backup-20260907-db',
                  filename: 'comparabledata-db-20260907.sql.gz',
                  type: 'database',
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
                  id: 'backup-20260907-uploads',
                  filename: 'comparabledata-uploads-20260907.tar.gz',
                  type: 'uploads',
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
          },
        })
      }

      if (method === 'POST') {
        createCalled = true
        return route.fulfill({
          json: {
            status: 'success',
            message: 'Backup uploads berhasil dibuat.',
            data: {
              artifact: {
                id: 'backup-new-uploads',
                filename: 'comparabledata-uploads-new.tar.gz',
                type: 'uploads',
                type_label: 'Foto Unggahan',
                size_bytes: 5242880,
                size_label: '5.00 MB',
                checksum: '1234567890abcdef',
                checksum_short: '1234567890ab',
                verified: true,
                created_at: '2026-09-07T08:30:00Z',
              },
            },
          },
        })
      }

      return route.continue()
    })

    // 4. Mock verify
    await page.route(/.*\/api\/v1\/backup\/artifacts\/.*\/verify$/, (route) => {
      verifyCalled = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Berkas valid dan tanda tangan digital cocok.',
          data: {
            verified: true,
            checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        },
      })
    })

    // 5. Mock restore-uploads
    await page.route(/.*\/api\/v1\/backup\/artifacts\/.*\/restore-uploads$/, (route) => {
      restoreCalled = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Berkas unggahan properti berhasil dipulihkan.',
          data: {
            restored_artifact_id: 'backup-20260907-uploads',
          },
        },
      })
    })

    // 6. Mock delete
    await page.route(/.*\/api\/v1\/backup\/artifacts\/backup-20260907-db$/, (route) => {
      if (route.request().method() === 'DELETE') {
        deleteCalled = true
        return route.fulfill({
          json: {
            status: 'success',
            message: 'Arsip cadangan berhasil dihapus.',
          },
        })
      }
      return route.continue()
    })

    // Navigate to dashboard
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate via Sidebar "Cadangan & Pemulihan"
    const backupNavLink = page.locator('a.app-layout__nav-link', {
      hasText: 'Cadangan & Pemulihan',
    })
    await expect(backupNavLink).toBeVisible()
    await backupNavLink.click()

    await page.waitForURL('**/backup')
    await expect(page.locator('h1')).toContainText('Cadangan & Pemulihan Sistem')

    // Readiness cards
    await expect(page.locator('.readiness-grid')).toContainText('Penyimpanan Server')
    await expect(page.locator('.readiness-grid')).toContainText('Siap & Writable')
    await expect(page.locator('.readiness-grid')).toContainText('Kunci Tanda Tangan SHA')
    await expect(page.locator('.readiness-grid')).toContainText('Pemulihan Foto Uploads')
    await expect(page.locator('.readiness-grid')).toContainText('Database Restore Policy')

    // BACKUP-1228: Strict Database Restore Security Policy Notice & absence of active DB restore button
    const dbNotice = page.locator('[data-testid="database-restore-notice"]')
    await expect(dbNotice).toBeVisible()
    await expect(dbNotice).toContainText(
      'Restore database belum diimplementasikan dan tetap dikunci.',
    )
    await expect(dbNotice).toContainText('CLI server')

    // Ensure NO active database restore button exists anywhere on the page
    const allButtons = await page.getByRole('button').allTextContents()
    const hasDatabaseRestoreButton = allButtons.some(
      (b) =>
        b.toLowerCase().includes('restore db') || b.toLowerCase().includes('pulihkan database'),
    )
    expect(hasDatabaseRestoreButton).toBe(false)

    // Table rows
    const rows = page.locator('[data-testid="artifact-row"]')
    await expect(rows).toHaveCount(2)

    // Verify button
    const firstRowVerify = rows.first().locator('[data-testid="verify-artifact-btn"]')
    await expect(firstRowVerify).toBeVisible()
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/verify')),
      firstRowVerify.click(),
    ])

    // Check feedback alert
    await expect(page.locator('.backup-alert')).toBeVisible()
    await expect(page.locator('.backup-alert')).toContainText('Verifikasi Berhasil')
    expect(verifyCalled).toBe(true)

    // Download button exists with download attribute
    const downloadBtn = rows.first().locator('[data-testid="download-artifact-btn"]')
    await expect(downloadBtn).toBeVisible()
    await expect(downloadBtn).toHaveAttribute('download', '')

    // Create Backup Dialog
    const openCreateBtn = page.locator('[data-testid="open-create-backup-btn"]')
    await expect(openCreateBtn).toBeVisible()
    await openCreateBtn.click()

    const createDialog = page.getByRole('dialog')
    await expect(createDialog).toBeVisible()
    await expect(createDialog).toContainText('Buat Berkas Cadangan Baru')

    // Select uploads type
    const uploadsRadio = createDialog.locator('input[type="radio"][value="uploads"]')
    await uploadsRadio.check()

    // Submit
    const submitCreateBtn = page.locator('[data-testid="submit-create-backup-btn"]')
    await Promise.all([
      page.waitForResponse(
        (res) => res.request().method() === 'POST' && res.url().endsWith('/backup/artifacts'),
      ),
      submitCreateBtn.click(),
    ])
    expect(createCalled).toBe(true)

    // High-friction Restore Uploads Dialog (BACKUP-1227)
    const restoreUploadsBtn = rows.nth(1).locator('[data-testid="restore-uploads-btn"]')
    await expect(restoreUploadsBtn).toBeVisible()
    await restoreUploadsBtn.click()

    const restoreDialog = page.getByRole('dialog')
    await expect(restoreDialog).toBeVisible()
    await expect(restoreDialog).toContainText('Konfirmasi Pemulihan Berkas Unggahan')

    const confirmRestoreBtn = page.locator('[data-testid="submit-restore-btn"]')
    // Initially disabled
    await expect(confirmRestoreBtn).toBeDisabled()

    // Type confirmation and password
    const confirmRestoreInput = page.locator('[data-testid="restore-confirmation-input"]')
    const passwordInput = page.locator('[data-testid="restore-password-input"]')

    await confirmRestoreInput.fill('backup-20260907-uploads')
    await passwordInput.fill('secret_admin_pass')

    // Enabled
    await expect(confirmRestoreBtn).toBeEnabled()
    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/restore-uploads')),
      confirmRestoreBtn.click(),
    ])
    expect(restoreCalled).toBe(true)

    // Delete Backup Dialog with exact ID confirmation (BACKUP-1226)
    const deleteBtn = rows.first().locator('[data-testid="delete-artifact-btn"]')
    await expect(deleteBtn).toBeVisible()
    await deleteBtn.click()

    const deleteDialog = page.getByRole('dialog')
    await expect(deleteDialog).toBeVisible()
    await expect(deleteDialog).toContainText('Hapus Berkas Cadangan')

    const confirmDeleteBtn = page.locator('[data-testid="submit-delete-backup-btn"]')
    await expect(confirmDeleteBtn).toBeDisabled()

    const deleteConfirmInput = page.locator('[data-testid="delete-confirmation-input"]')
    await deleteConfirmInput.fill('backup-20260907-db')

    await expect(confirmDeleteBtn).toBeEnabled()
    await Promise.all([
      page.waitForResponse(
        (res) =>
          res.request().method() === 'DELETE' &&
          res.url().includes('/backup/artifacts/backup-20260907-db'),
      ),
      confirmDeleteBtn.click(),
    ])
    expect(deleteCalled).toBe(true)
  })
})
