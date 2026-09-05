import process from 'node:process'

const defaultBaseUrl = 'https://pd-api.kjpp-hjar.co.id'
const baseUrl = (process.argv[2] || process.env.VITE_API_BASE_URL || defaultBaseUrl).replace(
  /\/$/,
  '',
)
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:5173'

const checks = [
  {
    name: 'Sanctum CSRF cookie',
    path: '/sanctum/csrf-cookie',
    acceptedStatuses: [204],
  },
  {
    name: 'Unauthenticated session',
    path: '/api/v1/auth/me',
    acceptedStatuses: [401],
  },
  {
    name: 'Province reference data',
    path: '/api/v1/locations/provinces?limit=1',
    acceptedStatuses: [200, 401, 403],
  },
]

let failed = false

for (const check of checks) {
  try {
    const response = await fetch(`${baseUrl}${check.path}`, {
      headers: {
        Accept: 'application/json',
        Origin: webOrigin,
        'X-Requested-With': 'XMLHttpRequest',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    })

    const allowOrigin = response.headers.get('access-control-allow-origin')
    const allowsCredentials = response.headers.get('access-control-allow-credentials') === 'true'
    const statusReady = check.acceptedStatuses.includes(response.status)
    const corsReady = allowOrigin === webOrigin && allowsCredentials
    const result = statusReady && corsReady ? 'PASS' : 'FAIL'

    process.stdout.write(
      `${result} ${check.name}: HTTP ${response.status}; CORS origin=${allowOrigin ?? 'missing'}; credentials=${allowsCredentials}\n`,
    )

    if (!statusReady || !corsReady) failed = true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`FAIL ${check.name}: ${message}\n`)
    failed = true
  }
}

if (failed) {
  process.stderr.write(`API is not ready for the web SPA at ${baseUrl}.\n`)
  process.exit(1)
}

process.stdout.write(`API is ready for initial web integration at ${baseUrl}.\n`)
