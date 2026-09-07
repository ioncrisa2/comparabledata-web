import { expect, type Page, test } from '@playwright/test'

import { createPembanding } from '../src/features/pembanding/test/fixtures.js'

const photo = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6KAAAAABJRU5ErkJggg==',
  'base64',
)
const record = createPembanding()
const option = (value: number, label: string) => [{ value, label }]
const formOptions = {
  jenisListings: option(1, 'Dijual'),
  jenisObjeks: option(2, 'Rumah tinggal'),
  peruntukans: option(3, 'Permukiman'),
  bentukTanahs: option(4, 'Persegi'),
  dokumenTanahs: option(5, 'SHM'),
  posisiTanahs: option(6, 'Tengah'),
  kondisiTanahs: option(7, 'Siap bangun'),
  statusPemberiInfos: option(8, 'Pemilik'),
  topografis: option(9, 'Datar'),
}

async function mockApi(
  page: Page,
  roles = ['appraiser'],
  permissions = ['view_any_data::pembanding', 'create_data::pembanding', 'update_data::pembanding'],
) {
  // Fail on missing mocks instead of forwarding test requests through the production proxy.
  await page.route(
    (url) => url.pathname.startsWith('/api/'),
    async (route) => {
      await route.abort()
      throw new Error(`Unmocked API request: ${route.request().method()} ${route.request().url()}`)
    },
  )
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: {
        data: {
          id: 7,
          name: 'Ayu Penilai',
          email: 'ayu@example.test',
          roles,
          permissions,
        },
      },
    }),
  )
  await page.route('**/api/v1/notifications*', (route) =>
    route.fulfill({
      json: {
        status: 'success',
        unread_count: 0,
        data: [],
        meta: { current_page: 1, per_page: 5, total: 0, last_page: 1 },
      },
    }),
  )
  await page.route('**/api/v1/pembandings/form-options', (route) =>
    route.fulfill({ json: { data: formOptions } }),
  )
  await page.route('**/api/v1/pembandings/creators', (route) =>
    route.fulfill({ json: { data: [] } }),
  )
  await page.route('**/api/v1/exports/runs*', (route) =>
    route.fulfill({ json: { data: [], meta: { current_page: 1, last_page: 1, total: 0 } } }),
  )
  await page.route('**/api/v1/exports/configuration', (route) =>
    route.fulfill({
      json: {
        data: {
          configuration: { profiles: [], columns: [] },
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
    route.fulfill({ body: photo, contentType: 'image/png' }),
  )
  await page.route('**/api/v1/pembandings/42', (route) => route.fulfill({ json: { data: record } }))
}

async function next(page: Page) {
  await page.getByRole('button', { name: 'Selanjutnya' }).click()
}

for (const width of [1440, 360]) {
  test(`creates a record with a photo, opens detail, then edits it at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await mockApi(page)
    let saved = record
    let creates = 0
    let updates = 0
    await page.route('**/api/v1/pembandings', async (route) => {
      expect(route.request().method()).toBe('POST')
      const data = await new Response(new Uint8Array(route.request().postDataBuffer()!), {
        headers: { 'Content-Type': route.request().headers()['content-type'] },
      }).formData()
      expect(data.get('alamat_data')).toBe(record.alamat_data)
      expect(data.get('village_id')).toBe(record.village.id)
      expect(data.get('harga')).toBe('2400000000')
      const image = data.get('image') as File
      expect(image.name).toBe('property.png')
      expect(image.size).toBe(photo.length)
      creates++
      await route.fulfill({ status: 201, json: { data: saved } })
    })
    await page.route('**/api/v1/pembandings/42', async (route) => {
      if (route.request().method() === 'POST') {
        const data = await new Response(new Uint8Array(route.request().postDataBuffer()!), {
          headers: { 'Content-Type': route.request().headers()['content-type'] },
        }).formData()
        expect(data.get('_method')).toBe('PUT')
        expect(data.get('image')).toBeNull()
        expect(data.get('harga')).toBe('2500000000')
        saved = { ...saved, harga: 2500000000, catatan: 'Catatan diperbarui.' }
        updates++
      }
      await route.fulfill({ json: { data: saved } })
    })
    await page.goto('/pembandings/new')
    await page.getByLabel('Jenis listing').selectOption('1')
    await page.getByLabel('Jenis objek').selectOption('2')
    await page.getByLabel('Tanggal data').fill('2026-08-30')
    await page.getByLabel('Harga').fill('2400000000')
    await next(page)
    await page.getByLabel('Provinsi').selectOption('32')
    await page.getByLabel('Kabupaten/Kota').selectOption('3273')
    await page.getByLabel('Kecamatan').selectOption('3273020')
    await page.getByLabel('Desa/Kelurahan').selectOption('3273020005')
    await page.getByLabel('Alamat lengkap').fill(record.alamat_data)
    await page.getByLabel('Latitude').fill(String(record.latitude))
    await page.getByLabel('Longitude').fill(String(record.longitude))
    await next(page)
    await page.getByLabel('Luas tanah').fill('180')
    await page.getByLabel('Lebar depan').fill('10')
    await page.getByLabel('Lebar jalan').fill('6')
    for (const [label, value] of [
      ['Bentuk tanah', '4'],
      ['Posisi tanah', '6'],
      ['Kondisi tanah', '7'],
      ['Topografi', '9'],
      ['Dokumen tanah', '5'],
      ['Peruntukan', '3'],
    ] as const) {
      await page.getByLabel(label).selectOption(value)
    }
    await next(page)
    await page.getByLabel('Nama pemberi informasi').fill(record.nama_pemberi_informasi)
    await page
      .getByLabel('Unggah foto')
      .setInputFiles({ name: 'property.png', mimeType: 'image/png', buffer: photo })
    await expect(page.getByAltText('Pratinjau foto baru')).toBeVisible()
    // Returning to the photo step must retain the selected file and its preview.
    await page.getByRole('button', { name: 'Sebelumnya' }).click()
    await next(page)
    await expect(page.getByAltText('Pratinjau foto baru')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({
      path: testInfo.outputPath(`create-photo-${width}.png`),
      fullPage: true,
    })
    await page.getByRole('button', { name: 'Simpan data' }).click()
    await expect(page).toHaveURL(/\/pembandings\/42$/)
    await expect(page.getByRole('heading', { name: record.alamat_data })).toBeVisible()
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    await expect(page.getByLabel('Harga')).toHaveValue('2400000000')
    await page.getByLabel('Harga').fill('2500000000')
    await next(page)
    await expect(page.getByLabel('Desa/Kelurahan')).toHaveValue('3273020005')
    await next(page)
    await next(page)
    await page.getByLabel('Catatan tambahan').fill('Catatan diperbarui.')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: 'Simpan perubahan' }).click()
    await expect(page).toHaveURL(/\/pembandings\/42$/)
    await expect(page.getByText('Catatan diperbarui.', { exact: true })).toBeVisible()
    expect(creates).toBe(1)
    expect(updates).toBe(1)
    expect(errors).toEqual([])
  })
}

for (const mode of ['create', 'edit']) {
  test(`${mode} returns to the invalid field after HTTP 422 without losing input`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await mockApi(page)
    const endpoint = mode === 'create' ? '**/api/v1/pembandings' : '**/api/v1/pembandings/42'
    await page.route(endpoint, (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: { data: record } })
      return route.fulfill({
        status: 422,
        json: {
          message: 'Validation failed',
          errors: { harga: ['Harga harus lebih besar dari nol.'] },
        },
      })
    })
    await page.goto(mode === 'create' ? '/pembandings/new' : '/pembandings/42/edit')
    await page.getByLabel('Harga').fill('0')
    await next(page)
    await next(page)
    await next(page)
    await page.getByLabel('Catatan tambahan').fill('Jangan hilangkan catatan ini.')
    await page
      .getByRole('button', { name: mode === 'create' ? 'Simpan data' : 'Simpan perubahan' })
      .click()
    await expect(page.getByText('Harga harus lebih besar dari nol.', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Harga')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Harga')).toHaveValue('0')
    await next(page)
    await next(page)
    await next(page)
    await expect(page.getByLabel('Catatan tambahan')).toHaveValue('Jangan hilangkan catatan ini.')
    expect(errors).toEqual([])
  })
}

test('search survives opening detail and returning to the list', async ({ page }) => {
  await mockApi(page)
  await page.route('**/api/v1/pembandings?*', (route) =>
    route.fulfill({
      json: {
        data: [record],
        meta: { current_page: 1, per_page: 25, total: 1, last_page: 1, from: 1, to: 1 },
        links: { first: null, last: null, prev: null, next: null },
      },
    }),
  )
  await page.goto('/pembandings')
  const search = page.getByPlaceholder('Alamat, wilayah, atau pemberi informasi')
  await search.fill('Dago')
  await expect(page).toHaveURL(/q=Dago/)
  await page.getByRole('link', { name: `Buka detail ${record.alamat_data}`, exact: true }).click()
  await expect(page.getByRole('heading', { name: record.alamat_data })).toBeVisible()
  await page.getByRole('link', { name: 'Kembali ke daftar' }).click()
  await expect(search).toHaveValue('Dago')
  await expect(page).toHaveURL(/\/pembandings\?q=Dago$/)
})

for (const mode of ['create', 'edit']) {
  test(`${mode} preserves input on HTTP 500 and can retry saving`, async ({ page }) => {
    await mockApi(page)
    let attempts = 0
    const endpoint = mode === 'create' ? '**/api/v1/pembandings' : '**/api/v1/pembandings/42'
    await page.route(endpoint, (route) => {
      if (route.request().method() === 'GET') return route.fulfill({ json: { data: record } })
      attempts++
      return attempts === 1
        ? route.fulfill({ status: 500, json: { message: 'Server sedang mengalami gangguan.' } })
        : route.fulfill({ json: { data: record } })
    })
    await page.goto(mode === 'create' ? '/pembandings/new' : '/pembandings/42/edit')
    await next(page)
    await next(page)
    await next(page)
    await page.getByLabel('Catatan tambahan').fill('Tetap simpan catatan ini.')
    const save = page.getByRole('button', {
      name: mode === 'create' ? 'Simpan data' : 'Simpan perubahan',
    })
    await save.click()
    await expect(page.getByText('Server sedang mengalami gangguan.', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Catatan tambahan')).toHaveValue('Tetap simpan catatan ini.')
    await save.click()
    await expect(page).toHaveURL(/\/pembandings\/42$/)
    expect(attempts).toBe(2)
  })
}

test('duplicate response offers review, navigates to review, and resolves with use_existing', async ({
  page,
}) => {
  await mockApi(page)
  await page.route('**/api/v1/pembandings', (route) =>
    route.fulfill({
      status: 409,
      json: {
        code: 'DUPLICATE_REVIEW_REQUIRED',
        message: 'Data terindikasi duplikat.',
        duplicate: {
          submission_id: '12',
          submission_url: '/pembandings/submissions/12',
          expires_at: null,
        },
      },
    }),
  )
  await page.route('**/api/v1/pembanding-submissions/12', (route) =>
    route.fulfill({
      json: {
        data: {
          submission: {
            id: '12',
            expires_at: '2026-12-31T23:59:59Z',
            image_url: null,
            rows: [{ key: 'alamat', label: 'Alamat', value: 'Jl. Pembanding No. 12' }],
          },
          candidates: [
            {
              id: 42,
              created_by: 'Budi Appraiser',
              updated_at: null,
              deleted: false,
              can_update: 'yes',
              image_url: null,
              rows: [{ key: 'alamat', label: 'Alamat', value: record.alamat_data }],
            },
          ],
        },
      },
    }),
  )
  let resolved = false
  await page.route('**/api/v1/pembanding-submissions/12/resolution', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      strategy: 'use_existing',
      candidate_id: 42,
    })
    resolved = true
    await route.fulfill({
      json: {
        status: 'success',
        message: 'Duplikat berhasil ditangani.',
        data: {},
      },
    })
  })

  await page.goto('/pembandings/new')
  await next(page)
  await next(page)
  await next(page)
  await page.getByLabel('Catatan tambahan').fill('Data untuk ditinjau.')
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('button', { name: 'Tinjau data duplikat' })).toBeVisible()
  await expect(page.getByLabel('Catatan tambahan')).toHaveValue('Data untuk ditinjau.')

  await page.getByRole('button', { name: 'Tinjau data duplikat' }).click()
  await expect(page).toHaveURL('/pembandings/submissions/12')
  await expect(page.getByRole('heading', { name: 'Tinjau data duplikat' })).toBeVisible()
  await expect(page.getByText('Jl. Pembanding No. 12')).toBeVisible()

  await page.getByRole('button', { name: /#42/ }).click()
  await page.getByRole('button', { name: 'Pertahankan data lama ini, batalkan input baru' }).click()
  await expect(page.getByText('Konfirmasi tindakan')).toBeVisible()
  await page.getByRole('button', { name: 'Ya, lanjutkan' }).click()

  await expect(page.getByText('Duplikat berhasil ditangani')).toBeVisible()
  expect(resolved).toBe(true)
})

for (const roles of [['appraiser'], ['data_contributor']]) {
  test(`${roles[0]} can edit owned data without special edit permission`, async ({ page }) => {
    await mockApi(page, roles, [])
    await page.goto('/pembandings/42')
    await page.getByRole('link', { name: 'Edit', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Edit data pembanding' })).toBeVisible()
    await expect(page.getByLabel('Harga')).toHaveValue(String(record.harga))
  })
}

test('non-contributor can edit and request deletion of another contributor record without edit permission', async ({
  page,
}) => {
  await mockApi(page, ['appraiser'], [])
  await page.route('**/api/v1/pembandings/42', (route) =>
    route.fulfill({
      json: {
        data: { ...record, created_by: { id: 99, name: 'Budi Kontributor' } },
      },
    }),
  )
  let requests = 0
  await page.route('**/api/v1/pembandings/42/delete-request', (route) => {
    requests++
    if (requests === 1)
      return route.fulfill({ status: 500, json: { message: 'Gangguan sementara' } })
    expect(route.request().postDataJSON()).toEqual({
      reason: 'Data properti ini terinput dua kali.',
    })
    return route.fulfill({ json: { data: { id: 1, status: 'pending' } } })
  })
  await page.goto('/pembandings/42')
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Request Hapus Data' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Alasan penghapusan').fill('Data properti ini terinput dua kali.')
  await dialog.getByRole('button', { name: 'Kirim Request Hapus' }).click()
  await expect(dialog.getByText('Permintaan gagal dikirim')).toBeVisible()
  await expect(dialog.getByLabel('Alasan penghapusan')).toHaveValue(
    'Data properti ini terinput dua kali.',
  )
  await dialog.getByRole('button', { name: 'Kirim Request Hapus' }).click()
  await expect(page.getByText('Permintaan hapus terkirim')).toBeVisible()
  await page.getByRole('link', { name: 'Edit', exact: true }).click()
  await expect(page.getByLabel('Harga')).toBeVisible()
})

test('contributor cannot expose another owner record or edit form even if a stale API returns it', async ({
  page,
}) => {
  await mockApi(page, ['data_contributor'])
  await page.route('**/api/v1/pembandings/42', (route) =>
    route.fulfill({
      json: {
        data: { ...record, created_by: { id: 99, name: 'Budi Kontributor' } },
      },
    }),
  )
  await page.goto('/pembandings/42')
  await expect(page.getByText('Anda tidak dapat membuka data ini')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Historis', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0)
  await expect(page.getByText(record.alamat_data, { exact: true })).toHaveCount(0)
  await page.goto('/pembandings/42/edit')
  await expect(page.getByText('Anda tidak dapat mengedit data ini')).toBeVisible()
  await expect(page.getByLabel('Harga')).toHaveCount(0)
  await expect(page.getByText(record.alamat_data, { exact: true })).toHaveCount(0)
})

for (const width of [1440, 360]) {
  test(`history shows actor, time and added changed removed values at ${width}px`, async ({
    page,
  }, testInfo) => {
    await mockApi(page)
    await page.setViewportSize({ width, height: 1000 })
    let historyRequests = 0
    await page.route('**/api/v1/pembandings/42/history', (route) => {
      historyRequests++
      return route.fulfill({
        json: {
          data: [
            {
              id: 2,
              event: 'updated',
              causer: 'Budi Penilai',
              causer_email: 'budi@example.test',
              created_at: '2026-09-06T03:15:00+00:00',
              changes: [
                { field: 'harga', old: 2400000000, new: 2500000000 },
                { field: 'catatan', old: 'Catatan yang tidak berlaku', new: null },
                { field: 'lebar_jalan', old: null, new: 8 },
              ],
            },
            {
              id: 1,
              event: 'created',
              causer: 'Ayu Kontributor',
              causer_email: null,
              created_at: '2026-09-05T03:00:00+00:00',
              changes: [{ field: 'alamat_data', old: null, new: record.alamat_data }],
            },
          ],
        },
      })
    })
    await page.goto('/pembandings/42')
    const button = page.getByRole('button', { name: 'Historis', exact: true })
    await expect(button).toBeVisible()
    expect(historyRequests).toBe(0)
    await button.click()
    const panel = page.locator('#pembanding-history')
    await expect(panel.getByText('Budi Penilai', { exact: false })).toBeVisible()
    await expect(panel.getByText(/Rp.*2\.400\.000\.000/)).toBeVisible()
    await expect(panel.getByText(/Rp.*2\.500\.000\.000/)).toBeVisible()
    await expect(panel.getByText('Dihapus', { exact: true })).toBeVisible()
    await expect(
      panel.locator('details[open]').getByText('Ditambahkan', { exact: true }),
    ).toBeVisible()
    await expect(panel.getByText('6 Sep 2026, 10.15 WIB', { exact: true })).toBeVisible()
    await panel.getByText('Data ditambahkan', { exact: true }).click()
    await expect(panel.getByText(record.alamat_data, { exact: true })).toBeVisible()
    await panel.evaluate((element) => element.scrollIntoView({ block: 'start' }))
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', width)
    await panel.screenshot({ path: testInfo.outputPath(`history-${width}.png`) })
    await button.click()
    await expect(panel).toHaveCount(0)
  })
}

test('history handles empty results and failed requests with retry', async ({ page }) => {
  await mockApi(page)
  let fail = true
  await page.route('**/api/v1/pembandings/42/history', (route) =>
    fail
      ? route.fulfill({ status: 500, json: { message: 'Gangguan sementara' } })
      : route.fulfill({ json: { data: [] } }),
  )
  await page.goto('/pembandings/42')
  await page.getByRole('button', { name: 'Historis', exact: true }).click()
  const panel = page.locator('#pembanding-history')
  await expect(panel.getByText('Riwayat gagal dimuat')).toBeVisible({ timeout: 10000 })
  fail = false
  await panel.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(panel.getByText('Belum ada riwayat tercatat')).toBeVisible()
})
