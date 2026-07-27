import { describe, expect, it, vi } from 'vitest'
import { useMessageSpeech } from '@/views/Main/ai/chat/composables/useMessageSpeech'

interface FakeVoice {
  default: boolean
  lang: string
  name: string
}

class FakeUtterance {
  readonly text: string
  voice: FakeVoice | null = null
  lang = ''
  onend: (() => void) | null = null
  onerror: (() => void) | null = null

  constructor(text: string) {
    this.text = text
  }
}

function createSpeech(voices: FakeVoice[]) {
  const utterances: FakeUtterance[] = []
  const synthesis = {
    getVoices: vi.fn(() => voices),
    speak: vi.fn((utterance: FakeUtterance) => utterances.push(utterance)),
    pause: vi.fn(),
    resume: vi.fn(),
    cancel: vi.fn(),
  }
  const speech = useMessageSpeech({
    synthesis,
    createUtterance: (text) => new FakeUtterance(text),
  })
  return { speech, synthesis, utterances }
}

describe('message browser speech', () => {
  it('prefers Google Chinese, then zh-CN, then the default voice', () => {
    const defaultVoice = { default: true, lang: 'en-US', name: 'System Default' }
    const chineseVoice = { default: false, lang: 'zh-CN', name: 'Microsoft Xiaoxiao' }
    const googleVoice = { default: false, lang: 'zh-CN', name: 'Google 普通话' }
    const preferred = createSpeech([defaultVoice, chineseVoice, googleVoice])

    expect(preferred.speech.start(11, '第一条回复')).toBe(true)
    expect(preferred.utterances[0]?.voice).toBe(googleVoice)
    preferred.speech.dispose()

    const localized = createSpeech([defaultVoice, chineseVoice])
    localized.speech.start(12, '第二条回复')
    expect(localized.utterances[0]?.voice).toBe(chineseVoice)
    localized.speech.dispose()

    const fallback = createSpeech([defaultVoice])
    fallback.speech.start(13, '第三条回复')
    expect(fallback.utterances[0]?.voice).toBe(defaultVoice)
    fallback.speech.dispose()
  })

  it('owns one message and supports pause, resume, stop and cleanup', () => {
    const { speech, synthesis } = createSpeech([])

    speech.start(11, 'first')
    speech.pause()
    expect(speech.paused.value).toBe(true)
    expect(synthesis.pause).toHaveBeenCalledOnce()

    speech.resume()
    expect(speech.paused.value).toBe(false)
    expect(synthesis.resume).toHaveBeenCalledOnce()

    speech.start(12, 'second')
    expect(synthesis.cancel).toHaveBeenCalledOnce()
    expect(speech.activeMessageId.value).toBe(12)

    speech.stop()
    expect(synthesis.cancel).toHaveBeenCalledTimes(2)
    expect(speech.activeMessageId.value).toBeNull()

    speech.start(13, 'third')
    speech.dispose()
    expect(synthesis.cancel).toHaveBeenCalledTimes(3)
  })

  it('reports unsupported environments without invoking a fallback', () => {
    const speech = useMessageSpeech({ synthesis: null, createUtterance: null })

    expect(speech.isSupported.value).toBe(false)
    expect(speech.start(11, 'not spoken')).toBe(false)
    expect(speech.activeMessageId.value).toBeNull()
  })
})
