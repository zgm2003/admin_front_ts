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

/** 通知类型（对应后端 NotificationEnum::TYPE_*） */
export const NotificationTypeEnum = {
  INFO: 1,
  SUCCESS: 2,
  WARNING: 3,
  ERROR: 4,
} as const

/** 通知级别（对应后端 NotificationEnum::LEVEL_*） */
export const NotificationLevelEnum = {
  NORMAL: 1,
  URGENT: 2,
} as const

/** 通知类型 → el-tag type 映射 */
export const NotificationTypeColorMap: Record<number, 'info' | 'success' | 'warning' | 'danger'> = {
  [NotificationTypeEnum.INFO]: 'info',
  [NotificationTypeEnum.SUCCESS]: 'success',
  [NotificationTypeEnum.WARNING]: 'warning',
  [NotificationTypeEnum.ERROR]: 'danger',
}
