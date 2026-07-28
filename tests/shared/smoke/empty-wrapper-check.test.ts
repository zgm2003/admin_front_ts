import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  findDirectUseTableInViews,
  findSharedUIBoundaryViolations,
  isEmptyRouteWrapper,
  runQualityChecks,
} from '../../../scripts/quality-checks.mjs'

describe('isEmptyRouteWrapper', () => {
  it('detects a route file that only renders a sibling Page component', () => {
    expect(
      isEmptyRouteWrapper(`
<script setup lang="ts">
import ChannelPage from './ChannelPage.vue'
</script>

<template>
  <ChannelPage />
</template>
`),
    ).toBe(true)
  })
})

describe('findDirectUseTableInViews', () => {
  it('detects direct useTable usage inside route views', () => {
    const files = findDirectUseTableInViews('src', [
      {
        filePath: 'src/views/Main/system/cronTask/index.vue',
        code: `
<script setup lang="ts">
import { useTable } from '@/components/Table'

const table = useTable({
  api: CronTaskApi,
  searchForm,
})
</script>
`,
      },
      {
        filePath: 'src/views/Main/system/cronTask/ok.vue',
        code: `
<script setup lang="ts">
import { useCrudTable } from '@/hooks/useCrudTable'

const table = useCrudTable({
  api: { list: CronTaskApi.logs },
  searchForm,
})
</script>
`,
      },
    ])

    expect(files).toEqual(['views/Main/system/cronTask/index.vue'])
  })
})

describe('findSharedUIBoundaryViolations', () => {
  const projectRoot = process.cwd()
  const fixture = (relativePath: string, code: string) => ({
    filePath: path.join(projectRoot, relativePath),
    code,
  })

  it('reports shared UI boundary violations with stable rules and source locations', () => {
    const source = [
      '<template>',
      '  <el-dialog title="Legacy" />',
      '  <AppDialog',
      '    append-to-body',
      '    destroy-on-close',
      '    mobile-width="94vw"',
      '  />',
      '  <AppTable',
      '    row-key="id"',
      '    :table-props="layout"',
      '  />',
      '  <Search',
      '    :fields="filters"',
      '    :collapse-count="1"',
      '  />',
      '</template>',
      '',
      '<script setup lang="ts">',
      'const layout = computed(() => ({',
      "  height: '100%',",
      '}))',
      'const filters = [',
      "  { key: 'keyword', type: 'input', width: 150, clearable: true },",
      "  { key: 'created_at', type: 'date-range', width: 300 },",
      ']',
      "const columns = [{ key: 'name', overflowTooltip: true }]",
      '</script>',
      '',
      '<style scoped>',
      ':deep(.el-dialog__body) { padding: 0 }',
      '</style>',
      '',
    ].join('\n')
    const relativePath = 'src/views/Main/example/index.vue'
    const violations = findSharedUIBoundaryViolations(projectRoot, [
      fixture(relativePath, source),
      fixture(
        'src/views/Main/example/styles.scss',
        ':deep(.table-toolbar) { flex-wrap: wrap; }\n',
      ),
    ])

    expect(violations.map(({ rule, path: filePath, line }) => ({ rule, path: filePath, line }))).toEqual([
      { rule: 'views/no-native-el-dialog', path: relativePath, line: 2 },
      { rule: 'app-dialog/no-default-attr', path: relativePath, line: 4 },
      { rule: 'app-dialog/no-default-attr', path: relativePath, line: 5 },
      { rule: 'views/no-default-mobile-width', path: relativePath, line: 6 },
      { rule: 'app-table/no-default-row-key', path: relativePath, line: 9 },
      { rule: 'search/no-default-collapse-count', path: relativePath, line: 14 },
      { rule: 'app-table/no-default-height', path: relativePath, line: 20 },
      { rule: 'search/no-default-width', path: relativePath, line: 23 },
      { rule: 'search/no-default-clearable', path: relativePath, line: 23 },
      { rule: 'search/no-default-width', path: relativePath, line: 24 },
      { rule: 'app-table/no-explicit-auto-tooltip', path: relativePath, line: 26 },
      { rule: 'shared-ui/no-private-deep-selector', path: relativePath, line: 30 },
      {
        rule: 'shared-ui/no-private-deep-selector',
        path: 'src/views/Main/example/styles.scss',
        line: 1,
      },
    ])
  })

  it('allows public shared component contracts and specialized native tables', () => {
    const source = [
      '<template>',
      '  <AppDialog width="700px" />',
      '  <AppTable row-key="request_id" />',
      '  <Search :fields="filters" :collapse-count="2" />',
      '  <el-drawer destroy-on-close />',
      '</template>',
      '<script setup lang="ts">',
      'const filters = [',
      "  { key: 'keyword', type: 'input', width: 220, clearable: false },",
      "  { key: 'created_at', type: 'date-range', width: 260 },",
      "  { key: 'user_id', type: 'remote-select', width: isMobile ? 200 : 220 },",
      ']',
      "const columns = [{ key: 'payload', overflowTooltip: false }]",
      '</script>',
      '<style scoped>',
      '.toolbar-left { display: flex }',
      '</style>',
      '',
    ].join('\n')
    const violations = findSharedUIBoundaryViolations(projectRoot, [
      fixture('src/views/Main/ai/chat/index.vue', source),
      fixture(
        'src/views/Main/permission/permission/components/PermissionTreeTable.vue',
        '<template>\n  <el-table :data="rows" row-key="id" />\n</template>\n',
      ),
      fixture(
        'src/views/Main/permission/role/components/PermissionMatrix.vue',
        '<template>\n  <el-table :data="matrix" />\n</template>\n',
      ),
    ])

    expect(violations).toEqual([])
  })

  it('prints directly locatable shared UI violations from runQualityChecks', () => {
    const relativePath = 'src/views/Main/example/index.vue'
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(console, 'log').mockImplementation(() => undefined)

    expect(runQualityChecks(projectRoot, [
      fixture(relativePath, '<template>\n  <el-dialog />\n</template>\n'),
    ])).toBe(1)
    expect(consoleError.mock.calls.flat().join('\n')).toContain(
      ' - src/views/Main/example/index.vue:2 [views/no-native-el-dialog]',
    )
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})
