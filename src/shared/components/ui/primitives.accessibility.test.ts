import { mount } from '@vue/test-utils'
import axe from 'axe-core'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import UiButton from './UiButton.vue'
import UiField from './UiField.vue'
import UiIconButton from './UiIconButton.vue'
import UiInlineAlert from './UiInlineAlert.vue'
import UiPagination from './UiPagination.vue'
import UiStatusBadge from './UiStatusBadge.vue'

const PrimitiveFixture = defineComponent({
  components: { UiButton, UiField, UiIconButton, UiInlineAlert, UiPagination, UiStatusBadge },
  template: `
    <main>
      <h1>Primitive fixture</h1>
      <UiButton variant="primary">Simpan</UiButton>
      <UiIconButton label="Hapus baris" icon="pi pi-trash" />
      <UiField label="Nama aset" help="Gunakan nama resmi" error="Nama wajib diisi" required>
        <template #default="{ inputId, describedBy, invalid }">
          <input :id="inputId" :aria-describedby="describedBy" :aria-invalid="invalid" />
        </template>
      </UiField>
      <UiInlineAlert title="Gagal menyimpan" tone="error">Periksa input.</UiInlineAlert>
      <UiStatusBadge tone="success" icon="pi pi-check-circle">Aktif</UiStatusBadge>
      <UiPagination :page="1" :per-page="10" :total="28" />
    </main>
  `,
})

describe('UI primitives accessibility', () => {
  it('has no detectable axe violations in primary states', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [] })
    const wrapper = mount(PrimitiveFixture, {
      attachTo: document.body,
      global: { plugins: [router] },
    })
    const results = await axe.run(wrapper.element as HTMLElement)

    expect(results.violations).toEqual([])
    wrapper.unmount()
  })

  it('connects field help and errors to its control', () => {
    const wrapper = mount(PrimitiveFixture)
    const input = wrapper.get('input')
    const ids = input.attributes('aria-describedby')?.split(' ') ?? []

    expect(ids).toHaveLength(2)
    ids.forEach((id) => expect(wrapper.find(`#${id}`).exists()).toBe(true))
    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('prevents repeated clicks while loading', async () => {
    const wrapper = mount(UiButton, { props: { loading: true }, slots: { default: 'Simpan' } })
    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeUndefined()
    expect(wrapper.attributes('aria-busy')).toBe('true')
  })
})
