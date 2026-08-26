import { gzipSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const projectRoot = process.cwd()
const manifestPath = resolve(projectRoot, 'dist/.vite/manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
const entryBudget = 180 * 1024
const chunkBudget = 250 * 1024
const failures = []

for (const [source, item] of Object.entries(manifest)) {
  if (!item || typeof item !== 'object' || typeof item.file !== 'string') continue
  if (!item.file.endsWith('.js')) continue

  const contents = await readFile(resolve(projectRoot, 'dist', item.file))
  const gzipBytes = gzipSync(contents).byteLength
  const budget = item.isEntry ? entryBudget : chunkBudget

  if (gzipBytes > budget) {
    failures.push(`${source}: ${(gzipBytes / 1024).toFixed(1)} KB > ${budget / 1024} KB`)
  }
}

if (failures.length > 0) {
  process.stderr.write(`Bundle budget exceeded:\n${failures.join('\n')}\n`)
  process.exit(1)
}

process.stdout.write('Bundle budget passed (entry <= 180 KB gzip; lazy chunks <= 250 KB gzip).\n')
