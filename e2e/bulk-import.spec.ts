import { expect, test } from '@playwright/test'

test.describe('Bulk Import Feature E2E', () => {
  test('complete upload-to-finalize workflow with review and row edit', async ({ page }) => {
    let uploadCalled = false
    let patchSelectionCalled = false
    let rowEditCalled = false
    let finalizeCalled = false

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
              'create_data::pembanding',
              'view_any_data::pembanding',
              'update_data::pembanding',
            ],
          },
        },
      }),
    )

    // 2. Mock Batches list
    await page.route(/.*\/api\/v1\/pembanding-imports(\?.*)?$/, (route) => {
      if (route.request().method() === 'POST') {
        uploadCalled = true
        return route.fulfill({
          status: 201,
          json: {
            status: 'success',
            message: 'File berhasil diunggah dan batch impor dibuat.',
            data: {
              batch_id: 101,
              filename: 'pembanding_jabar_2026.xlsx',
              total_rows: 2,
              status: 'ready',
              status_label: 'Draf',
            },
          },
        })
      }

      return route.fulfill({
        json: {
          status: 'success',
          message: 'Daftar batch impor Excel berhasil diambil.',
          data: [
            {
              id: 101,
              filename: 'pembanding_jabar_2026.xlsx',
              owner: 'Super Admin',
              status: 'ready',
              status_label: 'Draf',
              total_rows: 2,
              selected_rows: 2,
              ready_rows: 1,
              imported_rows: 0,
              failed_rows: 1,
              processing_rows: 0,
              can_edit: true,
              can_finalize: true,
              finalize_block_reason: null,
              finalization_date: '2026-09-01',
              finalized_at: null,
              updated_at: '2026-09-01 10:00:00',
            },
          ],
          meta: { current_page: 1, per_page: 15, from: 1, to: 1, total: 1, last_page: 1 },
          links: { first: '', last: '', prev: null, next: null },
        },
      })
    })

    // 3. Mock Batch detail
    await page.route(/.*\/api\/v1\/pembanding-imports\/101(\?.*)?$/, (route) => {
      const url = new URL(route.request().url())
      const statusFilter = url.searchParams.get('status')

      const allRows = [
        {
          id: 1,
          source_row_number: 2,
          status: 'ready',
          status_label: 'Siap',
          is_selected: true,
          alamat: 'Jl. Riau No. 12, Cihapit',
          location: 'Bandung Wetan, Bandung, Jawa Barat',
          jenis_pembanding: 'Penawaran',
          luas_tanah: 250,
          luas_bangunan: 180,
          nilai_transaksi_terkoreksi: 2500000000,
          warnings: [],
          missing_fields: [],
          last_error: null,
          has_image: true,
          image_source: 'staged',
          image_preview_url: '/staged/foto1.jpg',
        },
        {
          id: 2,
          source_row_number: 3,
          status: rowEditCalled ? 'ready' : 'invalid',
          status_label: rowEditCalled ? 'Siap' : 'Tidak Valid',
          is_selected: true,
          alamat: rowEditCalled ? 'Jl. Merdeka No. 45' : '',
          location: 'Sumur Bandung, Bandung, Jawa Barat',
          jenis_pembanding: 'Transaksi',
          luas_tanah: 150,
          luas_bangunan: 0,
          nilai_transaksi_terkoreksi: 1200000000,
          warnings: [],
          missing_fields: rowEditCalled ? [] : ['alamat', 'latitude', 'longitude'],
          last_error: rowEditCalled ? null : 'Alamat dan koordinat wajib diisi',
          has_image: false,
          image_source: null,
          image_preview_url: null,
        },
      ]

      const filteredRows = statusFilter ? allRows.filter((r) => r.status === statusFilter) : allRows

      return route.fulfill({
        json: {
          status: 'success',
          message: 'Detail batch impor Excel berhasil diambil.',
          batch: {
            id: 101,
            filename: 'pembanding_jabar_2026.xlsx',
            owner: 'Super Admin',
            status: finalizeCalled ? 'completed' : 'ready',
            status_label: finalizeCalled ? 'Selesai' : 'Draf',
            total_rows: 2,
            selected_rows: 2,
            ready_rows: finalizeCalled ? 2 : rowEditCalled ? 2 : 1,
            imported_rows: finalizeCalled ? 2 : 0,
            failed_rows: finalizeCalled ? 0 : rowEditCalled ? 0 : 1,
            processing_rows: 0,
            can_edit: !finalizeCalled,
            can_finalize: !finalizeCalled,
            finalize_block_reason: null,
            finalization_date: '2026-09-01',
            finalized_at: finalizeCalled ? '2026-09-01 11:00:00' : null,
            updated_at: '2026-09-01 10:00:00',
          },
          data: filteredRows,
          options: {
            statusPemberiInfos: [{ value: 1, label: 'Pemilik' }],
            bentukTanahs: [{ value: 1, label: 'Persegi' }],
            posisiTanahs: [{ value: 1, label: 'Tengah' }],
            kondisiTanahs: [{ value: 1, label: 'Matang' }],
            topografis: [{ value: 1, label: 'Datar' }],
            dokumenTanahs: [{ value: 1, label: 'SHM' }],
            peruntukans: [{ value: 1, label: 'Perumahan' }],
          },
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: filteredRows.length,
            total: filteredRows.length,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
        },
      })
    })

    // 4. Mock Selection patch
    await page.route(/.*\/api\/v1\/pembanding-imports\/101\/selection(\?.*)?$/, (route) => {
      patchSelectionCalled = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Pilihan baris berhasil diperbarui.',
          data: { selected_rows: 2 },
        },
      })
    })

    // 5. Mock Row detail and update
    await page.route(/.*\/api\/v1\/pembanding-imports\/101\/rows\/2(\?.*)?$/, (route) => {
      if (route.request().method() === 'PUT') {
        rowEditCalled = true
        return route.fulfill({
          json: {
            status: 'success',
            message: 'Baris data berhasil disimpan.',
            data: {
              id: 2,
              source_row_number: 3,
              status: 'ready',
              status_label: 'Siap',
              is_selected: true,
              alamat: 'Jl. Merdeka No. 45',
            },
          },
        })
      }

      return route.fulfill({
        json: {
          status: 'success',
          message: 'Detail baris berhasil diambil.',
          data: {
            row: {
              id: 2,
              source_row_number: 3,
              status: 'invalid',
              status_label: 'Tidak Valid',
              data: {
                alamat_data: '',
                latitude: null,
                longitude: null,
                harga: 1200000000,
                luas_tanah: 150,
                luas_bangunan: 0,
                jenis_listing_id: 1,
                jenis_objek_id: 1,
              },
              raw_payload: {},
              missing_fields: ['alamat', 'latitude', 'longitude'],
              warnings: [],
              image_url: null,
            },
            options: {
              provinces: [{ label: 'Jawa Barat', value: '32' }],
              regencies: [{ label: 'Kota Bandung', value: '3273' }],
              districts: [{ label: 'Sumur Bandung', value: '327301' }],
              villages: [{ label: 'Merdeka', value: '3273011001' }],
              jenisListings: [{ label: 'Jual', value: 1 }],
              jenisObjeks: [{ label: 'Tanah', value: 1 }],
              statusPemberiInfos: [{ label: 'Pemilik', value: 1 }],
              bentukTanahs: [{ label: 'Persegi', value: 1 }],
              posisiTanahs: [{ label: 'Tengah', value: 1 }],
              kondisiTanahs: [{ label: 'Matang', value: 1 }],
              topografis: [{ label: 'Datar', value: 1 }],
              dokumenTanahs: [{ label: 'SHM', value: 1 }],
              peruntukans: [{ label: 'Perumahan', value: 1 }],
            },
          },
        },
      })
    })

    // 6. Mock Finalize
    await page.route(/.*\/api\/v1\/pembanding-imports\/101\/finalize(\?.*)?$/, (route) => {
      finalizeCalled = true
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Finalisasi impor berhasil dimulai.',
          data: {
            batch: {
              id: 101,
              filename: 'pembanding_jabar_2026.xlsx',
              owner: 'Super Admin',
              status: 'completed',
              status_label: 'Selesai',
              total_rows: 2,
              selected_rows: 2,
              ready_rows: 2,
              imported_rows: 2,
              failed_rows: 0,
              processing_rows: 0,
              can_edit: false,
              can_finalize: false,
              finalize_block_reason: null,
              finalization_date: '2026-09-01',
              finalized_at: '2026-09-01 11:00:00',
              updated_at: '2026-09-01 11:00:00',
            },
          },
        },
      })
    })

    // Navigation and assertions:
    await page.goto('/imports')

    // Expect page heading and batch card
    await expect(page.getByRole('heading', { name: 'Impor Data Pembanding' })).toBeVisible()
    await expect(page.getByText('pembanding_jabar_2026.xlsx')).toBeVisible()

    // Test upload dialog modal
    await page.getByRole('button', { name: 'Unggah Berkas Baru' }).click()
    const uploadDialog = page.locator('.upload-dialog')
    await expect(uploadDialog).toBeVisible()

    // Simulate file selection via file input
    const fileInput = uploadDialog.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'sample_pembanding.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('fake excel content'),
    })

    await page.getByRole('button', { name: 'Unggah & Buka Draf' }).click()

    // Navigate to the batch detail page
    await page.goto('/imports/101')

    // Verify summary statistics
    await expect(page.getByRole('heading', { name: 'pembanding_jabar_2026.xlsx' })).toBeVisible()
    await expect(page.getByText('ID Batch: #101')).toBeVisible()
    await expect(page.getByText('Jl. Riau No. 12, Cihapit')).toBeVisible()

    // Row status tabs
    const invalidTab = page.getByRole('tab', { name: 'Perlu Diperbaiki' })
    await invalidTab.click()
    await expect(page.getByText('Alamat dan koordinat wajib diisi')).toBeVisible()

    // Edit the invalid row
    const editBtn = page.getByRole('button', { name: 'Edit baris' })
    await editBtn.click()

    const editDialog = page.locator('.row-edit-form')
    await expect(editDialog).toBeVisible()

    // Fill in required address and coordinates
    await editDialog.locator('textarea').fill('Jl. Merdeka No. 45')
    await editDialog.locator('input[type="number"]').first().fill('-6.914744')
    await editDialog.locator('input[type="number"]').nth(1).fill('107.609810')

    await page.getByRole('button', { name: 'Simpan Perbaikan' }).click()
    await expect(editDialog).toBeHidden()

    // Switch back to "Semua" tab
    await page.getByRole('tab', { name: /Semua/ }).click()

    // Toggle row selection checkbox
    const rowCheckbox = page.locator('input[aria-label="Pilih baris"]').first()
    await rowCheckbox.click()

    // Finalize batch
    const finalizeTriggerBtn = page.getByRole('button', { name: /Finalisasi Impor/ })
    await finalizeTriggerBtn.click()

    const finalizeDialog = page.locator('.finalize-dialog')
    await expect(finalizeDialog).toBeVisible()

    // Check confirmation checkbox
    const confirmCheckbox = finalizeDialog.locator('input[type="checkbox"]')
    await confirmCheckbox.check()

    // Submit finalization
    await page.getByRole('button', { name: /Mulai Finalisasi/ }).click()

    // Ensure finalize was called and feedback is displayed
    await expect(page.getByText('Proses migrasi data ke tabel utama sedang berjalan')).toBeVisible()

    expect(uploadCalled).toBe(true)
    expect(patchSelectionCalled).toBe(true)
    expect(rowEditCalled).toBe(true)
    expect(finalizeCalled).toBe(true)
  })
})
