import { z } from 'zod'

const envSchema = z.object({
  VITE_APP_NAME: z.string().trim().min(1).default('HJAR Sysinfo'),
  VITE_API_BASE_URL: z.url().default('http://localhost:8000'),
  VITE_RELEASE: z.string().trim().min(1).default('local'),
})

export type AppEnv = z.infer<typeof envSchema>

export function parseEnv(source: Record<string, unknown>): AppEnv {
  const result = envSchema.safeParse(source)

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ')

    throw new Error(`Konfigurasi environment frontend tidak valid. ${details}`)
  }

  return {
    ...result.data,
    VITE_API_BASE_URL: result.data.VITE_API_BASE_URL.replace(/\/$/, ''),
  }
}

export const env = parseEnv(import.meta.env)
