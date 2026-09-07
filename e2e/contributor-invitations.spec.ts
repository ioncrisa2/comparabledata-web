import { expect, test } from '@playwright/test'

test('full invitation-to-registration-to-approval flow', async ({ page }) => {
  let inviteCreated = false
  let registrationSubmitted = false
  let requestAccepted = false

  const rawToken = 'test-token-uuid-1234'
  const generatedEmail = 'calon.kontributor@contributor.local'

  // Mock Admin Auth
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({
      json: {
        data: {
          id: 1,
          name: 'Super Admin',
          email: 'admin@hjar.id',
          roles: ['super_admin'],
          permissions: ['manage_data_contributor_invitations', 'view_any_user'],
        },
      },
    }),
  )

  // Mock Invitations API
  await page.route('**/api/v1/data-contributor-invitations', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Daftar token undangan berhasil diambil.',
          data: inviteCreated
            ? [
                {
                  id: 1,
                  token_fingerprint: 'fp-test-token',
                  status: 'active',
                  expires_at: '2026-09-14T00:00:00Z',
                  used_at: null,
                  created_at: '2026-09-07T00:00:00Z',
                  created_by: 'Super Admin',
                  request: null,
                },
              ]
            : [],
          meta: {
            current_page: 1,
            per_page: 15,
            from: 1,
            to: 1,
            total: inviteCreated ? 1 : 0,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
        },
      })
    }

    if (route.request().method() === 'POST') {
      inviteCreated = true
      return route.fulfill({
        status: 201,
        json: {
          status: 'success',
          message: 'Tautan undangan berhasil dibuat.',
          data: {
            id: 1,
            raw_token: rawToken,
            registration_url: `http://localhost:5173/register-contributor/${rawToken}`,
            expires_at: '2026-09-14T00:00:00Z',
          },
        },
      })
    }
  })

  // Mock Public Token Verification
  await page.route(`**/api/v1/public/data-contributor-registration/${rawToken}`, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        json: {
          status: 'success',
          message: 'Token undangan valid.',
          data: {
            is_valid: true,
            valid: true,
            expires_at: '2026-09-14T00:00:00Z',
          },
        },
      })
    }

    if (route.request().method() === 'POST') {
      registrationSubmitted = true
      return route.fulfill({
        status: 201,
        json: {
          status: 'success',
          message: 'Pendaftaran kontributor berhasil dikirim.',
          data: {
            generated_email: generatedEmail,
            message:
              'Pendaftaran berhasil dikirim. Tunggu persetujuan admin untuk mengaktifkan akun Anda.',
          },
        },
      })
    }
  })

  // Mock Registration Requests API
  await page.route('**/api/v1/data-contributor-registration-requests', (route) => {
    return route.fulfill({
      json: {
        status: 'success',
        message: 'Daftar pengajuan registrasi berhasil diambil.',
        data: registrationSubmitted
          ? [
              {
                id: 10,
                display_name: 'Calon Kontributor',
                generated_email: generatedEmail,
                phone: '081234567890',
                status: requestAccepted ? 'accepted' : 'pending',
                submitted_at: '2026-09-07T00:00:00Z',
                generated_by: 'System',
                accepted_at: requestAccepted ? '2026-09-07T01:00:00Z' : null,
                accepted_by: requestAccepted ? 'Super Admin' : '',
                rejected_at: null,
                rejected_by: '',
                reject_reason: null,
              },
            ]
          : [],
        meta: {
          current_page: 1,
          per_page: 15,
          from: 1,
          to: 1,
          total: registrationSubmitted ? 1 : 0,
          last_page: 1,
        },
        links: { first: '', last: '', prev: null, next: null },
      },
    })
  })

  // Mock Request Accept API
  await page.route('**/api/v1/data-contributor-registration-requests/10/accept', (route) => {
    requestAccepted = true
    return route.fulfill({
      json: {
        status: 'success',
        message: 'Pengajuan disetujui.',
      },
    })
  })

  await page.route('**/api/v1/users', (route) =>
    route.fulfill({
      json: {
        status: 'success',
        data: [],
        meta: { current_page: 1, per_page: 15, from: 0, to: 0, total: 0, last_page: 1 },
      },
    }),
  )

  await page.setViewportSize({ width: 1440, height: 900 })

  // 1. Admin navigates to Contributor Invitations Page
  await page.goto('/contributor-invitations')
  await expect(page.locator('h1')).toContainText('Undangan & Registrasi Kontributor')

  // 2. Admin clicks "Buat Tautan Undangan"
  const createButton = page.locator('button', { hasText: 'Buat Tautan Undangan' }).first()
  await createButton.click()

  // 3. Dialog opens showing the generated registration link
  await expect(page.getByText('Tautan Undangan Berhasil Dibuat')).toBeVisible()
  const linkInput = page.locator('input[readonly]')
  await expect(linkInput).toHaveValue(`http://localhost:5173/register-contributor/${rawToken}`)

  // Close dialog
  await page.locator('button', { hasText: 'Tutup' }).click()

  // 4. Public Contributor opens the registration link
  await page.goto(`/register-contributor/${rawToken}`)
  await expect(page.locator('h1')).toContainText('Pendaftaran Kontributor')
  await expect(page.getByText('Undangan Terverifikasi')).toBeVisible()

  // 5. Public Contributor fills and submits registration form
  await page.locator('input[name="display_name"]').fill('Calon Kontributor')
  await page.locator('input[name="phone"]').fill('081234567890')
  await page.locator('input[name="password"]').fill('Password123')
  await page.locator('input[name="password_confirmation"]').fill('Password123')

  await page.locator('button[type="submit"]').click()

  // 6. Success state displays generated email
  await expect(page.locator('h1')).toContainText('Pendaftaran Terkirim!')
  await expect(page.locator('code')).toContainText(generatedEmail)

  // 7. Admin goes back to review requests tab
  await page.goto('/contributor-invitations?tab=requests')
  await expect(page.locator('strong', { hasText: 'Calon Kontributor' })).toBeVisible()
  await expect(page.getByText('Menunggu Evaluasi')).toBeVisible()

  // 8. Admin accepts the registration request
  await page.getByRole('button', { name: 'Setujui', exact: true }).click()
  await expect(page.getByText('Setujui Permohonan Kontributor?')).toBeVisible()
  await page.locator('button', { hasText: 'Setujui dan Buat Akun' }).click()

  // 9. Status is updated to accepted
  await expect(page.getByText('Disetujui oleh Super Admin')).toBeVisible()
  expect(requestAccepted).toBe(true)
})
