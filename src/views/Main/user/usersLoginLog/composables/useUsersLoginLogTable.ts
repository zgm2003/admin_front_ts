import type { Ref } from 'vue'
import { useTable } from '@/components/Table'
import { UsersLoginLogApi } from '@/api/user/usersLoginLog'
import type { SearchFormModel } from '@/components/Search/types'
import type { UserLoginLogItem, UserLoginType } from '@/types/user'

export interface UsersLoginLogSearchForm extends SearchFormModel {
  user_id: number | ''
  login_account: string
  login_type: UserLoginType | ''
  ip: string
  platform: string
  is_success: number | ''
  date: string[]
}

export function useUsersLoginLogTable(searchForm: Ref<UsersLoginLogSearchForm>) {
  const table = useTable<UserLoginLogItem>({
    api: UsersLoginLogApi,
    searchForm,
  })

  const onSearch = () => {
    table.resetPage()
    void table.getList()
  }

  return {
    ...table,
    onSearch,
  }
}
