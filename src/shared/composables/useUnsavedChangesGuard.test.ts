import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useUnsavedChangesGuard } from './useUnsavedChangesGuard'

describe('useUnsavedChangesGuard', () => {
  async function createTestHarness(initialDirty = false) {
    const isDirty = ref(initialDirty)
    let guardRef: ReturnType<typeof useUnsavedChangesGuard> | null = null

    const TestComponent = defineComponent({
      setup() {
        const guard = useUnsavedChangesGuard({
          isDirty: () => isDirty.value,
        })
        guardRef = guard
        return { guard }
      },
      template: '<div>Test Form</div>',
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: TestComponent },
        { path: '/other', component: { template: '<div>Other</div>' } },
      ],
    })

    const App = defineComponent({
      template: '<router-view />',
    })

    await router.push('/')
    await router.isReady()

    const wrapper = mount(App, {
      global: { plugins: [router] },
    })

    return { wrapper, router, isDirty, getGuard: () => guardRef! }
  }

  it('allows navigation without prompt when form is not dirty', async () => {
    const { wrapper, router, getGuard } = await createTestHarness(false)

    await router.push('/other')
    expect(router.currentRoute.value.path).toBe('/other')
    expect(getGuard().showPrompt.value).toBe(false)
    wrapper.unmount()
  })

  it('intercepts navigation and shows prompt when form is dirty', async () => {
    const { wrapper, router, getGuard } = await createTestHarness(true)

    // Push triggers onBeforeRouteLeave
    void router.push('/other')
    await vi.waitFor(() => {
      expect(getGuard().showPrompt.value).toBe(true)
      expect(router.currentRoute.value.path).toBe('/')
    })
    wrapper.unmount()
  })

  it('cancels navigation when cancelLeave is called', async () => {
    const { wrapper, router, getGuard } = await createTestHarness(true)

    void router.push('/other')
    await vi.waitFor(() => {
      expect(getGuard().showPrompt.value).toBe(true)
    })

    getGuard().cancelLeave()
    await vi.waitFor(() => {
      expect(getGuard().showPrompt.value).toBe(false)
      expect(router.currentRoute.value.path).toBe('/')
    })
    wrapper.unmount()
  })

  it('proceeds with navigation when confirmLeave is called', async () => {
    const { wrapper, router, getGuard } = await createTestHarness(true)

    void router.push('/other')
    await vi.waitFor(() => {
      expect(getGuard().showPrompt.value).toBe(true)
    })

    getGuard().confirmLeave()
    await vi.waitFor(() => {
      expect(getGuard().showPrompt.value).toBe(false)
      expect(router.currentRoute.value.path).toBe('/other')
    })
    wrapper.unmount()
  })

  it('attaches beforeunload listener and prevents default if dirty', async () => {
    const { wrapper, isDirty } = await createTestHarness(true)

    const event = new Event('beforeunload')
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

    window.dispatchEvent(event)
    expect(preventDefaultSpy).toHaveBeenCalled()

    // When not dirty
    isDirty.value = false
    const cleanEvent = new Event('beforeunload')
    const cleanSpy = vi.spyOn(cleanEvent, 'preventDefault')

    window.dispatchEvent(cleanEvent)
    expect(cleanSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
