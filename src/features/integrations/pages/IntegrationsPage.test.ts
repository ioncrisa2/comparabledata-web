import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'

import { mockServer } from '@/test/mocks/server'

import IntegrationsPage from './IntegrationsPage.vue'

const secret = 'hjar_int_test_secret_visible_once'
const app = { id: 1, name: 'Aplikasi Penilaian', is_active: true, requests_per_minute: 60 }
const key = {
  id: 1,
  name: 'Produksi',
  prefix: 'hjar_int_test',
  scopes: ['locations:read'],
  expires_at: '2099-01-01T00:00:00Z',
  revoked_at: null,
  last_used_at: null,
}
let wrapper: ReturnType<typeof mount> | undefined
let queryClient: QueryClient | undefined

afterEach(() => {
  wrapper?.unmount()
  queryClient?.clear()
  vi.restoreAllMocks()
})

async function setup() {
  mockServer.use(
    http.get('*/api/v1/integrations', () =>
      HttpResponse.json({ data: [app], meta: { current_page: 1, last_page: 1, total: 1 } }),
    ),
    http.get('*/api/v1/integrations/1', () => HttpResponse.json({ data: { ...app, keys: [key] } })),
  )
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: IntegrationsPage }],
  })
  await router.push('/')
  await router.isReady()
  wrapper = mount(RouterView, {
    attachTo: document.body,
    global: { plugins: [PrimeVue, router, [VueQueryPlugin, { queryClient }]] },
  })
  await vi.waitFor(() => expect(wrapper?.find('.integrations-page__app').exists()).toBe(true))
  await wrapper.find('.integrations-page__app').trigger('click')
  await vi.waitFor(() => expect(document.body.textContent).toContain('Produksi'))
}
async function click(label: string) {
  const button = Array.from(document.querySelectorAll('button')).find(
    (item) => item.textContent?.trim() === label,
  )
  expect(button, label).toBeTruthy()
  button!.click()
  await flushPromises()
}

describe('IntegrationsPage', () => {
  it('shows the issued secret once and never retains it in the query or mutation cache', async () => {
    await setup()
    let payload: unknown
    mockServer.use(
      http.post('*/api/v1/integrations/1/keys', async ({ request }) => {
        payload = await request.json()
        return HttpResponse.json({ data: { key, plain_text_key: secret } }, { status: 201 })
      }),
    )
    await click('Terbitkan key')
    const input = document.querySelector<HTMLInputElement>('#integration-key-name')!
    input.value = 'Produksi'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    document
      .querySelector('#integration-key-form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await vi.waitFor(() =>
      expect(document.querySelector<HTMLTextAreaElement>('#integration-secret')?.value).toBe(
        secret,
      ),
    )
    expect(payload).toMatchObject({
      name: 'Produksi',
      scopes: ['pembandings:read', 'pembandings:similar', 'locations:read', 'dictionaries:read'],
    })
    expect(
      JSON.stringify(
        queryClient
          ?.getQueryCache()
          .getAll()
          .map((query) => query.state.data),
      ),
    ).not.toContain(secret)
    expect(queryClient?.getMutationCache().getAll()).toHaveLength(0)
    await click('Saya sudah menyimpan key')
    await vi.waitFor(() => expect(document.querySelector('#integration-secret')).toBeNull())
    expect(document.body.textContent).not.toContain(secret)
  })

  it('requires confirmation to revoke a key and keeps errors visible for retry', async () => {
    await setup()
    const revoke = vi.fn()
    mockServer.use(
      http.delete('*/api/v1/integrations/1/keys/1', () => {
        revoke()
        return HttpResponse.json(
          { message: 'Server belum tersedia.', code: 'UNAVAILABLE' },
          { status: 503 },
        )
      }),
    )
    await click('Cabut key Produksi')
    expect(revoke).not.toHaveBeenCalled()
    await click('Cabut key')
    await vi.waitFor(() => expect(document.body.textContent).toContain('Server belum tersedia.'))
    expect(revoke).toHaveBeenCalledOnce()
    expect(document.body.textContent).toContain('Cabut API key?')
  })

  it('shows an actionable error when the integrations request fails', async () => {
    await setup()
    mockServer.use(
      http.get('*/api/v1/integrations', () =>
        HttpResponse.json({ message: 'Akses ditolak.', code: 'FORBIDDEN' }, { status: 403 }),
      ),
    )
    await queryClient!.invalidateQueries({ queryKey: ['integrations', 'list'] })
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain('Daftar aplikasi belum dapat dimuat'),
    )
    expect(document.body.textContent).toContain('Coba lagi')
  })
})
