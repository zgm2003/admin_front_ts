import { describe, expect, it } from 'vitest'
import * as uploadRulePage from '@/views/Main/system/uploadConfig/components/UploadRule/use-upload-rule-page'

const options = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
] as const

describe('upload rule extension selection', () => {
  it('derives unchecked, indeterminate, and checked states from real options', () => {
    const getSelectionState = Reflect.get(uploadRulePage, 'getExtensionSelectionState')
    expect(getSelectionState).toBeTypeOf('function')

    expect(getSelectionState([], options)).toEqual({ checked: false, indeterminate: false })
    expect(getSelectionState(['png'], options)).toEqual({ checked: false, indeterminate: true })
    expect(getSelectionState(['png', 'jpeg'], options)).toEqual({ checked: true, indeterminate: false })
    expect(getSelectionState([], [])).toEqual({ checked: false, indeterminate: false })
  })

  it('selects every real option unless the group is already fully selected', () => {
    const toggleSelection = Reflect.get(uploadRulePage, 'toggleExtensionSelection')
    expect(toggleSelection).toBeTypeOf('function')

    expect(toggleSelection([], options)).toEqual(['png', 'jpeg'])
    expect(toggleSelection(['png'], options)).toEqual(['png', 'jpeg'])
    expect(toggleSelection(['png', 'jpeg'], options)).toEqual([])
  })
})
