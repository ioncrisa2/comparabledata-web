import { afterAll, afterEach, beforeAll } from 'vitest'

import { mockServer } from './mocks/server'

beforeAll(() => mockServer.listen({ onUnhandledRequest: 'error' }))

afterEach(() => {
  mockServer.resetHandlers()
  document.body.innerHTML = ''
})

afterAll(() => mockServer.close())
