import { expect, test } from '@playwright/test'

test.describe('Settings and Activity Logs E2E', () => {
  test('settings management workflow (SYS-1203 to SYS-1206)', async ({ page }) => {
    let settingsUpdated = false
    let cacheCleared = false

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[BROWSER CONSOLE ERROR]', msg.text())
      }
    })

    // 1. Mock authentication as Super Admin
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Super Admin',
            email: 'admin@hjar.id',
            roles: ['super_admin'],
            permissions: [
              'view_settings',
              'update_settings',
              'clear_cache',
              'view_activity_log',
              'view_activity_logs',
              'view_audit_trail',
            ],
          },
        },
      }),
    )

    // 2. Mock GET settings
    await page.route(/.*\/api\/v1\/settings(\?.*)?$/, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          json: {
            status: 'success',
            data: {
              settings: {
                company_name: 'PT HJAR Sysinfo',
                support_email: 'support@hjar.id',
                app_version: '1.0.0',
                primary_color: '#2563eb',
                system_mode: 'live',
                app_logo: null,
                app_logo_url: null,
              },
              can: {
                update_settings: true,
                clear_cache: true,
              },
            },
          },
        })
      }

      if (route.request().method() === 'POST') {
        settingsUpdated = true
        return route.fulfill({
          json: {
            status: 'success',
            message: 'Pengaturan sistem berhasil disimpan.',
            data: {
              company_name: 'PT Harta Jaya Abadi Realty',
              support_email: 'admin@hjar.id',
              app_version: '1.1.0',
              primary_color: '#10b981',
              system_mode: 'maintenance',
            },
          },
        })
      }

      return route.continue()
    })

    // 3. Mock POST clear-cache
    await page.route(/.*\/api\/v1\/settings\/clear-cache$/, (route) => {
      cacheCleared = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Semua cache aplikasi berhasil dibersihkan.',
        },
      })
    })

    // Navigate to Settings
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    // Verify page title and header
    await expect(page.locator('h1')).toContainText('Pengaturan Sistem')

    // Verify initial values
    const companyInput = page.locator('[data-testid="company-name-input"]')
    await expect(companyInput).toHaveValue('PT HJAR Sysinfo')

    const emailInput = page.locator('[data-testid="support-email-input"]')
    await expect(emailInput).toHaveValue('support@hjar.id')

    const versionInput = page.locator('[data-testid="app-version-input"]')
    await expect(versionInput).toHaveValue('1.0.0')

    const colorInput = page.locator('[data-testid="primary-color-input"]')
    await expect(colorInput).toHaveValue('#2563eb')

    // Update form values
    await companyInput.fill('PT Harta Jaya Abadi Realty')
    await emailInput.fill('admin@hjar.id')
    await versionInput.fill('1.1.0')
    await colorInput.fill('#10b981')

    // Select maintenance mode
    const maintenanceRadio = page.locator('input[type="radio"][value="maintenance"]')
    await maintenanceRadio.check()

    // Save settings
    const saveButton = page.locator('[data-testid="save-settings-button"]')
    await expect(saveButton).toBeVisible()
    await saveButton.click()

    // Verify save success alert
    await expect(page.locator('.settings-alert')).toBeVisible()
    await expect(page.locator('.settings-alert')).toContainText('Pengaturan Disimpan')
    expect(settingsUpdated).toBe(true)

    // Test Clear Cache workflow
    const clearCacheButton = page.locator('[data-testid="clear-cache-button"]')
    await expect(clearCacheButton).toBeVisible()
    await clearCacheButton.click()

    // Confirm dialog should appear
    const confirmDialog = page.getByRole('dialog')
    await expect(confirmDialog).toBeVisible()
    await expect(confirmDialog).toContainText('Bersihkan Cache Aplikasi?')

    // Confirm action
    const confirmBtn = confirmDialog.getByRole('button', { name: 'Ya, Bersihkan Cache' })
    await expect(confirmBtn).toBeVisible()
    await confirmBtn.click()

    // Verify clear cache success alert
    await expect(page.locator('.settings-alert')).toBeVisible()
    await expect(page.locator('.settings-alert')).toContainText('Pembersihan Berhasil')
    expect(cacheCleared).toBe(true)
  })

  test('activity logs list, search, and diff modal with redaction workflow (SYS-1210 to SYS-1212)', async ({
    page,
  }) => {
    // 1. Mock authentication as Super Admin
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Super Admin',
            email: 'admin@hjar.id',
            roles: ['super_admin'],
            permissions: [
              'view_settings',
              'update_settings',
              'clear_cache',
              'view_activity_log',
              'view_activity_logs',
              'view_audit_trail',
            ],
          },
        },
      }),
    )

    // 2. Mock GET activity-log detail
    await page.route(/.*\/api\/v1\/activity-logs\/101(\?.*)?$/, (route) => {
      return route.fulfill({
        json: {
          status: 'success',
          data: {
            id: 101,
            log_name: 'pembanding',
            description: 'Memperbarui harga dan luas tanah data pembanding',
            subject_type: 'App\\Models\\Pembanding',
            subject_id: 42,
            causer_type: 'App\\Models\\User',
            causer_id: 1,
            event: 'updated',
            causer: {
              id: 1,
              name: 'Budi Santoso',
              email: 'budi@hjar.id',
            },
            properties: {
              old: {
                harga: 1500000000,
                luas_tanah: 200,
                password: 'super_secret_old_password',
              },
              attributes: {
                harga: 1750000000,
                luas_tanah: 220,
                password: 'super_secret_new_password',
              },
            },
            created_at: '2026-09-07T08:00:00Z',
          },
        },
      })
    })

    // 3. Mock GET activity-logs list
    await page.route(/.*\/api\/v1\/activity-logs(\?.*)?$/, (route) => {
      return route.fulfill({
        json: {
          status: 'success',
          data: [
            {
              id: 101,
              log_name: 'pembanding',
              description: 'Memperbarui harga dan luas tanah data pembanding',
              subject_type: 'App\\Models\\Pembanding',
              subject_id: 42,
              causer_type: 'App\\Models\\User',
              causer_id: 1,
              event: 'updated',
              causer: {
                id: 1,
                name: 'Budi Santoso',
                email: 'budi@hjar.id',
              },
              properties: {
                old: {
                  harga: 1500000000,
                  luas_tanah: 200,
                },
                attributes: {
                  harga: 1750000000,
                  luas_tanah: 220,
                },
              },
              created_at: '2026-09-07T08:00:00Z',
            },
          ],
          meta: {
            current_page: 1,
            per_page: 15,
            total: 1,
            last_page: 1,
          },
        },
      })
    })

    // Navigate to Activity Logs
    await page.goto('/activity-logs')
    await page.waitForLoadState('networkidle')

    // Verify page header
    await expect(page.locator('h1')).toContainText('Log Aktivitas Sistem')

    // Verify table row
    const row = page.locator('tbody tr').first()
    await expect(row).toContainText('Budi Santoso')
    await expect(row).toContainText('Diperbarui')
    await expect(row).toContainText('Pembanding #42')
    await expect(row).toContainText('Memperbarui harga dan luas tanah')

    // Verify search input is present and functional
    const searchInput = page.locator('[data-testid="activity-search-input"]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('pembanding')

    // Click detail button
    const detailBtn = row.locator('[data-testid="view-log-detail-btn"]')
    await expect(detailBtn).toBeVisible()
    await detailBtn.click()

    // Verify modal is displayed
    const detailDialog = page.getByRole('dialog')
    await expect(detailDialog).toBeVisible()
    await expect(detailDialog).toContainText('Rincian Log Aktivitas')

    // Verify diff table is visible
    const diffTable = page.locator('.diff-table')
    await expect(diffTable).toBeVisible()
    await expect(diffTable).toContainText('harga')
    await expect(diffTable).toContainText('1500000000')
    await expect(diffTable).toContainText('1750000000')

    // Verify redaction of sensitive key (SYS-1212)
    await expect(diffTable).toContainText('password')
    await expect(diffTable).toContainText('[DIRAHSIAKAN]')
    await expect(diffTable).not.toContainText('super_secret_old_password')
    await expect(diffTable).not.toContainText('super_secret_new_password')

    // Test JSON viewer toggle
    const toggleRawJsonBtn = detailDialog.getByRole('button', {
      name: 'Tampilkan Payload Mentah (JSON)',
    })
    await toggleRawJsonBtn.click()
    const rawJsonBox = page.locator('.raw-json-pre')
    await expect(rawJsonBox).toBeVisible()
    await expect(rawJsonBox).toContainText('[DIRAHSIAKAN]')

    // Close modal
    const closeBtn = detailDialog.getByRole('button', { name: 'Tutup' })
    await closeBtn.click()
    await expect(detailDialog).not.toBeVisible()
  })
})
