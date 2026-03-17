import { UsersApi } from '@/api/user/users'
import type {
  LoginConfigResponse,
  UserInitResponse,
  UserLoginParams,
  UserLoginSession,
  UserPasswordUpdateParams,
  UserScene,
} from '@/types/user'

async function assertUsersApiContracts() {
  const loginConfig: LoginConfigResponse = await UsersApi.getLoginConfig()
  const initData: UserInitResponse = await UsersApi.init()

  const scene: UserScene = 'login'
  void scene
  void loginConfig
  void initData

  const loginParams: UserLoginParams = {
    login_account: 'admin@example.com',
    login_type: 'password',
    password: '123456',
  }

  const session: UserLoginSession = await UsersApi.login(loginParams)
  void session

  const passwordParams: UserPasswordUpdateParams = {
    verify_type: 'code',
    code: '123456',
    new_password: '123456',
    confirm_password: '123456',
  }

  await UsersApi.updatePassword(passwordParams)
}

async function assertInvalidUsersApiParamsFail() {
  // @ts-expect-error sendCode 参数应为 account + scene
  await UsersApi.sendCode({ email: 'a@example.com', type: 'login' })

  // @ts-expect-error forgetPassword 参数应为 account + new_password + confirm_password + code
  await UsersApi.forgetPassword({ account: 'a@example.com', password: '123456', code: '123456' })

  // @ts-expect-error updatePassword 必须包含 verify_type 与 confirm_password
  await UsersApi.updatePassword({
    old_password: '123456',
    new_password: '654321',
  })
}

export {
  assertUsersApiContracts,
  assertInvalidUsersApiParamsFail,
}
