import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'
import ts from 'typescript'

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

const PRIVATE_SHARED_UI_CLASSES = [
  'el-dialog__header',
  'el-dialog__body',
  'el-dialog__footer',
  'el-dialog__headerbtn',
  'table-toolbar',
  'table-wrapper',
  'toolbar-left',
  'toolbar-right',
  'table-footer',
  'flex-table',
]

const PRIVATE_DEEP_SELECTOR_PATTERN = new RegExp(
  ':deep\\(\\s*\\.(?:' + PRIVATE_SHARED_UI_CLASSES.join('|') + ')(?=[\\s.:#\\[)>+~,]|$)',
  'g',
)

const SEARCH_FIELD_TYPES = new Set([
  'input',
  'select-v2',
  'cascader',
  'date-range',
  'date',
  'remote-select',
  'slot',
])

const RULE_MESSAGES = {
  'views/no-native-el-dialog': 'use AppDialog instead of a native el-dialog in views',
  'views/no-default-mobile-width': 'rely on AppDialog default mobile width instead of 94vw',
  'shared-ui/no-private-deep-selector': 'do not pierce AppDialog or AppTable private DOM classes',
  'app-dialog/no-default-attr': 'remove AppDialog attributes that repeat shared defaults',
  'app-table/no-default-row-key': 'remove AppTable row-key="id" because it is the shared default',
  'app-table/no-default-height': 'remove AppTable height="100%" because it is the shared default',
  'app-table/no-explicit-auto-tooltip': 'rely on AppTable automatic overflow tooltip behavior',
  'search/no-default-width': 'remove SearchField width that repeats the component default',
  'search/no-default-clearable': 'remove SearchField clearable:true because it is the default',
  'search/no-default-collapse-count': 'remove Search collapse-count="1" because it is the default',
}

function normalizeFilePath(projectRoot, filePath) {
  const root = path.resolve(projectRoot)
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(root, filePath)

  return {
    absolutePath,
    relativePath: path.relative(root, absolutePath).replaceAll('\\', '/'),
  }
}

function sourceLineAt(code, offset) {
  let line = 1
  for (let index = 0; index < offset; index += 1) {
    if (code.charCodeAt(index) === 10) {
      line += 1
    }
  }
  return line
}

function openingTags(template) {
  const tags = []
  let cursor = 0

  while (cursor < template.length) {
    const start = template.indexOf('<', cursor)
    if (start < 0) break

    const next = template[start + 1]
    if (!next || next === '/' || next === '!' || next === '?') {
      cursor = start + 1
      continue
    }

    const nameMatch = template.slice(start + 1).match(/^([A-Za-z][\w.-]*)/)
    if (!nameMatch) {
      cursor = start + 1
      continue
    }

    let end = start + 1 + nameMatch[1].length
    let quote = null
    for (; end < template.length; end += 1) {
      const character = template[end]
      if (quote) {
        if (character === quote && template[end - 1] !== '\\') {
          quote = null
        }
        continue
      }

      if (character === '"' || character === "'") {
        quote = character
        continue
      }

      if (character === '>') break
    }

    if (end >= template.length) break
    tags.push({
      name: nameMatch[1],
      start,
      source: template.slice(start, end + 1),
    })
    cursor = end + 1
  }

  return tags
}

function tagAttributes(tag) {
  const attributes = []
  const source = tag.source
  let cursor = source.indexOf(tag.name) + tag.name.length

  while (cursor < source.length) {
    while (/\s/.test(source[cursor] ?? '')) cursor += 1
    if (source[cursor] === '>' || source[cursor] === '/') break

    const start = cursor
    while (cursor < source.length && !/[\s=/>]/.test(source[cursor])) cursor += 1
    const name = source.slice(start, cursor)
    if (!name) {
      cursor += 1
      continue
    }

    while (/\s/.test(source[cursor] ?? '')) cursor += 1
    let value = null
    let valueStart = cursor
    if (source[cursor] === '=') {
      cursor += 1
      while (/\s/.test(source[cursor] ?? '')) cursor += 1
      const quote = source[cursor]
      if (quote === '"' || quote === "'") {
        cursor += 1
        valueStart = cursor
        const end = source.indexOf(quote, cursor)
        if (end < 0) break
        value = source.slice(cursor, end)
        cursor = end + 1
      } else {
        valueStart = cursor
        while (cursor < source.length && !/[\s>]/.test(source[cursor])) cursor += 1
        value = source.slice(valueStart, cursor)
      }
    }

    const binding = name.startsWith(':') || name.startsWith('v-bind:')
    const publicName = name.replace(/^:/, '').replace(/^v-bind:/, '')
    attributes.push({
      normalizedName: publicName.replaceAll('-', '').toLowerCase(),
      binding,
      value,
      start: tag.start + start,
      valueStart: tag.start + valueStart,
    })
  }

  return attributes
}

function normalizeTagName(name) {
  return name.replaceAll('-', '').toLowerCase()
}

function staticExpressionValue(node) {
  let current = node
  while (
    current
    && (
      ts.isAsExpression(current)
      || ts.isSatisfiesExpression(current)
      || ts.isParenthesizedExpression(current)
      || ts.isNonNullExpression(current)
      || ts.isTypeAssertionExpression(current)
    )
  ) {
    current = current.expression
  }

  if (!current) return undefined
  if (ts.isStringLiteralLike(current)) return current.text
  if (ts.isNumericLiteral(current)) return Number(current.text)
  if (current.kind === ts.SyntaxKind.TrueKeyword) return true
  if (current.kind === ts.SyntaxKind.FalseKeyword) return false
  return undefined
}

function propertyName(property) {
  if (!property.name) return undefined
  if (ts.isIdentifier(property.name) || ts.isStringLiteralLike(property.name)) {
    return property.name.text
  }
  return undefined
}

function propertyByName(object, name) {
  return object.properties.find((property) =>
    ts.isPropertyAssignment(property) && propertyName(property) === name,
  )
}

function isBoundContext(node, bindingNames, fallbackPattern) {
  let current = node.parent
  while (current) {
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) {
      return bindingNames.has(current.name.text) || fallbackPattern.test(current.name.text)
    }
    if (ts.isPropertyAssignment(current)) {
      const name = propertyName(current) ?? ''
      return bindingNames.has(name) || fallbackPattern.test(name)
    }
    current = current.parent
  }
  return false
}

function scanPrivateDeepSelectors(content, baseOffset, addViolation) {
  PRIVATE_DEEP_SELECTOR_PATTERN.lastIndex = 0
  let match
  while ((match = PRIVATE_DEEP_SELECTOR_PATTERN.exec(content)) !== null) {
    addViolation('shared-ui/no-private-deep-selector', baseOffset + match.index)
  }
}

function scanTemplate(template, baseOffset, addViolation) {
  const tablePropsBindings = new Set()
  const searchFieldsBindings = new Set()

  for (const tag of openingTags(template)) {
    const normalizedName = normalizeTagName(tag.name)
    const attributes = tagAttributes(tag)

    if (tag.name.toLowerCase() === 'el-dialog') {
      addViolation('views/no-native-el-dialog', baseOffset + tag.start)
    }

    if (normalizedName === 'appdialog') {
      for (const attribute of attributes) {
        if (!['appendtobody', 'destroyonclose'].includes(attribute.normalizedName)) continue
        const value = attribute.value?.trim()
        const repeatsDefault = attribute.value === null || value === '' || value === 'true'
        if (repeatsDefault) {
          addViolation('app-dialog/no-default-attr', baseOffset + attribute.start)
        }
      }
    }

    if (normalizedName === 'apptable') {
      for (const attribute of attributes) {
        if (
          attribute.normalizedName === 'tableprops'
          && attribute.binding
          && /^[$A-Z_a-z][$\w]*$/.test(attribute.value ?? '')
        ) {
          tablePropsBindings.add(attribute.value)
        }

        if (attribute.normalizedName === 'rowkey') {
          const value = attribute.value?.trim()
          const isDefault = (!attribute.binding && value === 'id')
            || (attribute.binding && /^(['"])id\1$/.test(value ?? ''))
          if (isDefault) {
            addViolation('app-table/no-default-row-key', baseOffset + attribute.start)
          }
        }

        if (
          attribute.normalizedName === 'tableprops'
          && /\bheight\s*:\s*(['"])100%\1/.test(attribute.value ?? '')
        ) {
          addViolation('app-table/no-default-height', baseOffset + attribute.start)
        }
      }
    }

    if (normalizedName === 'search') {
      for (const attribute of attributes) {
        if (
          attribute.normalizedName === 'fields'
          && attribute.binding
          && /^[$A-Z_a-z][$\w]*$/.test(attribute.value ?? '')
        ) {
          searchFieldsBindings.add(attribute.value)
        }

        if (attribute.normalizedName !== 'collapsecount') continue
        if (attribute.value?.trim() === '1') {
          addViolation('search/no-default-collapse-count', baseOffset + attribute.start)
        }
      }
    }
  }

  let mobileWidthOffset = template.indexOf('94vw')
  while (mobileWidthOffset >= 0) {
    addViolation('views/no-default-mobile-width', baseOffset + mobileWidthOffset)
    mobileWidthOffset = template.indexOf('94vw', mobileWidthOffset + 4)
  }

  return { tablePropsBindings, searchFieldsBindings }
}

function scanScript(script, fileName, baseOffset, addViolation, bindings = {}) {
  const tablePropsBindings = bindings.tablePropsBindings ?? new Set()
  const searchFieldsBindings = bindings.searchFieldsBindings ?? new Set()
  const sourceFile = ts.createSourceFile(
    fileName,
    script,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  const addNodeViolation = (rule, node) => {
    addViolation(rule, baseOffset + node.getStart(sourceFile))
  }

  const visit = (node) => {
    if (ts.isStringLiteralLike(node) && node.text === '94vw') {
      addNodeViolation('views/no-default-mobile-width', node)
    }

    if (ts.isObjectLiteralExpression(node)) {
      const tooltip = propertyByName(node, 'overflowTooltip')
      if (tooltip && staticExpressionValue(tooltip.initializer) === true) {
        addNodeViolation('app-table/no-explicit-auto-tooltip', tooltip)
      }

      const height = propertyByName(node, 'height')
      if (
        height
        && staticExpressionValue(height.initializer) === '100%'
        && isBoundContext(height, tablePropsBindings, /tableProps/i)
      ) {
        addNodeViolation('app-table/no-default-height', height)
      }

      if (isBoundContext(node, searchFieldsBindings, /searchFields/i)) {
        const typeProperty = propertyByName(node, 'type')
        const fieldType = typeProperty
          ? staticExpressionValue(typeProperty.initializer)
          : undefined
        if (typeof fieldType === 'string' && SEARCH_FIELD_TYPES.has(fieldType)) {
          const width = propertyByName(node, 'width')
          const widthValue = width ? staticExpressionValue(width.initializer) : undefined
          const key = propertyByName(node, 'key')
          const keyValue = key ? staticExpressionValue(key.initializer) : undefined
          const defaultWidth = fieldType === 'date-range'
            ? 300
            : ['input', 'select-v2', 'cascader', 'date'].includes(fieldType)
              ? 150
              : fieldType === 'slot' && typeof keyValue === 'string' && /date.?range/i.test(keyValue)
                ? 300
                : undefined

          if (width && defaultWidth !== undefined && widthValue === defaultWidth) {
            addNodeViolation('search/no-default-width', width)
          }

          const clearable = propertyByName(node, 'clearable')
          if (clearable && staticExpressionValue(clearable.initializer) === true) {
            addNodeViolation('search/no-default-clearable', clearable)
          }
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
}

function sharedUIFiles(projectRoot, filesOverride) {
  if (filesOverride) return filesOverride

  return collectFiles(
    path.join(projectRoot, 'src', 'views'),
    (filePath) => ['.vue', '.ts', '.tsx', '.css', '.scss'].includes(path.extname(filePath)),
  ).map((filePath) => ({
    filePath,
    code: readFileSync(filePath, 'utf8'),
  }))
}

export function findSharedUIBoundaryViolations(projectRoot = process.cwd(), filesOverride) {
  const violations = []
  let sequence = 0

  for (const file of sharedUIFiles(projectRoot, filesOverride)) {
    const { absolutePath, relativePath } = normalizeFilePath(projectRoot, file.filePath)
    const code = file.code ?? readFileSync(absolutePath, 'utf8')
    const extension = path.extname(absolutePath).toLowerCase()
    const addViolation = (rule, offset) => {
      sequence += 1
      violations.push({
        rule,
        path: relativePath,
        line: sourceLineAt(code, offset),
        message: RULE_MESSAGES[rule],
        offset,
        sequence,
      })
    }

    if (extension === '.vue') {
      const { descriptor } = parse(code, { filename: absolutePath })
      let bindings
      if (descriptor.template) {
        bindings = scanTemplate(
          descriptor.template.content,
          descriptor.template.loc.start.offset,
          addViolation,
        )
      }
      for (const script of [descriptor.script, descriptor.scriptSetup]) {
        if (script) {
          scanScript(script.content, absolutePath, script.loc.start.offset, addViolation, bindings)
        }
      }
      for (const style of descriptor.styles) {
        scanPrivateDeepSelectors(style.content, style.loc.start.offset, addViolation)
        let mobileWidthOffset = style.content.indexOf('94vw')
        while (mobileWidthOffset >= 0) {
          addViolation('views/no-default-mobile-width', style.loc.start.offset + mobileWidthOffset)
          mobileWidthOffset = style.content.indexOf('94vw', mobileWidthOffset + 4)
        }
      }
      continue
    }

    if (extension === '.ts' || extension === '.tsx') {
      scanScript(code, absolutePath, 0, addViolation)
      continue
    }

    if (extension === '.css' || extension === '.scss') {
      scanPrivateDeepSelectors(code, 0, addViolation)
    }
  }

  return violations
    .sort((left, right) =>
      left.path.localeCompare(right.path)
      || left.offset - right.offset
      || left.sequence - right.sequence,
    )
    .map(({ offset: _offset, sequence: _sequence, ...violation }) => violation)
}

export function runQualityChecks(projectRoot = process.cwd(), sharedUIFilesOverride) {
  const wrappers = findEmptyRouteWrappers(projectRoot)
  const invalidTableHookImports = findInvalidTableHookImports(projectRoot)
  const directUseTableInViews = findDirectUseTableInViews(projectRoot)
  const sharedUIBoundaryViolations = findSharedUIBoundaryViolations(projectRoot, sharedUIFilesOverride)

  if (
    wrappers.length === 0
    && invalidTableHookImports.length === 0
    && directUseTableInViews.length === 0
    && sharedUIBoundaryViolations.length === 0
  ) {
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

  if (sharedUIBoundaryViolations.length > 0) {
    console.error('[quality-checks] shared UI boundary violations detected:')
    sharedUIBoundaryViolations.forEach((violation) => {
      console.error(
        ' - ' + violation.path + ':' + violation.line
        + ' [' + violation.rule + '] ' + violation.message,
      )
    })
  }

  return 1
}

const currentFilePath = fileURLToPath(import.meta.url)

if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  process.exitCode = runQualityChecks()
}
