import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, ref } from 'vue'

import type { PembandingFormData } from '../types/form'
import { emptyFormData } from '../types/form'
import PembandingFormStep4 from './PembandingFormStep4.vue'

describe('PembandingFormStep4 - Phone Input', () => {
  it('automatically formats to +62 when user types 8', async () => {
    const Harness = defineComponent({
      components: { PembandingFormStep4 },
      setup() {
        const form = ref<PembandingFormData>(emptyFormData())
        return { form }
      },
      template: `
        <PembandingFormStep4
          v-model="form"
          :options="undefined"
          :errors="{}"
        />
      `,
    })

    const wrapper = mount(Harness)
    const phoneInput = wrapper.find<HTMLInputElement>('input[type="tel"]')
    expect(phoneInput.exists()).toBe(true)

    // User mengetik '8'
    await phoneInput.setValue('8')
    await phoneInput.trigger('input')

    // Tampilan input otomatis menjadi '+62 8'
    expect(phoneInput.element.value).toBe('+62 8')
    expect(wrapper.vm.form.nomer_telepon_pemberi_informasi).toBe('+62 8')

    // User melanjutkan mengetik '85838198537'
    await phoneInput.setValue('85838198537')
    await phoneInput.trigger('input')

    expect(phoneInput.element.value).toBe('+62 858 3819 8537')
    expect(wrapper.vm.form.nomer_telepon_pemberi_informasi).toBe('+62 858 3819 8537')
  })

  it('formats when user pastes or types with 08 prefix', async () => {
    const Harness = defineComponent({
      components: { PembandingFormStep4 },
      setup() {
        const form = ref<PembandingFormData>(emptyFormData())
        return { form }
      },
      template: `
        <PembandingFormStep4
          v-model="form"
          :options="undefined"
          :errors="{}"
        />
      `,
    })

    const wrapper = mount(Harness)
    const phoneInput = wrapper.find<HTMLInputElement>('input[type="tel"]')

    // User paste '085838198537'
    await phoneInput.setValue('085838198537')
    await phoneInput.trigger('input')

    expect(phoneInput.element.value).toBe('+62 858 3819 8537')
  })

  it('formats initial value from edit mode starting with 08 or 8', () => {
    const Harness = defineComponent({
      components: { PembandingFormStep4 },
      setup() {
        const form = ref<PembandingFormData>({
          ...emptyFormData(),
          nomer_telepon_pemberi_informasi: '081234567890',
        })
        return { form }
      },
      template: `
        <PembandingFormStep4
          v-model="form"
          :options="undefined"
          :errors="{}"
        />
      `,
    })

    const wrapper = mount(Harness)
    const phoneInput = wrapper.find<HTMLInputElement>('input[type="tel"]')
    expect(phoneInput.element.value).toBe('+62 812 3456 7890')
  })

  it('clears cleanly when user presses backspace on +62 8', async () => {
    const Harness = defineComponent({
      components: { PembandingFormStep4 },
      setup() {
        const form = ref<PembandingFormData>({
          ...emptyFormData(),
          nomer_telepon_pemberi_informasi: '+62 8',
        })
        return { form }
      },
      template: `
        <PembandingFormStep4
          v-model="form"
          :options="undefined"
          :errors="{}"
        />
      `,
    })

    const wrapper = mount(Harness)
    const phoneInput = wrapper.find<HTMLInputElement>('input[type="tel"]')

    // Simulasi kursor di akhir dan menekan Backspace
    phoneInput.element.setSelectionRange(5, 5)
    await phoneInput.trigger('keydown', { key: 'Backspace' })

    expect(phoneInput.element.value).toBe('')
    expect(wrapper.vm.form.nomer_telepon_pemberi_informasi).toBe('')
  })

  it('clears prefix on blur if no subscriber digits were entered', async () => {
    const Harness = defineComponent({
      components: { PembandingFormStep4 },
      setup() {
        const form = ref<PembandingFormData>({
          ...emptyFormData(),
          nomer_telepon_pemberi_informasi: '+62 ',
        })
        return { form }
      },
      template: `
        <PembandingFormStep4
          v-model="form"
          :options="undefined"
          :errors="{}"
        />
      `,
    })

    const wrapper = mount(Harness)
    const phoneInput = wrapper.find<HTMLInputElement>('input[type="tel"]')

    await phoneInput.trigger('blur')

    expect(wrapper.vm.form.nomer_telepon_pemberi_informasi).toBe('')
  })

  it('allows removing a selected image', async () => {
    const fakeFile = new File(['dummy content'], 'test.png', { type: 'image/png' })
    const Harness = defineComponent({
      components: { PembandingFormStep4 },
      setup() {
        const form = ref<PembandingFormData>({
          ...emptyFormData(),
          image: fakeFile,
        })
        return { form }
      },
      template: `
        <PembandingFormStep4
          v-model="form"
          :options="undefined"
          :errors="{}"
        />
      `,
    })

    const wrapper = mount(Harness)
    expect(wrapper.find('.form-step__preview').exists()).toBe(true)

    const removeBtn = wrapper.find('.form-step__remove-btn')
    expect(removeBtn.exists()).toBe(true)
    await removeBtn.trigger('click')

    expect(wrapper.vm.form.image).toBeNull()
  })
})
