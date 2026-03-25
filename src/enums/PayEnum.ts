/**
 * 支付枚举 - 对应后端 PayEnum
 */

/** 支付渠道 */
export const PayChannel = {
  WECHAT: 1,
  ALIPAY: 2,
} as const

/** 订单支付状态 */
export const PayStatus = {
  PENDING: 1,     // 待支付
  PAYING: 2,      // 支付中
  PAID: 3,        // 已支付
  CLOSED: 4,      // 已关闭
  EXCEPTION: 5,   // 支付异常
} as const

/** 订单业务状态 */
export const BizStatus = {
  INIT: 1,        // 初始化
  PENDING: 2,    // 待履约
  EXECUTING: 3,  // 履约中
  SUCCESS: 4,    // 履约成功
  FAILED: 5,     // 履约失败
  MANUAL: 6,     // 人工处理
} as const

/** 订单退款状态 */
export const RefundStatus = {
  NONE: 1,       // 无退款
  ING: 2,        // 退款中
  PARTIAL: 3,    // 部分退款
  FULL: 4,       // 全额退款
  EXCEPTION: 5,  // 退款异常
} as const

/** 支付流水状态 */
export const TxnStatus = {
  CREATED: 1,    // 已创建
  WAITING: 2,    // 等待支付
  SUCCESS: 3,    // 支付成功
  FAILED: 4,     // 支付失败
  CLOSED: 5,     // 已关闭
} as const

/** 退款记录状态 */
export const RefundRecordStatus = {
  CREATED: 1,    // 已创建
  ING: 2,        // 退款中
  SUCCESS: 3,    // 退款成功
  FAILED: 4,     // 退款失败
  CLOSED: 5,     // 已关闭
  MANUAL: 6,     // 人工处理
} as const

/** 履约状态 */
export const FulfillStatus = {
  PENDING: 1,    // 待执行
  RUNNING: 2,    // 执行中
  SUCCESS: 3,    // 执行成功
  FAILED: 4,     // 执行失败
  MANUAL: 5,     // 人工处理
} as const

/** 钱包流水类型 */
export const WalletType = {
  RECHARGE: 1,   // 充值入账
  CONSUME: 2,    // 消费扣款
  REFUND: 3,     // 退款完成
  ADJUST: 4,     // 系统调账
  FREEZE: 5,     // 冻结
  UNFREEZE: 6,    // 解冻
} as const

/** 订单类型 */
export const OrderType = {
  RECHARGE: 1,   // 充值
  CONSUME: 2,    // 消费
  GOODS: 3,      // 商品购买
} as const

/** 对账任务状态 */
export const ReconcileStatus = {
  PENDING: 1,      // 待执行
  DOWNLOADING: 2,  // 下载中
  COMPARING: 3,    // 对比中
  SUCCESS: 4,      // 成功
  DIFF: 5,         // 有差异
  FAILED: 6,       // 失败
} as const

/** 订单金额（分转元） */
export const formatFen = (fen: number): string => (fen / 100).toFixed(2)
