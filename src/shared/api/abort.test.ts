import { afterEach, describe, expect, it, vi } from 'vitest'

import { createRequestSignal, withRequestSignal } from './abort'

describe('request cancellation', () => {
  afterEach(() => vi.useRealTimers())

  it('combines an external abort signal with a timeout', () => {
    vi.useFakeTimers()
    const external = new AbortController()
    const request = createRequestSignal(external.signal, 500)

    external.abort('route-changed')
    expect(request.signal.aborted).toBe(true)
    expect(request.signal.reason).toBe('route-changed')
    request.dispose()
  })

  it('disposes the timeout after a request resolves', async () => {
    vi.useFakeTimers()
    let capturedSignal: AbortSignal | undefined

    await expect(
      withRequestSignal((signal) => {
        capturedSignal = signal
        return Promise.resolve('ok')
      }),
    ).resolves.toBe('ok')

    await vi.runAllTimersAsync()
    expect(capturedSignal?.aborted).toBe(false)
  })
})
