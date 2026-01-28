/**
 * 前端枚举 - 对应后端 CommonEnum / PermissionEnum / AiEnum
 */

/** 是/否、启用/禁用 */
export const CommonEnum = {
  YES: 1,
  NO: 2,
} as const

/** 权限类型 */
export const PermissionTypeEnum = {
  DIR: 1,
  PAGE: 2,
  BUTTON: 3,
} as const

/** 平台（字符串标识） */
export const PlatformEnum = {
  ADMIN: 'admin',
  APP: 'app',
} as const

/** AI 消息角色 */
export const AiRoleEnum = {
  USER: 1,
  ASSISTANT: 2,
  SYSTEM: 3,
} as const
