import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function readUserListSource() {
  return readFrontendSource('src/views/Main/user/userManager/components/UserList/index.vue')
}

describe('user list page contract', () => {
  it('guards export and batch edit actions with dedicated permissions', () => {
    const source = readUserListSource()

    expect(source).toMatch(/v-if="userStore\.can\('user_userManager_batchEdit'\)"[\s\S]*@click="batchEdit"/)
    expect(source).toMatch(/v-if="userStore\.can\('user_userManager_export'\)"[\s\S]*type="success"[\s\S]*@click="exportExcel"/)
  })

  it('uses Go REST user export API and keeps export permission separate', () => {
    const apiSource = readFrontendSource('src/api/user/users.ts')
    const typeSource = readFrontendSource('src/types/user.ts')

    expect(apiSource).toContain('request.post<UserExportResponse, { ids: number[] }>(`${ADMIN_API_PREFIX}/users/export`, params)')
    expect(apiSource).not.toContain('/api/admin/UsersList/export')
    expect(apiSource).not.toContain('user_userManager_edit')
    expect(typeSource).toContain('id: number')
    expect(typeSource).toContain('message: string')
  })

  it('uses the dedicated Go REST status route for user enable and disable', () => {
    const apiSource = readFrontendSource('src/api/user/users.ts')
    const pageSource = readUserListSource()

    expect(apiSource).toContain('type UserStatusBody = { status: number }')
    expect(apiSource).toContain('changeStatus: (params: { id: Id; status: number }) => {')
    expect(apiSource).toContain('request.patch<void, UserStatusBody>(`${ADMIN_API_PREFIX}/users/${ids[0]}/status`, body)')
    expect(apiSource).not.toContain('batchEdit: (params: UserBatchEditParams & { status')

    expect(pageSource).toContain("import { CommonEnum } from '@/enums'")
    expect(pageSource).toContain('toggleStatus,')
    expect(pageSource).toContain("{ key: 'status', label: t('user.table.status'), width: 110 }")
    expect(pageSource).toContain('<template #cell-status="{ row }">')
    expect(pageSource).toContain("row.status === CommonEnum.YES ? 'success' : 'danger'")
    expect(pageSource).toContain("userStore.can('user_userManager_edit') && row.status === CommonEnum.NO")
    expect(pageSource).toContain('@click="toggleStatus(row, CommonEnum.YES)"')
    expect(pageSource).toContain("userStore.can('user_userManager_edit') && row.status === CommonEnum.YES")
    expect(pageSource).toContain('@click="toggleStatus(row, CommonEnum.NO)"')
  })
})
