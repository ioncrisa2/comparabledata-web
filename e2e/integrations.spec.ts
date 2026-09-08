import { createRequire } from 'node:module'

import { expect, test } from '@playwright/test'

const require = createRequire(import.meta.url)

const application = {
  id: 1,
  name: 'Aplikasi Penilaian',
  is_active: true,
  requests_per_minute: 60,
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: {
        data: {
          id: 1,
          name: 'Admin Integrasi',
          email: 'admin@example.test',
          roles: ['super_admin'],
          permissions: ['manage_integrations'],
        },
      },
    }),
  )
  await page.route(/.*\/api\/v1\/integrations(\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        data: [application],
        meta: { current_page: 1, last_page: 1, total: 1 },
      },
    }),
  )
  await page.route('**/api/v1/integrations/1', (route) =>
    route.fulfill({
      json: {
        data: {
          ...application,
          keys: [
            {
              id: 1,
              name: 'Produksi',
              prefix: 'hjar_int_7af3',
              scopes: [
                'pembandings:read',
                'pembandings:similar',
                'locations:read',
                'dictionaries:read',
              ],
              expires_at: '2099-01-01T00:00:00Z',
              revoked_at: null,
              last_used_at: null,
            },
          ],
        },
      },
    }),
  )
})

for (const width of [1440, 360]) {
  test(`integration key management remains usable at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/integrations')

    await expect(page.getByRole('heading', { name: 'Integrasi aplikasi' })).toBeVisible()
    await page.getByRole('button', { name: /Aplikasi Penilaian/ }).click()
    await expect(page.getByText('hjar_int_7af3')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Terbitkan key' })).toBeVisible()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    expect(errors).toEqual([])

    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })
    const violations = await page.evaluate(async () => {
      const { axe } = window as unknown as { axe: typeof import('axe-core') }
      const integrationsPage = document.querySelector('.integrations-page')
      if (!integrationsPage) throw new Error('Integrations page is missing')
      const results = await axe.run(integrationsPage, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      })
      return results.violations.map(({ id, nodes }) => ({
        id,
        targets: nodes.map((node) => node.target),
      }))
    })
    expect(violations).toEqual([])
    await page.screenshot({
      path: testInfo.outputPath(`integrations-${width}.png`),
      fullPage: true,
    })
  })
}
