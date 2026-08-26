import { describe, expect, it } from 'vitest'

import { parseEnv } from './env'

describe('parseEnv', () => {
  it('provides safe local defaults', () => {
    expect(parseEnv({})).toEqual({
      VITE_APP_NAME: 'HJAR Sysinfo',
      VITE_API_BASE_URL: 'http://localhost:8000',
      VITE_RELEASE: 'local',
    })
  })

  it('removes a trailing slash from the API base URL', () => {
    expect(
      parseEnv({
        VITE_API_BASE_URL: 'https://api.example.com/',
      }).VITE_API_BASE_URL,
    ).toBe('https://api.example.com')
  })

  it('rejects an explicitly empty API base URL', () => {
    expect(() => parseEnv({ VITE_API_BASE_URL: '' })).toThrow(
      'Konfigurasi environment frontend tidak valid',
    )
  })
})
