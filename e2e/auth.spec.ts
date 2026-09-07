import { expect, test } from '@playwright/test'

const user = {
  id: 7,
  name: 'Ayu Penilai',
  email: 'ayu@example.com',
  roles: ['appraiser'],
  permissions: ['view_any_data::pembanding'],
  created_at: null,
  updated_at: null,
}

test('supports login return-to, validation feedback, and logout', async ({ page }) => {
  let authenticated = false

  await page.route('**/sanctum/csrf-cookie', async (route) => {
    await route.fulfill({ status: 204 })
  })
  await page.route('**/api/v1/auth/me', async (route) => {
    await route.fulfill({
      status: authenticated ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(
        authenticated
          ? { status: 'success', message: 'User retrieved.', data: user }
          : { message: 'Unauthenticated.' },
      ),
    })
  })
  await page.route('**/api/v1/auth/session', async (route) => {
    if (route.request().method() === 'DELETE') {
      authenticated = false
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'success', message: 'Logout berhasil.', data: null }),
      })
      return
    }

    const credentials = route.request().postDataJSON() as { password: string }
    if (credentials.password !== 'secret') {
      await route.fulfill({
        status: 422,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Email atau kata sandi tidak sesuai.',
          errors: { email: ['Periksa kembali email dan kata sandi Anda.'] },
        }),
      })
      return
    }

    authenticated = true
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'success', message: 'Login berhasil.', data: user }),
    })
  })

  await page.goto('/')
  await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)$/)

  await page.getByLabel('Email').fill('ayu@example.com')
  await page.getByLabel('Kata sandi').fill('wrong')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page.locator('.ui-alert')).toContainText('Email atau kata sandi tidak sesuai.')
  await expect(page.getByText('Periksa kembali email dan kata sandi Anda.')).toBeVisible()

  await page.getByLabel('Kata sandi').fill('secret')
  await page.getByRole('button', { name: 'Masuk' }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Selamat datang, Ayu Penilai' })).toBeVisible()

  await page.getByRole('button', { name: /Menu pengguna|Ayu Penilai/i }).click()
  await page.getByRole('button', { name: 'Keluar' }).click()
  await expect(page).toHaveURL('/login')
  await expect(page.getByRole('heading', { name: 'Masuk ke ruang kerja' })).toBeVisible()
})
