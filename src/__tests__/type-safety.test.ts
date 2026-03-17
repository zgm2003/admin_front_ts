import { UsersListApi } from '@/api/user/users'
import { useTable } from '@/hooks/useTable'
import { useMenuStore } from '@/store/menu'
import type { UserListItem } from '@/types/user'

async function assertUsersListResponseShape() {
  const result = await UsersListApi.list({
    page_size: 10,
    current_page: 1,
  })

  const users: UserListItem[] = result.list
  const total: number = result.page.total

  void users
  void total

  // @ts-expect-error 用户列表响应已被 request 拦截器解包，不存在 data 包裹层
  result.data.users
  // @ts-expect-error 响应字段为 list，不存在 users
  result.users
}

async function assertUsersListEditRequiresFields() {
  // @ts-expect-error edit 必须提供 username、role_id、sex、address
  await UsersListApi.edit({
    id: 1,
    role_id: 2,
  })
}

function assertUseTableRequiresIdentifiableRows() {
  const table = useTable<UserListItem>({
    api: UsersListApi,
  })

  void table.confirmDel

  // @ts-expect-error 行数据必须至少包含 id
  table.onSelectionChange([{ username: 'missing-id' }])
}

function assertMenuSelectionRequiresPath() {
  const menuStore = useMenuStore()

  // @ts-expect-error 菜单标签至少需要 index 和 path
  menuStore.selectMenu({
    index: '1',
    label: 'Test',
  })
}

export {
  assertUsersListResponseShape,
  assertUsersListEditRequiresFields,
  assertUseTableRequiresIdentifiableRows,
  assertMenuSelectionRequiresPath,
}
