import { UsersListApi, UserSessionApi } from '@/api/user/users'
import { UsersLoginLogApi } from '@/api/user/usersLoginLog'
import type {
  UserLoginLogItem,
  UserListItem,
  UserSessionItem,
} from '@/types/user'

async function assertAdminUserApiShapes() {
  const users = await UsersListApi.list({
    page_size: 20,
    current_page: 1,
  })
  const sessions = await UserSessionApi.list({
    page_size: 20,
    current_page: 1,
  })
  const loginLogs = await UsersLoginLogApi.list({
    page_size: 20,
    current_page: 1,
  })

  const userList: UserListItem[] = users.list
  const sessionList: UserSessionItem[] = sessions.list
  const loginLogList: UserLoginLogItem[] = loginLogs.list

  void userList
  void sessionList
  void loginLogList
}

export { assertAdminUserApiShapes }
