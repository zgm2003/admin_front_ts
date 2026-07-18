// Generated from Admin Contract Bundle manifest SHA-256: 60379e7aa488dfcf64da72ef093a6b49ec5414c4ac29a3ba1356939ee0514381
// Do not edit manually.

export const backendViewKeys = [
  "ai/agents",
  "ai/chat",
  "ai/knowledge",
  "ai/prompts",
  "ai/providers",
  "ai/runs",
  "ai/tools",
  "notification",
  "payment/config",
  "payment/ledger",
  "payment/recharge",
  "payment/wallets",
  "permission/authPlatform",
  "permission/permission",
  "permission/role",
  "personal",
  "profile/wallet",
  "system/clientVersion",
  "system/cronTask",
  "system/exportTask",
  "system/log",
  "system/mail",
  "system/notificationTask",
  "system/operationLog",
  "system/queueMonitor",
  "system/setting",
  "system/sms",
  "system/uploadConfig",
  "user/userManager",
  "user/usersLoginLog",
] as const

export type BackendViewKey = typeof backendViewKeys[number]

export const backendViewKeySet: ReadonlySet<BackendViewKey> = new Set(backendViewKeys)
