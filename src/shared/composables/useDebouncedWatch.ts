import { watch, type WatchSource } from 'vue'

export function useDebouncedWatch<T>(
  source: WatchSource<T>,
  callback: (value: T, previousValue: T | undefined, signal: AbortSignal) => void | Promise<void>,
  delay = 300,
) {
  return watch(source, (value, previousValue, onCleanup) => {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => {
      void callback(value, previousValue, controller.signal)
    }, delay)

    onCleanup(() => {
      window.clearTimeout(timeoutId)
      controller.abort('superseded')
    })
  })
}
