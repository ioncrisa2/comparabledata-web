import { expect, test } from '@playwright/test'

test.describe('design system showcase', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Visual baseline uses Chromium.')

  test('matches the desktop reference and syncs pagination to the URL', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/__design-system')
    await expect(page.getByRole('heading', { name: /Design system yang tenang/i })).toBeVisible()

    await page.getByRole('button', { name: 'Hapus data' }).click()
    await expect(page.getByRole('dialog')).toContainText('Hapus data pembanding?')
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()

    await page.getByRole('button', { name: 'Halaman berikutnya' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(page).toHaveScreenshot('design-system-desktop.png', {
      fullPage: true,
      animations: 'disabled',
      stylePath: 'e2e/visual-snapshot.css',
      maxDiffPixelRatio: 0.02,
      threshold: 0.25,
    })
  })

  test('keeps the complete component vocabulary usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/__design-system')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).toHaveScreenshot('design-system-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      stylePath: 'e2e/visual-snapshot.css',
      maxDiffPixelRatio: 0.02,
      threshold: 0.25,
    })
  })
})
