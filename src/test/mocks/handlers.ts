import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/v1/__test__/session-expired', () =>
    HttpResponse.json(
      {
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Session expired',
      },
      { status: 401 },
    ),
  ),
]
