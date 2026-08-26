import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useDebouncedWatch } from './useDebouncedWatch'

describe('useDebouncedWatch', () => {
  afterEach(() => vi.useRealTimers())

  it('runs only the latest callback and aborts superseded work', async () => {
    vi.useFakeTimers()
    const query = ref('')
    const calls: string[] = []
    let firstSignal: AbortSignal | undefined

    const stop = useDebouncedWatch(
      query,
      (value, _previous, signal) => {
        calls.push(value)
        firstSignal ??= signal
      },
      200,
    )

    query.value = 'ban'
    await nextTick()
    await vi.advanceTimersByTimeAsync(200)
    expect(calls).toEqual(['ban'])

    query.value = 'bandung'
    await nextTick()
    expect(firstSignal?.aborted).toBe(true)
    await vi.advanceTimersByTimeAsync(200)
    expect(calls).toEqual(['ban', 'bandung'])

    stop()
  })
})
