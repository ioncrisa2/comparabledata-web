import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import openapiTS, { astToString } from 'openapi-typescript'
import { loadOpenApiDocument, resolveOpenApiSource } from './openapi-source.mjs'

const source = resolveOpenApiSource(process.env.OPENAPI_SPEC || resolve('api.json'), process.cwd())
const document = await loadOpenApiDocument(source)
const paths = Object.fromEntries(
  Object.entries(document.paths).filter(([path]) => path.startsWith('/v1/integrations')),
)
if (!Object.keys(paths).length) throw new Error('Kontrak API belum memuat endpoint integrasi.')
const schemas = {}
function includeRefs(value) {
  if (!value || typeof value !== 'object') return
  if (typeof value.$ref === 'string' && value.$ref.startsWith('#/components/schemas/')) {
    const name = value.$ref.split('/').at(-1)
    if (!(name in schemas)) {
      schemas[name] = document.components.schemas[name]
      includeRefs(schemas[name])
    }
  }
  for (const child of Object.values(value)) includeRefs(child)
}
includeRefs(paths)
const scoped = { ...document, paths, components: { ...document.components, schemas } }
const nodes = await openapiTS(scoped)
await writeFile(
  resolve('src/shared/api/generated/integrations.d.ts'),
  `${astToString(nodes).trim()}\n`,
)
process.stdout.write('Generated integration API types.\n')
