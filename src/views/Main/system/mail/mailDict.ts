import type { MailPageInitResponse } from '@/api/system/mail'

export function createDefaultMailDict(): MailPageInitResponse['dict'] {
  return {
    common_status_arr: [],
    mail_scene_arr: [],
    mail_log_scene_arr: [],
    mail_log_status_arr: [],
    mail_region_arr: [
      { label: '广州', value: 'ap-guangzhou' },
      { label: '香港', value: 'ap-hongkong' },
    ],
    default_region: 'ap-guangzhou',
    default_endpoint: 'ses.tencentcloudapi.com',
  }
}

export function normalizeMailDict(dict: MailPageInitResponse['dict']): MailPageInitResponse['dict'] {
  return {
    ...createDefaultMailDict(),
    ...dict,
  }
}
