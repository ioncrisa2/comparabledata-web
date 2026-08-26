import { expect, test } from '@playwright/test'

test('shows the frontend foundation state', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Fondasi aplikasi · HJAR Sysinfo/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Fondasi frontend siap digunakan',
  )
  await expect(page.getByText('Fondasi aktif')).toBeVisible()
})

test('provides a useful not-found route', async ({ page }) => {
  await page.goto('/alamat-tidak-ada')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alamat ini tidak tersedia')
  await expect(page.getByRole('link', { name: 'Kembali ke halaman utama' })).toBeVisible()
})
