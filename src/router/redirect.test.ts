import { describe, expect, it } from 'vitest'

import { safeRedirectPath } from './redirect'

describe('safeRedirectPath', () => {
  it('keeps internal paths with their query and hash', () => {
    expect(safeRedirectPath('/pembandings?page=2#results')).toBe('/pembandings?page=2#results')
  })

  it.each(['https://example.com', '//example.com', '/login', '', null])(
    'rejects an unsafe redirect value: %s',
    (value) => {
      expect(safeRedirectPath(value)).toBeUndefined()
    },
  )
})
