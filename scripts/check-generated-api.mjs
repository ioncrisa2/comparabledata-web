import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

import openapiTS, { astToString } from 'openapi-typescript'

import { loadOpenApiDocument, resolveOpenApiSource } from './openapi-source.mjs'

const projectRoot = process.cwd()
const configuredSource = process.env.OPENAPI_SPEC || resolve(projectRoot, 'api.json')
const source = resolveOpenApiSource(configuredSource, projectRoot)
const outputPath = resolve(projectRoot, 'src/shared/api/generated/schema.d.ts')

if (!process.env.OPENAPI_SPEC) {
  try {
    await access(source)
  } catch {
    process.stdout.write('OpenAPI stale check skipped: api.json artifact is not available yet.\n')
    process.exit(0)
  }
}

const document = await loadOpenApiDocument(source)

const nodes = await openapiTS(document)
const expected = `${astToString(nodes).trim()}\n`
const current = `${(await readFile(outputPath, 'utf8')).trim()}\n`

if (current !== expected) {
  process.stderr.write(
    'Generated API client is stale. Run `npm run api:generate` with the current OpenAPI artifact.\n',
  )
  process.exit(1)
}

process.stdout.write('Generated API client matches the OpenAPI artifact.\n')
