import { executeAdminOperation } from '@/lib/http'
import { loadAdminOperation } from '@/modules/http/admin-operation-loader'
import {
  parseQueueMonitorGrantResponse,
  parseRealtimeTicketResponse,
  type QueueMonitorGrantResponse,
  type RealtimeTicketResponse,
} from './browserGrantContract'

export async function issueRealtimeTicket(signal?: AbortSignal): Promise<RealtimeTicketResponse> {
  const response = await executeAdminOperation(
    await loadAdminOperation('post_api_admin_v1_auth_realtime_tickets'),
    {},
    { signal },
  )
  return parseRealtimeTicketResponse(response)
}

export async function issueQueueMonitorGrant(signal?: AbortSignal): Promise<QueueMonitorGrantResponse> {
  const response = await executeAdminOperation(
    await loadAdminOperation('post_api_admin_v1_auth_queue_monitor_grants'),
    {},
    { signal },
  )
  return parseQueueMonitorGrantResponse(response)
}
