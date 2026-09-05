import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

import openapiTS, { astToString } from 'openapi-typescript'

import { loadOpenApiDocument, resolveOpenApiSource } from './openapi-source.mjs'

const projectRoot = process.cwd()
const configuredSource = process.env.OPENAPI_SPEC || resolve(projectRoot, 'api.json')
const source = resolveOpenApiSource(configuredSource, projectRoot)
const outputPath = resolve(projectRoot, 'src/shared/api/generated/schema.d.ts')
const document = await loadOpenApiDocument(source)

const nodes = await openapiTS(document)
const generated = `${astToString(nodes).trim()}\n`

await writeFile(outputPath, generated, 'utf8')
process.stdout.write(`Generated API types from ${source.href}\n`)
