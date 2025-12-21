import { ElMessageBox, ElNotification } from 'element-plus'

type StatusVal = number | string

interface CreateBeforeStatusChangeOptions<Row extends { id: any; status: StatusVal }> {
  t: (key: string) => string

  // 发请求的方法：比如 (payload) => UploadSettingApi.status(payload)
  request: (payload: { id: Row['id']; status: StatusVal; row?: Row }) => Promise<any>

  // 计算新状态：默认 1 <-> 2
  nextStatus?: (current: StatusVal, row: Row) => StatusVal

  // 成功后做什么：比如 getList
  onSuccess?: (row: Row, next: StatusVal) => void | Promise<void>

  // 文案 key（用你现有的 i18n）
  confirmMessageKey?: string
  confirmTitleKey?: string
  successMessageKey?: string

  // confirm 按钮文案 key
  confirmButtonKey?: string
  cancelButtonKey?: string
}

/**
 * 返回一个函数，可直接用于 el-switch 的 :before-change="..."
 */
export function createBeforeStatusChange<Row extends { id: any; status: StatusVal }>(
  options: CreateBeforeStatusChangeOptions<Row>
) {
  const {
    t,
    request,
    nextStatus = (cur: StatusVal) => (cur === 1 ? 2 : 1),
    onSuccess,
    confirmMessageKey = 'common.confirmStatusChange',
    confirmTitleKey = 'common.confirmTitle',
    successMessageKey = 'common.success.operation',
    confirmButtonKey = 'common.actions.confirm',
    cancelButtonKey = 'common.actions.cancel'
  } = options

  return async (row: Row): Promise<boolean> => {
    if (!row || row.id === undefined || row.id === null) return false

    try {
      await ElMessageBox.confirm(
        t(confirmMessageKey),
        t(confirmTitleKey),
        {
          type: 'warning',
          confirmButtonText: t(confirmButtonKey),
          cancelButtonText: t(cancelButtonKey)
        }
      )

      // 注意：before-change 阶段 row.status 是“旧值”
      const next = nextStatus(row.status, row)

      await request({ id: row.id, status: next, row })

      ElNotification.success({ message: t(successMessageKey) })

      await onSuccess?.(row, next)

      return true
    } catch {
      return false
    }
  }
}
