/**
 * 前端枚举 - 对应后端 CommonEnum / PayEnum / PermissionEnum / AiEnum
 */

// CommonEnum - 是/否、启用/禁用
export const CommonEnum = {
  YES: 1,
  NO: 2,
} as const

// PayEnum - 支付相关枚举（从 PayEnum.ts 重新导出）
export { PayChannel, PayStatus, BizStatus, RefundStatus, TxnStatus, RefundRecordStatus, FulfillStatus, WalletType, OrderType, ReconcileStatus, formatFen } from './PayEnum'

// PermissionEnum
export const PermissionTypeEnum = {
  DIR: 1,
  PAGE: 2,
  BUTTON: 3,
} as const

// PlatformEnum - 平台（字符串标识）
export const PlatformEnum = {
  ADMIN: 'admin',
  APP: 'app',
} as const

// AiEnum - AI 消息角色
export const AiRoleEnum = {
  USER: 1,
  ASSISTANT: 2,
  SYSTEM: 3,
} as const

// NotificationEnum - 通知类型
export const NotificationTypeEnum = {
  INFO: 1,
  SUCCESS: 2,
  WARNING: 3,
  ERROR: 4,
} as const

export const NotificationLevelEnum = {
  NORMAL: 1,
  URGENT: 2,
} as const

export const NotificationTypeColorMap: Record<number, 'info' | 'success' | 'warning' | 'danger'> = {
  [NotificationTypeEnum.INFO]: 'info',
  [NotificationTypeEnum.SUCCESS]: 'success',
  [NotificationTypeEnum.WARNING]: 'warning',
  [NotificationTypeEnum.ERROR]: 'danger',
}
