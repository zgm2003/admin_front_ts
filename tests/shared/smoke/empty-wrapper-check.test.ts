import { describe, expect, it } from 'vitest'
import { findDirectUseTableInViews, isEmptyRouteWrapper } from '../../../scripts/quality-checks.mjs'

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
