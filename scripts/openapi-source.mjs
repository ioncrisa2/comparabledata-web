import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function resolveOpenApiSource(configuredSource, projectRoot) {
  if (
    configuredSource.startsWith('file:') ||
    configuredSource.startsWith('http://') ||
    configuredSource.startsWith('https://')
  ) {
    return new URL(configuredSource)
  }

  return pathToFileURL(resolve(projectRoot, configuredSource))
}

export async function loadOpenApiDocument(source) {
  const contents =
    source.protocol === 'http:' || source.protocol === 'https:'
      ? await readRemoteSource(source)
      : await readFile(source, 'utf8')
  const document = JSON.parse(contents)

  if (!document || typeof document !== 'object' || typeof document.openapi !== 'string') {
    throw new Error(`OpenAPI source ${source.href} does not contain a valid OpenAPI document.`)
  }

  return document
}

async function readRemoteSource(source) {
  const response = await fetch(source, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(30_000),
  })

  if (!response.ok) {
    throw new Error(`Unable to read OpenAPI source ${source.href}: HTTP ${response.status}.`)
  }

  return response.text()
}
