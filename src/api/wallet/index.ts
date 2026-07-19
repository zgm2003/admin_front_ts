import { executeAdminOperation } from '@/lib/http'
import type { ExecuteOptions } from '@/modules/http/client'
import type { components } from '@/modules/http/generated/admin'
import {
  adminOperations,
  type AdminOperationInput,
} from '@/modules/http/generated/operations'

export type WalletDirection = NonNullable<NonNullable<AdminOperationInput<'get_api_admin_v1_wallet_transactions'>['query']>['direction']>
export type WalletSourceType = NonNullable<NonNullable<AdminOperationInput<'get_api_admin_v1_wallet_transactions'>['query']>['source_type']>

export type WalletSummaryResponse = components['schemas']['Go_internal_module_payment_wallet_SummaryResponse_Output']

export type WalletTransactionItem = components['schemas']['Go_internal_module_payment_wallet_TransactionItem_Output']
export type WalletTransactionListResponse = components['schemas']['Go_internal_module_payment_wallet_TransactionListResponse_Output']

export interface WalletTransactionListParams {
  current_page: number
  page_size: number
  user_id?: number
  keyword?: string
  direction?: WalletDirection | ''
  source_type?: WalletSourceType | ''
  date_start?: string
  date_end?: string
}

export type WalletUserItem = components['schemas']['Go_internal_module_payment_wallet_WalletUserItem_Output']
export type WalletUserListResponse = components['schemas']['Go_internal_module_payment_wallet_WalletUserListResponse_Output']

export interface WalletUserListParams {
  current_page: number
  page_size: number
  keyword?: string
  user_id?: number
}

export type WalletUsersPageInitResponse = components['schemas']['Go_internal_module_payment_wallet_WalletUsersPageInitResponse_Output']
export type WalletLedgerPageInitResponse = components['schemas']['Go_internal_module_payment_wallet_LedgerPageInitResponse_Output']

type WalletTransactionQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_wallet_transactions'>['query']>
type WalletLedgerQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_payment_ledger'>['query']>
type WalletUsersQuery = NonNullable<AdminOperationInput<'get_api_admin_v1_payment_wallets'>['query']>

function normalizeWalletTransactionParams(params: WalletTransactionListParams): WalletTransactionQuery {
  const query: WalletTransactionQuery = {
    current_page: params.current_page,
    page_size: params.page_size,
  }
  if (params.user_id !== undefined) query.user_id = params.user_id
  if (params.keyword) query.keyword = params.keyword
  if (params.direction) query.direction = params.direction
  if (params.source_type) query.source_type = params.source_type
  if (params.date_start) query.date_start = params.date_start
  if (params.date_end) query.date_end = params.date_end
  return query
}

function normalizeLedgerParams(params: WalletTransactionListParams): WalletLedgerQuery {
  const query: WalletLedgerQuery = {
    current_page: params.current_page,
    page_size: params.page_size,
  }
  if (params.user_id !== undefined) query.user_id = params.user_id
  if (params.keyword) query.keyword = params.keyword
  if (params.direction) query.direction = params.direction
  if (params.source_type) query.source_type = params.source_type
  if (params.date_start) query.date_start = params.date_start
  if (params.date_end) query.date_end = params.date_end
  return query
}

function normalizeWalletUserParams(params: WalletUserListParams): WalletUsersQuery {
  const query: WalletUsersQuery = {
    current_page: params.current_page,
    page_size: params.page_size,
  }
  if (params.keyword) query.keyword = params.keyword
  if (params.user_id !== undefined) query.user_id = params.user_id
  return query
}

const summary = (options: ExecuteOptions = {}): Promise<WalletSummaryResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_wallet_summary, {}, options)
const transactions = (params: WalletTransactionListParams, options: ExecuteOptions = {}): Promise<WalletTransactionListResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_wallet_transactions, {
    query: normalizeWalletTransactionParams(params),
  }, options)
const walletUsersPageInit = (options: ExecuteOptions = {}): Promise<WalletUsersPageInitResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_payment_wallets_page_init, {}, options)
const walletUsersList = (params: WalletUserListParams, options: ExecuteOptions = {}): Promise<WalletUserListResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_payment_wallets, {
    query: normalizeWalletUserParams(params),
  }, options)
const ledgerPageInit = (options: ExecuteOptions = {}): Promise<WalletLedgerPageInitResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_payment_ledger_page_init, {}, options)
const ledgerList = (params: WalletTransactionListParams, options: ExecuteOptions = {}): Promise<WalletTransactionListResponse> =>
  executeAdminOperation(adminOperations.get_api_admin_v1_payment_ledger, {
    query: normalizeLedgerParams(params),
  }, options)

export const WalletApi = {
  summary,
  transactions,
  walletUsersPageInit,
  walletUsersList,
  ledgerPageInit,
  ledgerList,

  usersInit: walletUsersPageInit,
  users: walletUsersList,
  ledgerInit: ledgerPageInit,
  ledger: ledgerList,
}
