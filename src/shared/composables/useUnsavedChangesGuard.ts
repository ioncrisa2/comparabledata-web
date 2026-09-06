import { onMounted, onUnmounted, ref } from 'vue'
import { onBeforeRouteLeave, type RouteLocationNormalized } from 'vue-router'

export interface UnsavedChangesGuardOptions {
  isDirty: () => boolean
  enabled?: () => boolean
}

export function useUnsavedChangesGuard(options: UnsavedChangesGuardOptions) {
  const showPrompt = ref(false)
  const resolveNavigation = ref<((value: boolean) => void) | null>(null)
  const pendingToRoute = ref<RouteLocationNormalized | null>(null)

  function shouldPrevent(): boolean {
    if (options.enabled && !options.enabled()) return false
    return options.isDirty()
  }

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (shouldPrevent()) {
      event.preventDefault()
      event.returnValue = ''
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })

  onBeforeRouteLeave((to) => {
    if (!shouldPrevent()) {
      return true
    }

    pendingToRoute.value = to
    showPrompt.value = true

    return new Promise<boolean>((resolve) => {
      resolveNavigation.value = resolve
    })
  })

  function confirmLeave() {
    showPrompt.value = false
    const resolve = resolveNavigation.value
    resolveNavigation.value = null
    pendingToRoute.value = null
    if (resolve) {
      resolve(true)
    }
  }

  function cancelLeave() {
    showPrompt.value = false
    const resolve = resolveNavigation.value
    resolveNavigation.value = null
    pendingToRoute.value = null
    if (resolve) {
      resolve(false)
    }
  }

  return {
    showPrompt,
    confirmLeave,
    cancelLeave,
    pendingToRoute,
  }
}
