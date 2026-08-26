import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

import openapiTS, { astToString } from 'openapi-typescript'

const projectRoot = process.cwd()
const source = process.env.OPENAPI_SPEC || resolve(projectRoot, 'api.json')
const outputPath = resolve(projectRoot, 'src/shared/api/generated/schema.d.ts')

const nodes = await openapiTS(source)
const generated = `${astToString(nodes)}\n`

await writeFile(outputPath, generated, 'utf8')
process.stdout.write(`Generated API types from ${source}\n`)
