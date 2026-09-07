import { expect, test } from '@playwright/test'

test.describe('Moderation Feature E2E', () => {
  test('moderation workflow: view requests, approve with target summary, switch tabs, and force delete with high-friction confirmation', async ({
    page,
  }) => {
    let approveCalled = false
    let forceDeleteCalled = false

    // Mock authenticated user with full moderation permissions
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Super Admin',
            email: 'admin@hjar.id',
            roles: ['super_admin'],
            permissions: [
              'view_moderation',
              'approve_delete_request',
              'reject_delete_request',
              'restore_data::pembanding',
              'force_delete_data::pembanding',
            ],
          },
        },
      }),
    )

    // Mock moderation endpoints
    await page.route('**/api/v1/moderation**', (route) => {
      const url = new URL(route.request().url())
      const tab = url.searchParams.get('tab')

      if (tab === 'trash') {
        return route.fulfill({
          json: {
            status: 'success',
            message: 'Data tempat sampah berhasil diambil.',
            tab: 'trash',
            data: forceDeleteCalled
              ? []
              : [
                  {
                    id: 201,
                    pembanding_id: 201,
                    alamat_data: 'Jl. Pemuda No. 77, Surabaya',
                    harga: 750000000,
                    deleted_at: '2026-09-01T10:00:00Z',
                    deleted_reason: 'Aset tidak lagi tersedia',
                    jenis_listing: { name: 'Jual' },
                    deleted_by: { name: 'Admin Doni' },
                  },
                ],
            meta: {
              current_page: 1,
              per_page: 15,
              from: 1,
              to: forceDeleteCalled ? 0 : 1,
              total: forceDeleteCalled ? 0 : 1,
              last_page: 1,
            },
            links: { first: '', last: '', prev: null, next: null },
            can: { restore: true, forceDelete: true },
          },
        })
      }

      // Default: requests tab
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: approveCalled
            ? []
            : [
                {
                  id: 101,
                  pembanding_id: 45,
                  reason: 'Data terindikasi ganda dengan listing #88',
                  requested_by: { id: 2, name: 'Siti Surveyor' },
                  pembanding: {
                    id: 45,
                    alamat_data: 'Jl. Sudirman No. 45, Jakarta Pusat',
                    harga: 1250000000,
                    jenis_listing: { name: 'Jual' },
                  },
                },
              ],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: approveCalled ? 0 : 1,
            total: approveCalled ? 0 : 1,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
          can: { approve: true, reject: true },
        },
      })
    })

    // Mock approve delete request
    await page.route('**/api/v1/moderation/delete-requests/101/approve', (route) => {
      approveCalled = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Permohonan disetujui dan data dipindahkan ke tempat sampah.',
          data: null,
        },
      })
    })

    // Mock force delete pembanding
    await page.route('**/api/v1/moderation/pembandings/201', (route) => {
      if (route.request().method() === 'DELETE') {
        forceDeleteCalled = true
        return route.fulfill({
          json: {
            status: 'success',
            message: 'Data pembanding berhasil dihapus permanen.',
            data: null,
          },
        })
      }
      return route.continue()
    })

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/moderation')

    // Verify page header and initial requests list
    await expect(page.locator('h1')).toContainText('Moderasi data')
    await expect(page.getByText('Jl. Sudirman No. 45, Jakarta Pusat')).toBeVisible()
    await expect(page.getByText('Data terindikasi ganda dengan listing #88')).toBeVisible()
    await expect(page.getByText('Oleh: Siti Surveyor')).toBeVisible()

    // Click Setujui button
    const approveBtn = page.getByRole('button', { name: 'Setujui' })
    await expect(approveBtn).toBeVisible()
    await approveBtn.click()

    // Verify target summary inside confirm dialog (MOD-1003)
    const approveDialog = page.getByRole('dialog')
    await expect(approveDialog.getByText('Setujui permohonan hapus?')).toBeVisible()
    await expect(approveDialog.getByText('Jl. Sudirman No. 45, Jakarta Pusat')).toBeVisible()
    await expect(approveDialog.getByText('Siti Surveyor')).toBeVisible()

    // Confirm approve
    const confirmApproveBtn = approveDialog.getByRole('button', { name: 'Ya, setujui hapus' })
    await confirmApproveBtn.click()

    // Verify success feedback alert
    await expect(page.getByText('Permohonan disetujui')).toBeVisible()

    // Switch to Tempat Sampah tab (MOD-1002)
    const trashTabBtn = page.getByRole('tab', { name: 'Tempat Sampah' })
    await trashTabBtn.click()
    await expect(page).toHaveURL(/tab=trash/)
    await expect(page.getByText('Jl. Pemuda No. 77, Surabaya')).toBeVisible()

    // Click Hapus Permanen button
    const forceDeleteBtn = page.getByRole('button', { name: 'Hapus Permanen' })
    await expect(forceDeleteBtn).toBeVisible()
    await forceDeleteBtn.click()

    // High friction confirmation dialog opens (MOD-1006)
    const forceDialog = page.getByRole('dialog')
    await expect(forceDialog.getByText('Hapus Permanen Data Pembanding')).toBeVisible()
    await expect(forceDialog.getByText('Peringatan Kritis')).toBeVisible()
    await expect(forceDialog.getByText('Jl. Pemuda No. 77, Surabaya')).toBeVisible()

    const confirmForceBtn = forceDialog.locator('[data-testid="confirm-force-delete-btn"]')
    await expect(confirmForceBtn).toBeDisabled()

    // Check mandatory confirmation checkbox
    const confirmCheckbox = forceDialog.locator('[data-testid="force-delete-checkbox"]')
    await confirmCheckbox.check()
    await expect(confirmForceBtn).toBeEnabled()

    // Submit force delete
    await confirmForceBtn.click()

    // Verify success notification
    await expect(page.getByText('Data dihapus permanen')).toBeVisible()
  })

  test('handles concurrent conflict ALREADY_PROCESSED gracefully (MOD-1007)', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 1,
            name: 'Moderator',
            email: 'mod@hjar.id',
            roles: ['admin'],
            permissions: ['view_moderation', 'approve_delete_request'],
          },
        },
      }),
    )

    await page.route('**/api/v1/moderation**', (route) =>
      route.fulfill({
        json: {
          status: 'success',
          message: 'Data moderasi berhasil diambil.',
          tab: 'requests',
          data: [
            {
              id: 99,
              pembanding_id: 88,
              reason: 'Permintaan penghapusan',
              requested_by: { id: 3, name: 'Budi' },
              pembanding: {
                id: 88,
                alamat_data: 'Jl. Pahlawan No. 10',
                harga: 500000000,
                jenis_listing: { name: 'Jual' },
              },
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: { approve: true },
        },
      }),
    )

    // Simulate conflict response: another moderator already processed the request
    await page.route('**/api/v1/moderation/delete-requests/99/approve', (route) =>
      route.fulfill({
        status: 422,
        json: {
          status: 'error',
          code: 'ALREADY_PROCESSED',
          message: 'Permohonan hapus sudah diproses sebelumnya.',
        },
      }),
    )

    await page.goto('/moderation')
    await expect(page.getByText('Jl. Pahlawan No. 10')).toBeVisible()

    await page.getByRole('button', { name: 'Setujui' }).click()
    await page.getByRole('button', { name: 'Ya, setujui hapus' }).click()

    // Expect warning alert for concurrency conflict
    await expect(page.getByText('Konflik Moderasi Terdeteksi')).toBeVisible()
    await expect(page.getByText('Permohonan hapus sudah diproses sebelumnya.')).toBeVisible()
  })

  test('enforces permission matrix: restricted user cannot see moderation action buttons', async ({
    page,
  }) => {
    // User only has view_moderation permission
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        json: {
          data: {
            id: 2,
            name: 'Viewer Only',
            email: 'viewer@hjar.id',
            roles: ['viewer'],
            permissions: ['view_moderation'],
          },
        },
      }),
    )

    await page.route('**/api/v1/moderation**', (route) => {
      const url = new URL(route.request().url())
      const tab = url.searchParams.get('tab')

      if (tab === 'trash') {
        return route.fulfill({
          json: {
            status: 'success',
            tab: 'trash',
            data: [
              {
                id: 301,
                pembanding_id: 301,
                alamat_data: 'Jl. Cempaka No. 5',
                harga: 300000000,
                deleted_at: '2026-09-01T00:00:00Z',
                deleted_reason: 'Terjual',
                jenis_listing: null,
                deleted_by: null,
              },
            ],
            meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
            links: { first: '', last: '', prev: null, next: null },
            can: {},
          },
        })
      }

      return route.fulfill({
        json: {
          status: 'success',
          tab: 'requests',
          data: [
            {
              id: 302,
              pembanding_id: 302,
              alamat_data: 'Jl. Kenanga No. 8',
              harga: 400000000,
              deleted_at: null,
              deleted_reason: 'Ganda',
              jenis_listing: null,
              deleted_by: null,
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
          can: {},
        },
      })
    })

    // In requests tab: Setujui and Tolak buttons must NOT be present
    await page.goto('/moderation')
    await expect(page.getByText('Jl. Kenanga No. 8')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Setujui' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tolak' })).toHaveCount(0)

    // In trash tab: Pulihkan and Hapus Permanen buttons must NOT be present
    await page.goto('/moderation?tab=trash')
    await expect(page.getByText('Jl. Cempaka No. 5')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pulihkan' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Hapus Permanen' })).toHaveCount(0)
  })
})
