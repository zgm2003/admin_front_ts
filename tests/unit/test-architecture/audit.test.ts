import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { auditTestArchitecture } from '../../../scripts/audit-test-architecture.mjs'

async function fixture(files: Readonly<Record<string, string>>) {
  const root = await mkdtemp(join(tmpdir(), 'test-architecture-'))
  await Promise.all(Object.entries(files).map(async ([path, contents]) => {
    const destination = join(root, path)
    await mkdir(join(destination, '..'), { recursive: true })
    await writeFile(destination, contents, 'utf8')
  }))
  return root
}

function manifest(entries: readonly object[]) {
  return JSON.stringify({ schemaVersion: 1, entries }, null, 2)
}

describe('test architecture audit', () => {
  it('classifies direct production imports separately from source readers', async () => {
    const root = await fixture({
      'src/feature.ts': 'export const value = 1\n',
      'tests/direct.test.ts': "import { value } from '../src/feature'\nvoid value\n",
      'tests/guard.test.ts': "import { readFileSync } from 'node:fs'\nreadFileSync('src/feature.ts', 'utf8')\n",
      'scripts/test-migration-manifest.json': manifest([
        { source: 'tests/guard.test.ts', action: 'retain-guard' },
      ]),
    })

    const result = await auditTestArchitecture(root, { allowRatioFailure: true })

    expect(result.totalSuites).toBe(2)
    expect(result.directBehaviorSuites).toEqual(['tests/direct.test.ts'])
    expect(result.sourceTextSuites).toEqual(['tests/guard.test.ts'])
  })

  it('rejects unmanifested readers, duplicate entries, and replacement collisions', async () => {
    const root = await fixture({
      'tests/a.test.ts': "import fs from 'node:fs'\nfs.readFileSync('src/a.ts', 'utf8')\n",
      'tests/b.test.ts': "import { readFile } from 'node:fs/promises'\nreadFile('src/b.ts', 'utf8')\n",
      'tests/replacement.test.ts': "import '../src/a'\n",
      'scripts/test-migration-manifest.json': manifest([
        { source: 'tests/a.test.ts', action: 'replace', replacement: 'tests/replacement.test.ts' },
        { source: 'tests/a.test.ts', action: 'replace', replacement: 'tests/replacement.test.ts' },
      ]),
    })

    await expect(auditTestArchitecture(root)).rejects.toThrow(/duplicate manifest source/u)

    await writeFile(join(root, 'scripts/test-migration-manifest.json'), manifest([
      { source: 'tests/a.test.ts', action: 'replace', replacement: 'tests/replacement.test.ts' },
      { source: 'tests/b.test.ts', action: 'replace', replacement: 'tests/replacement.test.ts' },
    ]), 'utf8')
    await expect(auditTestArchitecture(root)).rejects.toThrow(/replacement collision/u)

    await writeFile(join(root, 'scripts/test-migration-manifest.json'), manifest([
      { source: 'tests/a.test.ts', action: 'retain-guard' },
    ]), 'utf8')
    await expect(auditTestArchitecture(root)).rejects.toThrow(/absent from the manifest/u)
  })

  it('requires completed replacements and enforces a source-text ratio below twenty percent', async () => {
    const directFiles = Object.fromEntries(
      Array.from({ length: 3 }, (_, index) => [
        `tests/direct-${index}.test.ts`,
        `import '../src/feature-${index}'\n`,
      ]),
    )
    const root = await fixture({
      ...directFiles,
      'tests/old.test.ts': "import { readFileSync } from 'node:fs'\nreadFileSync('src/old.ts', 'utf8')\n",
      'tests/new.test.ts': "import '../src/new'\n",
      'scripts/test-migration-manifest.json': manifest([
        { source: 'tests/old.test.ts', action: 'replace', replacement: 'tests/new.test.ts' },
      ]),
    })

    await expect(auditTestArchitecture(root)).rejects.toThrow(/still reads source text/u)

    await writeFile(join(root, 'tests/old.test.ts'), "import '../src/new'\n", 'utf8')
    const result = await auditTestArchitecture(root)
    expect(result.sourceTextRatio).toBe(0)

    await writeFile(join(root, 'tests/old.test.ts'), "import { readFileSync } from 'node:fs'\nreadFileSync('src/old.ts', 'utf8')\n", 'utf8')
    await writeFile(join(root, 'scripts/test-migration-manifest.json'), manifest([
      { source: 'tests/old.test.ts', action: 'retain-guard' },
    ]), 'utf8')
    await expect(auditTestArchitecture(root)).rejects.toThrow(/source-text suites must stay below 20%/u)
  })

  it('returns the exact changed paths requested by the migration manifest', async () => {
    const root = await fixture({
      'tests/deleted.test.ts.bak': '',
      'tests/replaced.test.ts': "import '../src/replacement'\n",
      'tests/guard.test.ts': "import { readFileSync } from 'node:fs'\nreadFileSync('src/guard.ts', 'utf8')\n",
      'scripts/test-migration-manifest.json': manifest([
        { source: 'tests/deleted.test.ts', action: 'delete' },
        { source: 'tests/old.test.ts', action: 'replace', replacement: 'tests/replaced.test.ts' },
        { source: 'tests/guard.test.ts', action: 'retain-guard' },
      ]),
    })

    const result = await auditTestArchitecture(root, { allowRatioFailure: true })
    expect(result.migrationFiles).toEqual([
      'tests/deleted.test.ts',
      'tests/guard.test.ts',
      'tests/old.test.ts',
      'tests/replaced.test.ts',
    ])
    expect(await readFile(join(root, 'tests/replaced.test.ts'), 'utf8')).toContain("../src/replacement")
  })
})
