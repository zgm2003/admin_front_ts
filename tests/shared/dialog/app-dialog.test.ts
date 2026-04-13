import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

const isMobile = ref(false)

vi.mock('@/hooks/useResponsive', () => ({
  useIsMobile: () => isMobile,
}))

function readAppDialogSource() {
  return readFileSync(
    resolve('e:/admin/admin_front_ts/src/components/AppDialog/src/index.vue'),
    'utf8',
  )
}

describe('AppDialog helpers', () => {
  it('normalizes width and height values into css lengths', async () => {
    const {
      resolveAppDialogAlignCenter,
      resolveAppDialogBodyPadding,
      resolveAppDialogContentHeight,
      resolveAppDialogWidth,
    } = await import('../../../src/components/AppDialog/src/dialog')

    expect(resolveAppDialogWidth({ isMobile: false })).toBe('720px')
    expect(resolveAppDialogWidth({ isMobile: true })).toBe('94vw')
    expect(resolveAppDialogWidth({ isMobile: false, width: 860 })).toBe('860px')
    expect(resolveAppDialogWidth({ isMobile: true, mobileWidth: '88vw' })).toBe('88vw')
    expect(resolveAppDialogContentHeight(420)).toBe('420px')
    expect(resolveAppDialogContentHeight('60vh')).toBe('60vh')
    expect(resolveAppDialogBodyPadding({ isMobile: false })).toBe('20px')
    expect(resolveAppDialogBodyPadding({ isMobile: true })).toBe('12px 16px')
    expect(resolveAppDialogBodyPadding({ isMobile: true, bodyPadding: '16px 20px' })).toBe('16px 20px')
    expect(resolveAppDialogAlignCenter({ isMobile: false, alignCenter: true })).toBe(true)
    expect(resolveAppDialogAlignCenter({ isMobile: true, alignCenter: true })).toBe(false)
  })

  it('keeps desktop dialogs draggable by default and disables drag on mobile', async () => {
    const { resolveAppDialogDraggable } = await import('../../../src/components/AppDialog/src/dialog')

    expect(resolveAppDialogDraggable({ isMobile: false })).toBe(true)
    expect(resolveAppDialogDraggable({ isMobile: true })).toBe(false)
    expect(resolveAppDialogDraggable({ isMobile: true, draggable: true })).toBe(true)
  })

  it('filters fullscreen out of forwarded attrs', async () => {
    const { filterAppDialogAttrs } = await import('../../../src/components/AppDialog/src/dialog')

    expect(filterAppDialogAttrs({
      fullscreen: true,
      class: 'demo-dialog',
      'data-test': 'dialog',
    })).toEqual({
      class: 'demo-dialog',
      'data-test': 'dialog',
    })
  })
})

describe('AppDialog component contract', () => {
  it('binds the resolved width and draggable state to the underlying element-plus dialog', () => {
    const source = readAppDialogSource()

    expect(source).toContain(':width="resolvedWidth"')
    expect(source).toContain(':draggable="resolvedDraggable"')
    expect(source).toContain(':title="title"')
    expect(source).toContain(':align-center="resolvedAlignCenter"')
    expect(source).toContain('class="app-dialog"')
  })

  it('strips fullscreen from forwarded attrs instead of exposing it as a supported prop', () => {
    const source = readAppDialogSource()

    expect(source).toContain('filterAppDialogAttrs')
    expect(source).not.toContain(':fullscreen=')
  })

  it('wraps content in an element-plus scrollbar only when height is provided', () => {
    const source = readAppDialogSource()

    expect(source).toContain('v-if="resolvedContentHeight"')
    expect(source).toContain('<el-scrollbar :height="resolvedContentHeight"')
  })

  it('keeps the footer slot outside the scrollable body branch', () => {
    const source = readAppDialogSource()

    expect(source.indexOf('<el-scrollbar :height="resolvedContentHeight"')).toBeLessThan(
      source.indexOf('<template v-if="$slots.footer" #footer>'),
    )
  })

  it('forces mobile dialogs to open without leftover centering transforms', () => {
    const source = readAppDialogSource()

    expect(source).toContain('transform: none !important;')
    expect(source).toContain('left: 0 !important;')
    expect(source).toContain('right: 0 !important;')
  })
})

describe('AppDialog source contract', () => {
  it('keeps element-plus scrollbar usage in the component source', () => {
    const source = readAppDialogSource()

    expect(source).toContain('<el-scrollbar')
    expect(source).toContain('resolvedContentHeight')
  })
})
