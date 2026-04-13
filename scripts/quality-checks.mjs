import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export function isEmptyRouteWrapper(code) {
  const importMatch = code.match(/import\s+([A-Z]\w*)\s+from\s+['"]\.\/\w+Page\.vue['"]/)
  if (!importMatch) {
    return false
  }

  const componentName = importMatch[1]
  const templateMatch = code.match(/<template>([\s\S]*?)<\/template>/)
  if (!templateMatch) {
    return false
  }

  const normalizedTemplate = templateMatch[1].replace(/\s+/g, ' ').trim()
  return normalizedTemplate === `<${componentName} />`
    || normalizedTemplate === `<${componentName}/>`
    || normalizedTemplate === `<${componentName}></${componentName}>`
}

function collectFiles(dirPath, predicate, files = []) {
  for (const entry of readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry)
    const stats = statSync(fullPath)

    if (stats.isDirectory()) {
      collectFiles(fullPath, predicate, files)
      continue
    }

    if (predicate(fullPath)) {
      files.push(fullPath)
    }
  }

  return files
}

export function findEmptyRouteWrappers(projectRoot = process.cwd()) {
  const viewsRoot = path.join(projectRoot, 'src', 'views')
  const files = collectFiles(viewsRoot, (filePath) => filePath.endsWith(`${path.sep}index.vue`))

  return files
    .filter((filePath) => isEmptyRouteWrapper(readFileSync(filePath, 'utf8')))
    .map((filePath) => path.relative(projectRoot, filePath).replaceAll('\\', '/'))
}

function findFilesContaining(projectRoot, predicate, matcher) {
  const files = collectFiles(projectRoot, predicate)

  return files
    .filter((filePath) => matcher(readFileSync(filePath, 'utf8'), filePath))
    .map((filePath) => path.relative(projectRoot, filePath).replaceAll('\\', '/'))
}

export function findInvalidTableHookImports(projectRoot = process.cwd()) {
  const srcRoot = path.join(projectRoot, 'src')
  const candidates = findFilesContaining(
    srcRoot,
    (filePath) => filePath.endsWith('.ts') || filePath.endsWith('.vue'),
    (code) =>
      /from\s+['"]@\/hooks\/useTable['"]/.test(code)
      || /import\s*\{\s*useTable\s*\}\s*from\s*['"]@\/hooks\/useCrudTable['"]/.test(code)
  )

  return candidates
}

export function findDirectUseTableInViews(projectRoot = process.cwd(), filesOverride) {
  const files = filesOverride ?? collectFiles(
    path.join(projectRoot, 'src', 'views'),
    (filePath) => filePath.endsWith('.ts') || filePath.endsWith('.vue'),
  ).map((filePath) => ({
    filePath,
    code: readFileSync(filePath, 'utf8'),
  }))

  return files
    .filter(({ code }) =>
      /from\s+['"]@\/components\/Table['"]/.test(code)
      && /\buseTable\s*\(/.test(code),
    )
    .map(({ filePath }) => path.relative(projectRoot, filePath).replaceAll('\\', '/'))
}

export function runQualityChecks(projectRoot = process.cwd()) {
  const wrappers = findEmptyRouteWrappers(projectRoot)
  const invalidTableHookImports = findInvalidTableHookImports(projectRoot)
  const directUseTableInViews = findDirectUseTableInViews(projectRoot)

  if (wrappers.length === 0 && invalidTableHookImports.length === 0 && directUseTableInViews.length === 0) {
    console.log('[quality-checks] ok')
    return 0
  }

  if (wrappers.length > 0) {
    console.error('[quality-checks] empty route wrappers detected:')
    wrappers.forEach((filePath) => {
      console.error(` - ${filePath}`)
    })
  }

  if (invalidTableHookImports.length > 0) {
    console.error('[quality-checks] invalid table hook imports detected:')
    invalidTableHookImports.forEach((filePath) => {
      console.error(` - ${filePath}`)
    })
  }

  if (directUseTableInViews.length > 0) {
    console.error('[quality-checks] direct useTable-in-view usages detected:')
    directUseTableInViews.forEach((filePath) => {
      console.error(` - ${filePath}`)
    })
  }

  return 1
}

const currentFilePath = fileURLToPath(import.meta.url)

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  process.exitCode = runQualityChecks()
}
