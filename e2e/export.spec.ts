import { expect, test } from '@playwright/test'

import { createPembanding } from '../src/features/pembanding/test/fixtures.js'

test.describe('Export Feature E2E', () => {
  test('synchronous download and background queued export workflow', async ({ page }) => {
    let previewCount = 42
    let isQueued = false
    let runCreated = false
    const record = createPembanding({ id: 1 })

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[BROWSER CONSOLE ERROR]', msg.text())
      }
    })
    page.on('pageerror', (err) => {
      console.log('[BROWSER PAGE ERROR]', err.message)
    })

    // 1. Mock authentication
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Super Admin',
            email: 'admin@hjar.id',
            roles: ['super_admin'],
            permissions: [
              'view_any_data::pembanding',
              'create_data::pembanding',
              'update_data::pembanding',
              'export_data::pembanding',
              'view_export',
            ],
          },
        },
      }),
    )

    // 2. Mock Export configuration
    await page.route(/.*\/api\/v1\/exports\/configuration(\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          status: 'success',
          message: 'Konfigurasi ekspor berhasil diambil.',
          data: {
            configuration: {
              profiles: [
                { value: 'ringkas', label: 'Ringkas', columns: ['id', 'alamat'] },
                { value: 'lengkap', label: 'Lengkap', columns: ['id', 'alamat', 'harga'] },
              ],
              columns: [],
            },
            limits: {
              excel: 5000,
              csv: 5000,
              geojson: 5000,
              kml: 5000,
              pdf_summary: 1000,
              pdf_detail: 100,
            },
            async_limits: {
              excel: 100000,
              csv: 100000,
              geojson: 50000,
              kml: 50000,
              pdf_summary: 5000,
              pdf_detail: 500,
            },
          },
        },
      }),
    )

    // 3. Mock Export preview
    await page.route(/.*\/api\/v1\/exports\/preview(\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          status: 'success',
          message: 'Preview ekspor berhasil dihitung.',
          data: {
            count: String(previewCount),
            sync_limit: 5000,
            queued: isQueued,
            without_coordinates: '0',
          },
        },
      }),
    )

    await page.route('**/api/v1/pembandings/form-options', (route) =>
      route.fulfill({
        json: {
          data: {
            jenisListings: [{ value: 1, label: 'Dijual' }],
            jenisObjeks: [{ value: 1, label: 'Tanah' }],
            peruntukans: [],
            bentukTanahs: [],
            dokumenTanahs: [],
            posisiTanahs: [],
            kondisiTanahs: [],
            statusPemberiInfos: [],
            topografis: [],
          },
        },
      }),
    )

    await page.route('**/api/v1/pembandings/creators', (route) =>
      route.fulfill({ json: { data: [] } }),
    )

    for (const [resource, value] of Object.entries({
      provinces: record.province,
      regencies: record.regency,
      districts: record.district,
      villages: record.village,
    })) {
      await page.route(`**/api/v1/locations/${resource}*`, (route) =>
        route.fulfill({ json: { data: [value] } }),
      )
    }

    await page.route('https://example.test/pembanding-42.jpg', (route) =>
      route.fulfill({ body: 'mock-img', contentType: 'image/png' }),
    )

    // 4. Mock Pembanding list
    await page.route(/.*\/api\/v1\/pembandings(\?.*)?$/, (route) =>
      route.fulfill({
        json: {
          status: 'success',
          message: 'Data pembanding berhasil diambil.',
          data: [record],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 42, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        },
      }),
    )

    // 5. Mock Export download (synchronous)
    await page.route(/.*\/api\/v1\/exports\/download(\?.*)?$/, (route) =>
      route.fulfill({
        status: 200,
        headers: {
          'Content-Disposition': 'attachment; filename="data-pembanding-sync.xlsx"',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: 'binary-mock-excel-file',
      }),
    )

    // 6. Mock Export runs list and create run
    await page.route(/.*\/api\/v1\/exports\/runs(\?.*)?$/, (route) => {
      if (route.request().method() === 'POST') {
        runCreated = true
        return route.fulfill({
          status: 202,
          json: {
            status: 'success',
            message: 'Tugas ekspor berhasil didaftarkan ke antrean.',
            data: {
              id: 99,
              status: 'queued',
              format: 'excel',
              mode: null,
              profile: 'lengkap',
              scope: 'filtered',
              total_records: 12000,
              processed_records: 0,
              created_at: '2026-09-01 10:00:00',
              expires_at: null,
              error: null,
              download_url: null,
            },
          },
        })
      }

      return route.fulfill({
        json: {
          status: 'success',
          message: 'Daftar riwayat tugas ekspor berhasil diambil.',
          data: runCreated
            ? [
                {
                  id: 99,
                  status: 'completed',
                  format: 'excel',
                  mode: null,
                  profile: 'lengkap',
                  scope: 'filtered',
                  total_records: 12000,
                  processed_records: 12000,
                  created_at: '2026-09-01 10:00:00',
                  expires_at: '2026-09-08 10:00:00',
                  error: null,
                  download_url: '/api/v1/exports/runs/99/download',
                },
              ]
            : [],
          meta: {
            current_page: 1,
            per_page: 25,
            from: 1,
            to: runCreated ? 1 : 0,
            total: runCreated ? 1 : 0,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
        },
      })
    })

    // Mock download run
    await page.route(/.*\/api\/v1\/exports\/runs\/99\/download(\?.*)?$/, (route) =>
      route.fulfill({
        status: 200,
        headers: {
          'Content-Disposition': 'attachment; filename="data-pembanding-run-99.xlsx"',
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        body: 'binary-run-content',
      }),
    )

    // A. TEST SYNCHRONOUS EXPORT
    await page.goto('/pembandings')
    const exportBtn = page.getByRole('button', { name: /Ekspor/i })
    await exportBtn.click()

    const exportDialog = page.locator('.pembanding-export-dialog')
    await expect(exportDialog).toBeVisible()
    await expect(page.getByText('Cakupan data:')).toBeVisible()

    // Download synchronously
    const downloadBtn = page.getByRole('button', { name: 'Unduh Sekarang' })
    await downloadBtn.click()
    await expect(page.getByText(/File.*berhasil diunduh/)).toBeVisible()

    // B. TEST ASYNC / QUEUED EXPORT
    previewCount = 12000
    isQueued = true

    // Trigger preview update by changing profile
    const profileSelect = page.locator('[data-testid="export-profile-select"]')
    await profileSelect.selectOption('lengkap')

    // Warning alert should now appear
    await expect(page.getByText('Dialihkan ke Proses Latar Belakang')).toBeVisible()
    const queueBtn = page.getByRole('button', { name: 'Jalankan Ekspor Latar Belakang' })
    await expect(queueBtn).toBeVisible()

    // Click background export
    await queueBtn.click()

    // Tab switches to Riwayat Tugas Ekspor
    await expect(page.locator('[data-testid="export-runs-section"]')).toBeVisible()
    await expect(page.getByText('Ekspor #99 (EXCEL)')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Unduh Berkas' })).toBeVisible()
  })
})
