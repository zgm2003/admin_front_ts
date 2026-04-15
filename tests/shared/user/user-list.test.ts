import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readUserListSource() {
  return readFileSync(
    resolve('e:/admin/admin_front_ts/src/views/Main/user/userManager/components/UserList/index.vue'),
    'utf8',
  )
}

describe('user list page contract', () => {
  it('guards export and batch edit actions with dedicated permissions', () => {
    const source = readUserListSource()

    expect(source).toContain(`v-if="userStore.can('user_userManager_batchEdit')" @click="batchEdit"`)
    expect(source).toContain(`v-if="userStore.can('user_userManager_export')" type="success" @click="exportExcel"`)
  })
})
