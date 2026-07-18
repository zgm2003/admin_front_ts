import request from '@/lib/http'
import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'
import {
  parseQueueMonitorGrantResponse,
  parseRealtimeTicketResponse,
  type QueueMonitorGrantResponse,
  type RealtimeTicketResponse,
} from './browserGrantContract'

export async function issueRealtimeTicket(): Promise<RealtimeTicketResponse> {
  const response = await request.post<unknown>(`${ADMIN_API_PREFIX}/auth/realtime-tickets`)
  return parseRealtimeTicketResponse(response)
}

export async function issueQueueMonitorGrant(): Promise<QueueMonitorGrantResponse> {
  const response = await request.post<unknown>(`${ADMIN_API_PREFIX}/auth/queue-monitor-grants`)
  return parseQueueMonitorGrantResponse(response)
}
