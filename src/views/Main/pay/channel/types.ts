import type { PayChannelListItem } from '@/api/pay/channel'

export interface PayChannelSearchForm {
  name: string
  channel: number | ''
  status: number | ''
}

export interface PayChannelForm {
  id: number
  name: string
  channel: number
  supported_methods: string[]
  mch_id: string
  app_id: string
  notify_url: string
  app_private_key: string
  app_private_key_hint: string
  public_cert_path: string
  platform_cert_path: string
  root_cert_path: string
  sort: number
  is_sandbox: number
  status: number
  remark: string
}

export type PayChannelDialogMode = 'add' | 'edit'

export type PayChannelEditableRow = PayChannelListItem
