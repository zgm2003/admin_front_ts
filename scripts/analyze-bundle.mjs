import {
  constants as zlibConstants,
  brotliCompressSync,
  gzipSync,
} from 'node:zlib'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const defaultBuildDirectory = resolve(projectRoot, 'dist')
const defaultBudgetsPath = resolve(projectRoot, 'performance/budgets.json')
const defaultBaselinePath = resolve(projectRoot, 'performance/baseline.json')

function sortedUnique(values) {
  return [...new Set(values)].sort()
}

function byteMetrics(bytes) {
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes, { level: 9 }).byteLength,
    brotli: brotliCompressSync(bytes, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).byteLength,
  }
}

function sumMetrics(entries) {
  return entries.reduce((total, entry) => ({
    raw: total.raw + entry.raw,
    gzip: total.gzip + entry.gzip,
    brotli: total.brotli + entry.brotli,
  }), { raw: 0, gzip: 0, brotli: 0 })
}

function assertMetadata(input) {
  if (typeof input !== 'object' || input === null || input.schemaVersion !== 1
    || !Array.isArray(input.chunks)) {
    throw new Error('bundle-metadata.json does not match schema version 1')
  }

  for (const chunk of input.chunks) {
    if (typeof chunk !== 'object' || chunk === null || typeof chunk.file !== 'string'
      || typeof chunk.isEntry !== 'boolean' || typeof chunk.isDynamicEntry !== 'boolean'
      || !Array.isArray(chunk.imports) || !Array.isArray(chunk.dynamicImports)
      || !Array.isArray(chunk.css) || !Array.isArray(chunk.modules)) {
      throw new Error('bundle-metadata.json contains an invalid chunk')
    }
  }

  return input
}

function collectStaticFiles(chunksByFile) {
  const initial = new Set()
  const queue = [...chunksByFile.values()]
    .filter((chunk) => chunk.isEntry)
    .map((chunk) => chunk.file)

  if (queue.length === 0) throw new Error('bundle metadata has no entry chunk')

  while (queue.length > 0) {
    const file = queue.shift()
    if (initial.has(file)) continue
    const chunk = chunksByFile.get(file)
    if (!chunk) throw new Error(`bundle metadata references missing chunk: ${file}`)
    initial.add(file)
    queue.push(...chunk.imports)
  }

  return initial
}

async function metricsForFile(buildDirectory, file) {
  const bytes = await readFile(resolve(buildDirectory, file))
  return byteMetrics(bytes)
}

export async function analyzeBuildDirectory(buildDirectory = defaultBuildDirectory) {
  const metadata = assertMetadata(JSON.parse(await readFile(
    resolve(buildDirectory, 'bundle-metadata.json'),
    'utf8',
  )))
  const chunks = [...metadata.chunks].sort((left, right) => left.file.localeCompare(right.file))
  const chunksByFile = new Map(chunks.map((chunk) => [chunk.file, chunk]))
  const initialJsSet = collectStaticFiles(chunksByFile)
  const initialCssFiles = sortedUnique(chunks
    .filter((chunk) => initialJsSet.has(chunk.file))
    .flatMap((chunk) => chunk.css))
  const initialJsFiles = [...initialJsSet].sort()
  const lazyJsFiles = chunks
    .map((chunk) => chunk.file)
    .filter((file) => !initialJsSet.has(file) && file.endsWith('.js'))
    .sort()
  const allJsFiles = chunks
    .map((chunk) => chunk.file)
    .filter((file) => file.endsWith('.js'))
    .sort()
  const allMeasuredFiles = sortedUnique([...allJsFiles, ...initialCssFiles])
  const measuredEntries = await Promise.all(allMeasuredFiles.map(async (file) => [
    file,
    await metricsForFile(buildDirectory, file),
  ]))
  const measured = Object.fromEntries(measuredEntries)
  const initialJs = sumMetrics(initialJsFiles.map((file) => measured[file]))
  const initialCss = sumMetrics(initialCssFiles.map((file) => measured[file]))
  const totalJs = sumMetrics(allJsFiles.map((file) => measured[file]))
  const lazyEntries = lazyJsFiles.map((file) => ({ file, ...measured[file] }))
  const largestLazyJs = lazyEntries.sort((left, right) => right.gzip - left.gzip)[0]
    ?? { file: null, raw: 0, gzip: 0, brotli: 0 }
  const initialModules = sortedUnique(chunks
    .filter((chunk) => initialJsSet.has(chunk.file))
    .flatMap((chunk) => chunk.modules))

  return {
    schemaVersion: 1,
    initialFiles: [...initialCssFiles, ...initialJsFiles].sort(),
    lazyJsFiles,
    initialModules,
    summary: {
      initialJs,
      initialCss,
      largestLazyJs,
      totalJs,
    },
    chunks: Object.fromEntries(chunks.map((chunk) => [chunk.file, {
      initial: initialJsSet.has(chunk.file),
      isEntry: chunk.isEntry,
      isDynamicEntry: chunk.isDynamicEntry,
      imports: [...chunk.imports].sort(),
      dynamicImports: [...chunk.dynamicImports].sort(),
      css: [...chunk.css].sort(),
      modules: [...chunk.modules].sort(),
      size: measured[chunk.file],
    }])),
  }
}

function checkCompressedMetric(violations, label, actual, budget) {
  for (const encoding of ['gzip', 'brotli']) {
    if (actual[encoding] > budget[encoding]) {
      violations.push(`${label}.${encoding}: ${actual[encoding]} > ${budget[encoding]}`)
    }
  }
}

export function findBudgetViolations(report, budgets) {
  const violations = []
  checkCompressedMetric(violations, 'initialJs', report.summary.initialJs, budgets.initialJs)
  checkCompressedMetric(violations, 'initialCss', report.summary.initialCss, budgets.initialCss)
  checkCompressedMetric(
    violations,
    `largestLazyJs(${report.summary.largestLazyJs.file ?? 'none'})`,
    report.summary.largestLazyJs,
    budgets.largestLazyJs,
  )
  checkCompressedMetric(violations, 'totalJs', report.summary.totalJs, budgets.totalJs)

  for (const forbidden of budgets.forbiddenInitialModules) {
    const matches = report.initialModules.filter((moduleId) => moduleId.includes(forbidden))
    if (matches.length > 0) {
      violations.push(`forbidden initial module ${forbidden}: ${matches.join(', ')}`)
    }
  }

  return violations
}

async function packageVersion(packageName) {
  const source = await readFile(resolve(projectRoot, `node_modules/${packageName}/package.json`), 'utf8')
  return JSON.parse(source).version
}

function argumentValue(arguments_, name) {
  const index = arguments_.indexOf(name)
  return index === -1 ? undefined : arguments_[index + 1]
}

async function writeBaseline(report, commit) {
  if (typeof commit !== 'string' || !/^[0-9a-f]{7,40}$/.test(commit)) {
    throw new Error('--commit must be a 7-40 character lowercase Git revision')
  }
  const baseline = {
    ...report,
    source: {
      commit,
      node: process.version,
      vite: await packageVersion('vite'),
      profile: 'production',
    },
  }
  await writeFile(defaultBaselinePath, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
  console.log(`Bundle baseline written: ${relative(projectRoot, defaultBaselinePath)}`)
}

async function runCli() {
  const arguments_ = process.argv.slice(2)
  const buildDirectory = resolve(argumentValue(arguments_, '--dist') ?? defaultBuildDirectory)
  const report = await analyzeBuildDirectory(buildDirectory)

  if (arguments_.includes('--write-baseline')) {
    await writeBaseline(report, argumentValue(arguments_, '--commit') ?? process.env.FRONTEND_REVISION)
    return
  }

  if (arguments_.includes('--check')) {
    const budgets = JSON.parse(await readFile(defaultBudgetsPath, 'utf8'))
    const violations = findBudgetViolations(report, budgets)
    if (violations.length > 0) {
      throw new Error(`Bundle budget violations:\n- ${violations.join('\n- ')}`)
    }
    console.log(`Bundle budgets verified: ${allSummary(report)}`)
    return
  }

  console.log(JSON.stringify(report, null, 2))
}

function allSummary(report) {
  const { initialJs, initialCss, largestLazyJs, totalJs } = report.summary
  return [
    `initial JS ${initialJs.gzip} gzip/${initialJs.brotli} brotli`,
    `initial CSS ${initialCss.gzip} gzip/${initialCss.brotli} brotli`,
    `largest lazy ${largestLazyJs.gzip} gzip/${largestLazyJs.brotli} brotli`,
    `total JS ${totalJs.gzip} gzip/${totalJs.brotli} brotli`,
  ].join(', ')
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''
if (executedPath === import.meta.url) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
