import { access, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import ts from 'typescript'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultLocaleRoot = resolve(projectRoot, 'src/i18n/locales')
const generatedPath = resolve(defaultLocaleRoot, 'generated.ts')
export const localeNames = ['en-US', 'zh-CN']
export const localeDomains = [
  'common',
  'auth',
  'layout',
  'user',
  'permission',
  'system',
  'payment',
  'ai',
]
const bootstrapDomains = ['common', 'auth', 'layout']
const featureDomains = localeDomains.filter((domain) => !bootstrapDomains.includes(domain))

async function resolveImportPath(containingFile, specifier) {
  const unresolved = resolve(dirname(containingFile), specifier)
  const candidates = extname(unresolved)
    ? [unresolved]
    : [`${unresolved}.ts`, resolve(unresolved, 'index.ts')]

  for (const candidate of candidates) {
    try {
      await access(candidate)
      return candidate
    } catch {
      // Continue to the next closed candidate.
    }
  }

  throw new Error(`locale import cannot be resolved: ${specifier} from ${containingFile}`)
}

function propertyName(node, sourceFile) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text
  }
  throw new Error(`locale key must be a literal at ${sourceFile.fileName}:${sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1}`)
}

async function parseLocaleFile(filePath, cache) {
  const cached = cache.get(filePath)
  if (cached) return cached

  const source = await readFile(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const imports = new Map()
  let root = null

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && statement.importClause?.name
      && ts.isStringLiteral(statement.moduleSpecifier)) {
      imports.set(
        statement.importClause.name.text,
        await resolveImportPath(filePath, statement.moduleSpecifier.text),
      )
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      root = statement.expression
    }
  }

  if (!root || !ts.isObjectLiteralExpression(root)) {
    throw new Error(`locale file must default-export an object literal: ${filePath}`)
  }

  const parsed = { sourceFile, imports, root }
  cache.set(filePath, parsed)
  return parsed
}

async function collectObjectKeys(parsed, objectNode, prefix, keys, cache) {
  for (const property of objectNode.properties) {
    if (ts.isSpreadAssignment(property)) {
      if (ts.isObjectLiteralExpression(property.expression)) {
        await collectObjectKeys(parsed, property.expression, prefix, keys, cache)
        continue
      }
      if (!ts.isIdentifier(property.expression)) {
        throw new Error(`locale spread must reference a default import: ${parsed.sourceFile.fileName}`)
      }
      const importPath = parsed.imports.get(property.expression.text)
      if (!importPath) {
        throw new Error(`locale spread is not a known import: ${property.expression.text}`)
      }
      const imported = await parseLocaleFile(importPath, cache)
      await collectObjectKeys(imported, imported.root, prefix, keys, cache)
      continue
    }

    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) {
      throw new Error(`locale object contains an unsupported member: ${parsed.sourceFile.fileName}`)
    }
    const name = propertyName(property.name, parsed.sourceFile)
    const path = prefix.length === 0 ? name : `${prefix}.${name}`
    const initializer = ts.isPropertyAssignment(property) ? property.initializer : null
    if (initializer && ts.isObjectLiteralExpression(initializer)) {
      await collectObjectKeys(parsed, initializer, path, keys, cache)
      continue
    }
    if (keys.has(path)) throw new Error(`duplicate locale key: ${path}`)
    keys.add(path)
  }
}

export async function collectLocaleKeys(localeRoot, locale, domains = localeDomains) {
  const keys = new Set()
  const cache = new Map()
  for (const domain of domains) {
    const filePath = resolve(localeRoot, locale, `${domain}.ts`)
    const parsed = await parseLocaleFile(filePath, cache)
    await collectObjectKeys(parsed, parsed.root, '', keys, cache)
  }
  return [...keys].sort()
}

export async function assertLocaleParity(localeRoot = defaultLocaleRoot, domains = localeDomains) {
  const [english, chinese] = await Promise.all([
    collectLocaleKeys(localeRoot, 'en-US', domains),
    collectLocaleKeys(localeRoot, 'zh-CN', domains),
  ])
  const englishSet = new Set(english)
  const chineseSet = new Set(chinese)
  const missingChinese = english.filter((key) => !chineseSet.has(key))
  const missingEnglish = chinese.filter((key) => !englishSet.has(key))
  if (missingChinese.length > 0 || missingEnglish.length > 0) {
    throw new Error([
      'Locale key parity violation.',
      `Missing in zh-CN: ${missingChinese.join(', ') || 'none'}`,
      `Missing in en-US: ${missingEnglish.join(', ') || 'none'}`,
    ].join('\n'))
  }
  return english
}

function literalArray(name, values) {
  const rows = []
  for (let index = 0; index < values.length; index += 6) {
    rows.push(`  ${values.slice(index, index + 6).map((value) => `'${value}',`).join(' ')}`)
  }
  return [
    `export const ${name} = [`,
    ...rows,
    '] as const',
    '',
  ].join('\n')
}

export function generateLocaleKeySource(keys) {
  return [
    '// Generated by scripts/generate-locale-types.mjs. Do not edit manually.',
    literalArray('adminLocales', localeNames),
    "export type AdminLocale = typeof adminLocales[number]",
    '',
    literalArray('bootstrapLocaleDomains', bootstrapDomains),
    "export type BootstrapLocaleDomain = typeof bootstrapLocaleDomains[number]",
    '',
    literalArray('featureLocaleDomains', featureDomains),
    "export type FeatureLocaleDomain = typeof featureLocaleDomains[number]",
    '',
    literalArray('localeKeys', keys),
    "export type LocaleKey = typeof localeKeys[number]",
    '',
  ].join('\n')
}

async function runCli() {
  const keys = await assertLocaleParity()
  const generated = generateLocaleKeySource(keys)
  if (process.argv.includes('--check')) {
    const existing = await readFile(generatedPath, 'utf8').catch(() => '')
    if (existing !== generated) {
      throw new Error('Generated locale key union is stale. Run node scripts/generate-locale-types.mjs')
    }
    console.log(`Locale parity verified: ${keys.length} keys`)
    return
  }
  await writeFile(generatedPath, generated, 'utf8')
  console.log(`Generated locale key union: ${keys.length} keys`)
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (executedPath === import.meta.url) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
