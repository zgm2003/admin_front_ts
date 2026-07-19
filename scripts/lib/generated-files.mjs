import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

export function assertSortedUniqueStrings(values, label) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !value)) {
    throw new Error(`${label} must be a non-empty string array`)
  }
  const sorted = [...values].sort()
  if (new Set(sorted).size !== sorted.length) {
    throw new Error(`${label} contains duplicate values`)
  }
  return sorted
}

export function generatedHeader(manifestSha) {
  return [
    `// Generated from Admin Contract Bundle manifest SHA-256: ${manifestSha}`,
    '// Do not edit manually.',
    '',
  ].join('\n')
}

export function literalArray(name, values) {
  return [
    `export const ${name} = [`,
    ...values.map((value) => `  ${JSON.stringify(value)},`),
    '] as const',
    '',
  ].join('\n')
}

export async function writeGenerated(frontendRoot, relativePath, contents) {
  const destination = resolve(frontendRoot, relativePath)
  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, contents.endsWith('\n') ? contents : `${contents}\n`, 'utf8')
}
