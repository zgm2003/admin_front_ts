import { describe, expect, it } from 'vitest'
import { isEmptyRouteWrapper } from '../../../scripts/quality-checks.mjs'

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
