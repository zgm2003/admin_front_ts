import { defineOperation } from './operations'
import { principalSchema, type PrincipalContract } from './schema'

export const getCurrentPrincipalOperation = defineOperation<void, PrincipalContract>({
  id: 'get_api_admin_v1_users_me',
  method: 'GET',
  path: '/api/admin/v1/users/me',
  auth: 'required',
  timeout: 'interactive',
  replay: 'safe',
  responseSchema: principalSchema,
  telemetryName: 'admin.users.me',
})
