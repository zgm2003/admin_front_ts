import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  PaymentRedeemCodeApi,
  type PaymentRedeemCodeExportPayload,
  type PaymentRedeemCodeGenerateBatchPayload,
  type PaymentRedeemCodeGenerateBatchResponse,
  type PaymentRedeemCodeListParams,
  type PaymentRedeemCodePageInitResponse,
} from '@/api/payment/redeem-codes'
import { useTable, type PaginationParams } from '@/components/Table'
import type { SearchFormModel } from '@/components/Search/types'
import { downloadTextFile } from '@/lib/browser/download'
import { isApiError } from '@/modules/http/error'
import type { components } from '@/modules/http/generated/admin'
import { useUserStore } from '@/store/user'

export type RedeemCodeItem = components['schemas']['Go_internal_module_payment_redeemcode_CodeItem_Output']
type RedeemCodeTableParams = PaymentRedeemCodeListParams & PaginationParams

export interface RedeemCodeGenerateForm {
  amount: string
  quantity: number
  expires_at: string
  note: string
}

export interface RedeemCodeSearchForm extends SearchFormModel {
  batch_no: string
  state: string
  used_user: string
  used_by_text: string
  note: string
  dateRange: string[]
}

export function useRedeemCodePage() {
  const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()
  const pageLoading = ref(false)
  const generating = ref(false)
  const exporting = ref(false)
  const lookupLoading = ref(false)
  const voiding = ref(false)
  const states = shallowRef<PaymentRedeemCodePageInitResponse['states']>([])
  const searchForm = ref<RedeemCodeSearchForm>({
    batch_no: '',
    state: '',
    used_user: '',
    used_by_text: '',
    note: '',
    dateRange: [],
  })
  const listParams = computed<PaymentRedeemCodeListParams>(() => {
    const [createdFromInput, createdToInput] = searchForm.value.dateRange
    const batchNo = searchForm.value.batch_no.trim()
    const note = searchForm.value.note.trim()
    const usedUser = searchForm.value.used_user.trim()
    const usedBy = positiveInteger(searchForm.value.used_by_text)
    const createdFrom = localDateBoundary(createdFromInput, false)
    const createdTo = localDateBoundary(createdToInput, true)
    return {
      ...(batchNo ? { batch_no: batchNo } : {}),
      ...(searchForm.value.state ? { state: searchForm.value.state } : {}),
      ...(usedUser ? { used_user: usedUser } : {}),
      ...(usedBy ? { used_by: usedBy } : {}),
      ...(note ? { note } : {}),
      ...(createdFrom ? { created_from: createdFrom } : {}),
      ...(createdTo ? { created_to: createdTo } : {}),
    }
  })
  const table = useTable<RedeemCodeItem, RedeemCodeTableParams>({
    api: PaymentRedeemCodeApi,
    searchForm: listParams,
  })
  const lookupInput = ref('')
  const lookupResult = shallowRef<RedeemCodeItem | null>(null)
  const lookupActive = ref(false)
  let generationKey = ''
  let generationRequestId = ''
  const hasPendingGeneration = ref(false)
  const canGenerate = computed(() => userStore.can('payment_redeem_code_generate'))
  const canVoid = computed(() => userStore.can('payment_redeem_code_void'))
  const displayedData = computed(() => lookupActive.value
    ? (lookupResult.value ? [lookupResult.value] : [])
    : table.data.value)

  async function init() {
    pageLoading.value = true
    try {
      const result = await PaymentRedeemCodeApi.pageInit()
      states.value = result.states
      await table.getList()
    } finally {
      pageLoading.value = false
    }
  }

  async function generateBatch(
    form: RedeemCodeGenerateForm,
  ): Promise<PaymentRedeemCodeGenerateBatchResponse | undefined> {
    if (generating.value) return undefined
    const payload = normalizeGeneratePayload(form)
    const key = JSON.stringify(payload)
    if (generationKey !== key || generationRequestId === '') {
      generationKey = key
      generationRequestId = crypto.randomUUID()
      hasPendingGeneration.value = false
    }

    let result: PaymentRedeemCodeGenerateBatchResponse
    generating.value = true
    try {
      result = await PaymentRedeemCodeApi.generateBatch({
        ...payload,
        request_id: generationRequestId,
      })
    } catch (error) {
      if (isApiError(error) && error.code === 'payment.redeem_code.request_conflict') {
        generationRequestId = crypto.randomUUID()
        hasPendingGeneration.value = false
        ElNotification.warning({ message: t('paymentRedeemCode.messages.requestConflict') })
        return undefined
      }
      hasPendingGeneration.value = true
      throw error
    } finally {
      generating.value = false
    }

    generationKey = ''
    generationRequestId = ''
    hasPendingGeneration.value = false
    ElNotification.success({ message: t('paymentRedeemCode.messages.generated') })
    void table.getList().catch(() => undefined)
    return result
  }

  async function abandonPendingGeneration() {
    if (generating.value || !hasPendingGeneration.value) return
    await ElMessageBox.confirm(
      t('paymentRedeemCode.messages.abandonConfirm'),
      t('common.confirmTitle'),
      { type: 'warning' },
    )
    generationKey = ''
    generationRequestId = ''
    hasPendingGeneration.value = false
  }

  async function lookup() {
    const code = lookupInput.value.trim()
    if (!code) {
      ElMessage.warning(t('paymentRedeemCode.messages.codeRequired'))
      return
    }
    lookupLoading.value = true
    try {
      const result = await PaymentRedeemCodeApi.lookup({ code })
      lookupResult.value = result.item
      lookupActive.value = true
    } finally {
      lookupLoading.value = false
    }
  }

  function clearLookup() {
    lookupInput.value = ''
    lookupResult.value = null
    lookupActive.value = false
  }

  function onSearch() {
    clearLookup()
    table.resetPage()
    void table.getList()
  }

  async function exportCodes() {
    const payload: PaymentRedeemCodeExportPayload = { ...listParams.value }
    await performExport(payload)
  }

  async function exportBatch(batchNo: string) {
    const normalized = batchNo.trim()
    if (!normalized) return
    await performExport({ batch_no: normalized })
  }

  async function performExport(payload: PaymentRedeemCodeExportPayload) {
    exporting.value = true
    try {
      const result = await PaymentRedeemCodeApi.export(payload)
      downloadTextFile(result.content, result.filename, 'text/csv;charset=utf-8')
      ElNotification.success({
        message: t('paymentRedeemCode.messages.exported', { count: result.row_count }),
      })
    } catch (error) {
      if (isExportLimitError(error)) {
        ElMessage.warning(t('paymentRedeemCode.messages.exportLimit'))
        return
      }
      throw error
    } finally {
      exporting.value = false
    }
  }

  function canVoidRow(row: Pick<RedeemCodeItem, 'state'>) {
    return row.state === 'unused' || row.state === 'expired'
  }

  async function voidRows(rows: Array<Pick<RedeemCodeItem, 'id' | 'state'>>) {
    if (!canVoid.value) return
    const ids = [...new Set(rows.filter(canVoidRow).map(({ id }) => id))]
    if (ids.length === 0) {
      ElMessage.warning(t('paymentRedeemCode.messages.selectVoidable'))
      return
    }
    await ElMessageBox.confirm(
      t('paymentRedeemCode.messages.voidConfirm', { count: ids.length }),
      t('common.confirmTitle'),
      { type: 'warning' },
    )
    voiding.value = true
    try {
      const result = await PaymentRedeemCodeApi.void({ ids })
      ElNotification.success({
        message: t('paymentRedeemCode.messages.voided', { count: result.voided }),
      })
      table.clearSelection()
      clearLookup()
      await table.getList()
    } finally {
      voiding.value = false
    }
  }

  function voidSelected() {
    const selected = new Set(table.selectedIds.value)
    return voidRows(table.data.value.filter(({ id }) => selected.has(id)))
  }

  function goToLedger(row: Pick<RedeemCodeItem, 'state' | 'wallet_transaction_no'>) {
    if (row.state !== 'used' || !row.wallet_transaction_no) return
    void router.push({
      path: '/payment/ledger',
      query: { keyword: row.wallet_transaction_no },
    })
  }

  onMounted(() => {
    void init()
  })
  onBeforeUnmount(() => {
    clearLookup()
    generationKey = ''
    generationRequestId = ''
    hasPendingGeneration.value = false
    table.dispose()
  })

  return {
    ...table,
    pageLoading,
    generating,
    exporting,
    lookupLoading,
    voiding,
    states,
    stateOptions: computed(() => states.value),
    searchForm,
    listParams,
    lookupInput,
    lookupResult,
    lookupActive,
    displayedData,
    canGenerate,
    canVoid,
    hasPendingGeneration,
    init,
    generateBatch,
    abandonPendingGeneration,
    lookup,
    clearLookup,
    onSearch,
    exportCodes,
    exportBatch,
    canVoidRow,
    voidRows,
    voidSelected,
    goToLedger,
  }
}

function normalizeGeneratePayload(
  form: RedeemCodeGenerateForm,
): Omit<PaymentRedeemCodeGenerateBatchPayload, 'request_id'> {
  const expiresAt = form.expires_at.trim()
  const note = form.note.trim()
  return {
    amount: normalizeAmount(form.amount),
    quantity: form.quantity,
    ...(expiresAt ? { expires_at: expiresAt } : {}),
    ...(note ? { note } : {}),
  }
}

function positiveInteger(value: string): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function normalizeAmount(value: string): string {
  const trimmed = value.trim()
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed)
  if (!match) return trimmed
  const integer = (match[1] ?? '0').replace(/^0+(?=\d)/, '')
  const fraction = (match[2] ?? '').padEnd(2, '0')
  return `${integer}.${fraction}`
}

function localDateBoundary(value: string | undefined, exclusiveEnd: boolean): string | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  if (!match) return undefined
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined
  }
  if (exclusiveEnd) date.setDate(date.getDate() + 1)
  return date.toISOString()
}

function isExportLimitError(error: unknown) {
  if (!isApiError(error)) return false
  return error.code === 'payment.redeem_code.export_too_large'
    || error.code === 'payment.redeem_code.export_limit_exceeded'
}
