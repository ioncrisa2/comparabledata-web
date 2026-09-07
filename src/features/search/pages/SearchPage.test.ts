import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { mockServer } from '@/test/mocks/server'

import SearchPage from './SearchPage.vue'

describe('SearchPage', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/search', name: 'search', component: SearchPage },
      {
        path: '/pembandings/:id',
        name: 'pembanding.detail',
        component: { template: '<div>Detail</div>' },
      },
    ],
  })

  beforeEach(async () => {
    await router.push('/search')
    mockServer.use(
      http.get('*/api/v1/search', ({ request }) => {
        const url = new URL(request.url)
        const q = url.searchParams.get('q')

        if (q === 'dago') {
          return HttpResponse.json({
            status: 'success',
            message: 'Hasil pencarian berhasil diambil.',
            query: 'dago',
            data: [
              {
                menu_group: 'Bank Data',
                menu_name: 'Appraisal Data',
                resource_name: 'Data Pembanding',
                title: 'Perumahan Dago Resort',
                target_type: 'pembanding',
                target_id: '88',
                api_url: '/api/v1/pembandings/88',
                details: {
                  ID: '#88',
                  Harga: 'Rp 1.5 M',
                },
                icon: 'pi pi-database',
              },
            ],
            meta: {
              current_page: 1,
              per_page: 20,
              from: 1,
              to: 1,
              total: 1,
              last_page: 1,
            },
            links: { first: '', last: '', prev: null, next: null },
            summary: { raw_total: 1, filtered_total: 1 },
            options: {
              menu_groups: [{ label: 'Bank Data', value: 'Bank Data' }],
              menu_names: [],
              resource_names: [],
            },
          })
        }

        return HttpResponse.json({
          status: 'success',
          message: 'Hasil pencarian kosong.',
          query: q || '',
          data: [],
          meta: {
            current_page: 1,
            per_page: 20,
            from: null,
            to: null,
            total: 0,
            last_page: 1,
          },
          links: { first: '', last: '', prev: null, next: null },
          summary: { raw_total: 0, filtered_total: 0 },
          options: {
            menu_groups: [],
            menu_names: [],
            resource_names: [],
          },
        })
      }),
    )
  })

  function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return mount(SearchPage, {
      global: {
        plugins: [PrimeVue, router, [VueQueryPlugin, { queryClient }]],
      },
    })
  }

  it('renders initial empty state when no query is present', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    expect(wrapper.text()).toContain('Pencarian Global')
    expect(wrapper.text()).toContain('Mulai Pencarian')
  })

  it('submits search and displays results', async () => {
    const wrapper = createWrapper()
    await router.isReady()

    const input = wrapper.find<HTMLInputElement>('[data-testid="search-page-input"]')
    expect(input.exists()).toBe(true)

    await input.setValue('dago')
    await wrapper.find('form').trigger('submit.prevent')

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Perumahan Dago Resort')
      expect(wrapper.text()).toContain('Data Pembanding')
      expect(wrapper.text()).toContain('Rp 1.5 M')
    })
  })

  it('navigates to target route when clicking a search result card', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    await router.push('/search?q=dago')

    const wrapper = createWrapper()
    await router.isReady()

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Perumahan Dago Resort')
    })

    const card = wrapper.find('.search-page__result-card')
    expect(card.exists()).toBe(true)
    await card.trigger('click')

    expect(pushSpy).toHaveBeenCalledWith({
      name: 'pembanding.detail',
      params: { id: '88' },
    })
  })
})
