export function safeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//'))
    return undefined

  try {
    const base = new URL('https://frontend.invalid')
    const target = new URL(value, base)

    if (target.origin !== base.origin || target.pathname === '/login') return undefined
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return undefined
  }
}
