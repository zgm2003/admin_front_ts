import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  navigateToExternalHttps,
  openExternalUrl,
  openSameOriginPath,
} from '@/lib/browser/navigation'

describe('browser navigation policy', () => {
  const assign = vi.fn()
  const open = vi.fn()

  beforeEach(() => {
    assign.mockReset()
    open.mockReset()
    vi.stubGlobal('location', {
      href: 'https://www.zgm2003.cn/home',
      origin: 'https://www.zgm2003.cn',
      assign,
    })
    vi.stubGlobal('open', open)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('opens only exact allowlisted HTTPS hosts with opener isolation', () => {
    const opened = { opener: {} }
    open.mockReturnValue(opened)

    openExternalUrl('https://cos.zgm2003.cn/exports/report.csv')

    expect(open).toHaveBeenCalledWith(
      'https://cos.zgm2003.cn/exports/report.csv',
      '_blank',
      'noopener,noreferrer',
    )
    expect(opened.opener).toBeNull()
    for (const input of [
      'http://cos.zgm2003.cn/report.csv',
      'https://evil.example/report.csv',
      'https://user:secret@www.zgm2003.cn/report.csv',
      'javascript:alert(1)',
    ]) {
      expect(() => openExternalUrl(input)).toThrow()
    }
  })

  it('opens the queue monitor only on the current origin', () => {
    open.mockReturnValue(null)

    openSameOriginPath('/api/admin/v1/queue-monitor-ui')

    expect(open).toHaveBeenCalledWith(
      'https://www.zgm2003.cn/api/admin/v1/queue-monitor-ui',
      '_blank',
      'noopener,noreferrer',
    )
    expect(() => openSameOriginPath('//evil.example/queue')).toThrow()
    expect(() => openSameOriginPath('https://user:secret@www.zgm2003.cn/queue')).toThrow()
  })

  it('navigates payment flows only to an absolute credential-free HTTPS URL', () => {
    navigateToExternalHttps('https://openapi.alipay.com/gateway.do?order=1')
    expect(assign).toHaveBeenCalledWith('https://openapi.alipay.com/gateway.do?order=1')

    for (const input of [
      'http://openapi.alipay.com/order',
      'javascript:alert(1)',
      'https://user:secret@openapi.alipay.com/order',
      '/relative-payment',
    ]) {
      expect(() => navigateToExternalHttps(input)).toThrow()
    }
  })
})
