import type { SmsPageInitResponse } from '@/api/system/sms'

export function createDefaultSmsDict(): SmsPageInitResponse['dict'] {
  return {
    common_status_arr: [],
    sms_scene_arr: [],
    sms_log_scene_arr: [],
    sms_log_status_arr: [],
    sms_region_arr: [{ label: '广州', value: 'ap-guangzhou' }],
    default_region: 'ap-guangzhou',
    default_endpoint: 'sms.tencentcloudapi.com',
    default_ttl_minutes: 5,
  }
}

export function normalizeSmsDict(dict: SmsPageInitResponse['dict']): SmsPageInitResponse['dict'] {
  return {
    ...createDefaultSmsDict(),
    ...dict,
  }
}
