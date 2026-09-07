import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import PrimeVue from 'primevue/config'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'

import { mockServer } from '@/test/mocks/server'

import { useGlobalSearchState } from '../composables/useGlobalSearch'
import GlobalSearchDialog from './GlobalSearchDialog.vue'

describe('GlobalSearchDialog', () => {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div>Dashboard</div>' } },
      {
        path: '/pembandings/:id',
        name: 'pembanding.detail',
        component: { template: '<div>Detail</div>' },
      },
    ],
  })

  beforeEach(() => {
    mockServer.use(
      http.get('*/api/v1/search', () =>
        HttpResponse.json({
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
            per_page: 25,
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
        }),
      ),
    )
  })

  function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return mount(GlobalSearchDialog, {
      global: {
        plugins: [PrimeVue, router, [VueQueryPlugin, { queryClient }]],
        stubs: {
          UiDialog: {
            props: ['open', 'title', 'description'],
            template: `
              <div v-if="open" class="ui-dialog-mock">
                <h2>{{ title }}</h2>
                <slot />
              </div>
            `,
          },
        },
      },
    })
  }

  it('renders search prompt and searches on input typing', async () => {
    const { isSearchOpen } = useGlobalSearchState()
    isSearchOpen.value = true

    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Pencarian Global')
    expect(wrapper.text()).toContain('Ketik kata kunci untuk mencari di seluruh sistem.')

    const input = wrapper.find<HTMLInputElement>('[data-testid="global-search-input"]')
    expect(input.exists()).toBe(true)

    await input.setValue('dago')
    // Wait for debounced search
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Perumahan Dago Resort')
      expect(wrapper.text()).toContain('Rp 1.5 M')
    })
  })

  it('navigates when clicking a search item', async () => {
    const pushSpy = vi.spyOn(router, 'push')
    const { isSearchOpen } = useGlobalSearchState()
    isSearchOpen.value = true

    const wrapper = createWrapper()
    const input = wrapper.find<HTMLInputElement>('[data-testid="global-search-input"]')
    await input.setValue('dago')

    await vi.waitFor(() => {
      expect(wrapper.find('.global-search__item').exists()).toBe(true)
    })

    await wrapper.find('.global-search__item').trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({
      name: 'pembanding.detail',
      params: { id: '88' },
    })
    expect(isSearchOpen.value).toBe(false)
  })
})
