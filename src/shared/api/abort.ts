export type RequestSignal = {
  signal: AbortSignal
  dispose: () => void
}

export function createRequestSignal(
  externalSignal?: AbortSignal,
  timeoutMilliseconds = 15_000,
): RequestSignal {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort('timeout'), timeoutMilliseconds)

  const abortFromExternal = () => controller.abort(externalSignal?.reason)
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  if (externalSignal?.aborted) abortFromExternal()

  return {
    signal: controller.signal,
    dispose() {
      window.clearTimeout(timeoutId)
      externalSignal?.removeEventListener('abort', abortFromExternal)
    },
  }
}

export async function withRequestSignal<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: { signal?: AbortSignal; timeoutMilliseconds?: number } = {},
): Promise<T> {
  const requestSignal = createRequestSignal(options.signal, options.timeoutMilliseconds)

  try {
    return await operation(requestSignal.signal)
  } finally {
    requestSignal.dispose()
  }
}
