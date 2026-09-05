import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount } from '@vue/test-utils'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import { mockServer } from '@/test/mocks/server'

import { emptyLocationSelection } from '../composables/useCascadingLocation'
import LocationFields from './LocationFields.vue'

describe('LocationFields', () => {
  it('loads child options after a parent is selected', async () => {
    mockServer.use(
      http.get('*/api/v1/locations/provinces', () =>
        HttpResponse.json({
          status: 'success',
          message: 'Data Provinsi',
          data: [{ id: '32', name: 'Jawa Barat', created_at: null, updated_at: null }],
        }),
      ),
      http.get('*/api/v1/locations/regencies', ({ request }) => {
        expect(new URL(request.url).searchParams.get('province_id')).toBe('32')
        return HttpResponse.json({
          status: 'success',
          message: 'Data Kabupaten/Kota',
          data: [
            {
              id: '3273',
              province_id: '32',
              name: 'Kota Bandung',
              created_at: null,
              updated_at: null,
            },
          ],
        })
      }),
    )

    const Harness = defineComponent({
      components: { LocationFields },
      setup: () => ({ selection: ref(emptyLocationSelection()) }),
      template: '<LocationFields v-model="selection" />',
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = mount(Harness, {
      global: { plugins: [[VueQueryPlugin, { queryClient }]] },
    })

    await vi.waitFor(() => {
      expect(wrapper.findAll('select')[0]?.findAll('option')).toHaveLength(2)
    })

    await wrapper.findAll('select')[0]?.setValue('32')
    await flushPromises()

    await vi.waitFor(() => {
      const regencySelect = wrapper.findAll('select')[1]
      expect(regencySelect?.attributes('disabled')).toBeUndefined()
      expect(regencySelect?.text()).toContain('Kota Bandung')
    })

    wrapper.unmount()
    queryClient.clear()
  })
})
