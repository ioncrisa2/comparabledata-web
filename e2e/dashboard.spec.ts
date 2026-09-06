import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

import { dashboardResponse } from '../src/features/dashboard/test/fixtures.js'

const require = createRequire(import.meta.url)

const user = {
  id: 7,
  name: 'Ayu Penilai',
  email: 'ayu@example.com',
  roles: ['appraiser'],
  permissions: ['view_any_data::pembanding'],
  created_at: null,
  updated_at: null,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ json: { status: 'success', data: user } }),
  )
})

for (const width of [360, 768, 1024, 1440]) {
  test(`dashboard widgets and map filter work at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 1000 })
    let requests = 0
    await page.route('**/api/v1/dashboard', (route) => {
      requests++
      return route.fulfill({ json: dashboardResponse() })
    })
    // Test the fallback without depending on a third-party tile server.
    await page.route('https://tile.openstreetmap.org/**', (route) => route.abort())
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Tren input data pembanding' })).toBeVisible()
    await expect(page.locator('.dashboard-chart[aria-busy="false"]')).toHaveCount(2)
    await expect(page.getByRole('button', { name: 'Lihat semua titik' })).toBeVisible()
    await expect(
      page.getByText('Peta dasar gagal dimuat. Titik dan daftar lokasi tetap tersedia.'),
    ).toBeVisible()
    await page.getByText('Lihat daftar lokasi (3)', { exact: true }).click()
    await page.getByRole('button', { name: /Jl\. Ir\. H\. Juanda/ }).click()
    await expect(page.getByRole('region', { name: 'Lokasi terpilih', exact: true })).toContainText(
      'Juanda',
    )
    await expect(page.getByRole('link', { name: 'Lihat detail pembanding' })).toHaveAttribute(
      'href',
      '/pembandings/42',
    )
    await page.getByLabel('Jenis listing pada peta').selectOption('2')
    await expect(page).toHaveURL(/map_listing=2/)
    await expect(page.getByText('1 titik ditampilkan', { exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Lokasi terpilih', exact: true })).toHaveCount(0)
    await page.goBack()
    await expect(page.getByLabel('Jenis listing pada peta')).toHaveValue('')
    await expect(page.getByText('3 titik ditampilkan', { exact: true })).toBeVisible()
    await page.getByText('Lihat tabel tren bulanan', { exact: true }).click()
    await expect(
      page.getByRole('region', { name: 'Tabel tren bulanan', exact: true }),
    ).toContainText('Sep 2025')
    await page.getByText('Lihat tabel komposisi listing', { exact: true }).click()
    await expect(
      page.getByRole('region', { name: 'Tabel komposisi listing', exact: true }),
    ).toContainText('Penawaran')
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    expect(requests).toBe(1)
    expect(errors).toEqual([])
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
    const violations = await page.evaluate(async () => {
      const { axe } = window as unknown as { axe: typeof import('axe-core') }
      const dashboard = document.querySelector('main')
      if (!dashboard) throw new Error('Dashboard main region is missing')
      const results = await axe.run(dashboard, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      })
      return results.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      }))
    })
    expect(violations).toEqual([])
    await page.screenshot({ path: testInfo.outputPath(`dashboard-${width}.png`), fullPage: true })
  })
}

test('denied widgets never appear and API errors can be retried', async ({ page }) => {
  let failed = true
  await page.route('**/api/v1/dashboard', (route) =>
    route.fulfill(
      failed
        ? { status: 403, json: { message: 'Akses dashboard ditolak.' } }
        : { json: dashboardResponse({ can_widgets: {} }) },
    ),
  )
  await page.goto('/')
  await expect(page.getByText('Dashboard gagal dimuat')).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Coba lagi', exact: true }).click()
  await expect(page.getByText('Belum ada widget yang dapat diakses')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Peta sebaran data' })).toHaveCount(0)
  await expect(page.locator('canvas')).toHaveCount(0)
})

test('contributor response supports the map without requiring extended widgets', async ({
  page,
}) => {
  const { stats, map_points, jenis_listing_options, can } = dashboardResponse().data
  await page.route('**/api/v1/dashboard', (route) =>
    route.fulfill({
      json: {
        data: {
          dashboard_variant: 'data_contributor',
          stats,
          map_points,
          jenis_listing_options,
          can,
          can_widgets: { map: true, statsOverview: true, dataEntryTrendChart: true },
          delete_request_alert: null,
        },
      },
    }),
  )
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Ringkasan akun kontributor' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lihat semua titik' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tren input data pembanding' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Data pembanding terbaru' })).toHaveCount(0)
})
