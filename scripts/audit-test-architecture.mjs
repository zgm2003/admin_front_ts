import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const TEST_FILE_PATTERN = /\.(?:test|spec)\.(?:[cm]?[jt]sx?)$/u
const FS_MODULES = new Set(['fs', 'fs/promises', 'node:fs', 'node:fs/promises'])
const SOURCE_READ_FUNCTIONS = new Set([
  'createReadStream',
  'read',
  'readFile',
  'readFileSync',
  'readSync',
])
const VALID_ACTIONS = new Set(['delete', 'replace', 'retain-guard'])

function normalizePath(path) {
  return path.split(sep).join('/')
}

function assertRepositoryPath(path, label) {
  if (typeof path !== 'string' || !path || isAbsolute(path)) {
    throw new Error(`${label} must be a non-empty repository-relative path`)
  }
  const normalized = normalizePath(path)
  if (normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`${label} must stay inside the repository`)
  }
  return normalized
}

async function exists(path) {
  try {
    await stat(path)
    return true
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') return false
    throw error
  }
}

async function listTestFiles(root, current = join(root, 'tests')) {
  if (!(await exists(current))) return []
  const entries = await readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(current, entry.name)
    if (entry.isDirectory()) files.push(...await listTestFiles(root, path))
    else if (entry.isFile() && TEST_FILE_PATTERN.test(entry.name)) {
      files.push(normalizePath(relative(root, path)))
    }
  }
  return files.sort()
}

function moduleText(node) {
  return ts.isStringLiteralLike(node) ? node.text : null
}

function isProductionImport(specifier, testPath, root) {
  if (specifier.startsWith('@/')) return true
  if (!specifier.startsWith('.')) return false
  const resolved = resolve(root, dirname(testPath), specifier)
  const sourceRoot = resolve(root, 'src')
  return resolved === sourceRoot || resolved.startsWith(`${sourceRoot}${sep}`)
}

function inspectSuite(source, testPath, root) {
  const sourceFile = ts.createSourceFile(
    testPath,
    source,
    ts.ScriptTarget.Latest,
    true,
    extname(testPath).endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const directReadNames = new Set()
  const namespaceReadNames = new Set()
  let importsProduction = false
  let importsFs = false
  let readsSourceText = false

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const specifier = moduleText(statement.moduleSpecifier)
    if (!specifier) continue
    if (isProductionImport(specifier, testPath, root)) importsProduction = true
    if (!FS_MODULES.has(specifier)) continue
    importsFs = true
    const clause = statement.importClause
    if (!clause) continue
    if (clause.name) namespaceReadNames.add(clause.name.text)
    const bindings = clause.namedBindings
    if (bindings && ts.isNamespaceImport(bindings)) namespaceReadNames.add(bindings.name.text)
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        const imported = element.propertyName?.text ?? element.name.text
        if (SOURCE_READ_FUNCTIONS.has(imported)) directReadNames.add(element.name.text)
      }
    }
  }

  function visit(node) {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && directReadNames.has(node.expression.text)) {
        readsSourceText = true
      }
      if (
        ts.isPropertyAccessExpression(node.expression)
        && ts.isIdentifier(node.expression.expression)
        && namespaceReadNames.has(node.expression.expression.text)
        && SOURCE_READ_FUNCTIONS.has(node.expression.name.text)
      ) {
        readsSourceText = true
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)

  return { importsFs, importsProduction, readsSourceText }
}

async function loadManifest(root) {
  const path = join(root, 'scripts', 'test-migration-manifest.json')
  let parsed
  try {
    parsed = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    throw new Error('scripts/test-migration-manifest.json is missing or invalid JSON', { cause: error })
  }
  if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.entries)) {
    throw new Error('test migration manifest must use schemaVersion 1 and an entries array')
  }

  const sources = new Set()
  const replacements = new Map()
  return parsed.entries.map((raw, index) => {
    if (!raw || typeof raw !== 'object') throw new Error(`manifest entry ${index} must be an object`)
    const source = assertRepositoryPath(raw.source, `manifest entry ${index} source`)
    if (sources.has(source)) throw new Error(`duplicate manifest source: ${source}`)
    sources.add(source)
    if (!VALID_ACTIONS.has(raw.action)) {
      throw new Error(`manifest entry ${source} has an invalid action`)
    }
    const replacement = raw.replacement === undefined
      ? undefined
      : assertRepositoryPath(raw.replacement, `manifest entry ${source} replacement`)
    if (raw.action === 'replace' && !replacement) {
      throw new Error(`manifest replacement is missing for ${source}`)
    }
    if (raw.action !== 'replace' && replacement) {
      throw new Error(`manifest replacement is only allowed for replace: ${source}`)
    }
    if (replacement) {
      const previous = replacements.get(replacement)
      if (previous) throw new Error(`replacement collision: ${replacement} is used by ${previous} and ${source}`)
      replacements.set(replacement, source)
    }
    return { source, action: raw.action, replacement }
  })
}

export async function auditTestArchitecture(repositoryRoot = process.cwd(), options = {}) {
  const root = resolve(repositoryRoot)
  const [testFiles, entries] = await Promise.all([listTestFiles(root), loadManifest(root)])
  const classifications = new Map()
  for (const path of testFiles) {
    const source = await readFile(join(root, path), 'utf8')
    classifications.set(path, inspectSuite(source, path, root))
  }

  const manifestBySource = new Map(entries.map((entry) => [entry.source, entry]))
  const sourceTextSuites = testFiles.filter((path) => classifications.get(path).readsSourceText)
  const unmanifested = sourceTextSuites.filter((path) => !manifestBySource.has(path))
  if (unmanifested.length > 0) {
    throw new Error(`source reader absent from the manifest: ${unmanifested.join(', ')}`)
  }

  for (const entry of entries) {
    const sourceExists = await exists(join(root, entry.source))
    const sourceClassification = classifications.get(entry.source)
    if (entry.action === 'delete') {
      if (sourceExists) throw new Error(`deleted source-text suite still exists: ${entry.source}`)
      continue
    }
    if (entry.action === 'retain-guard') {
      if (!sourceExists) throw new Error(`retained guard is missing: ${entry.source}`)
      if (!sourceClassification?.readsSourceText) {
        throw new Error(`retained guard no longer reads source text: ${entry.source}`)
      }
      continue
    }

    const replacementExists = await exists(join(root, entry.replacement))
    if (!replacementExists) throw new Error(`replacement test is missing: ${entry.replacement}`)
    if (sourceClassification?.readsSourceText) {
      throw new Error(`replacement source still reads source text: ${entry.source}`)
    }
    const replacementClassification = classifications.get(entry.replacement)
    if (replacementClassification?.readsSourceText) {
      throw new Error(`replacement still reads source text: ${entry.replacement}`)
    }
  }

  const directBehaviorSuites = testFiles.filter((path) => {
    const classification = classifications.get(path)
    return classification.importsProduction && !classification.readsSourceText
  })
  const sourceTextRatio = testFiles.length === 0 ? 0 : sourceTextSuites.length / testFiles.length
  if (!options.allowRatioFailure && sourceTextRatio >= 0.2) {
    throw new Error(
      `source-text suites must stay below 20%: ${sourceTextSuites.length}/${testFiles.length} (${(sourceTextRatio * 100).toFixed(2)}%)`,
    )
  }

  const migrationFiles = [...new Set(entries.flatMap((entry) => [
    entry.source,
    ...(entry.replacement ? [entry.replacement] : []),
  ]))].sort()
  return {
    totalSuites: testFiles.length,
    directBehaviorSuites,
    sourceTextSuites,
    sourceTextRatio,
    migrationFiles,
  }
}

async function main() {
  const migrationOnly = process.argv.includes('--migration-files')
  const result = await auditTestArchitecture()
  if (migrationOnly) {
    process.stdout.write(`${result.migrationFiles.join('\n')}\n`)
    return
  }
  process.stdout.write([
    `test suites: ${result.totalSuites}`,
    `direct production behavior: ${result.directBehaviorSuites.length}`,
    `source-text suites: ${result.sourceTextSuites.length}`,
    `source-text ratio: ${(result.sourceTextRatio * 100).toFixed(2)}%`,
    '',
  ].join('\n'))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
