import { getCurrentInstance, onUnmounted, shallowRef } from 'vue'

interface SpeechVoiceLike {
  readonly default?: boolean
  readonly lang: string
  readonly name: string
}

interface SpeechUtteranceLike {
  lang: string
  voice: SpeechVoiceLike | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

interface SpeechSynthesisLike {
  getVoices(): SpeechVoiceLike[]
  speak(utterance: SpeechUtteranceLike): void
  pause(): void
  resume(): void
  cancel(): void
}

interface MessageSpeechOptions {
  synthesis?: SpeechSynthesisLike | null
  createUtterance?: ((text: string) => SpeechUtteranceLike) | null
}

function browserSynthesis(): SpeechSynthesisLike | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return window.speechSynthesis
}

function browserUtteranceFactory(): ((text: string) => SpeechUtteranceLike) | null {
  if (typeof SpeechSynthesisUtterance === 'undefined') return null
  return (text) => new SpeechSynthesisUtterance(text)
}

function selectVoice(voices: SpeechVoiceLike[]): SpeechVoiceLike | null {
  const googleChinese = voices.find((voice) => (
    /google/i.test(voice.name) && /^zh(?:-|_)/i.test(voice.lang)
  ))
  if (googleChinese) return googleChinese
  const chinese = voices.find((voice) => voice.lang.toLowerCase() === 'zh-cn')
  if (chinese) return chinese
  return voices.find((voice) => voice.default === true) ?? null
}

export function useMessageSpeech(options: MessageSpeechOptions = {}) {
  const synthesis = options.synthesis === undefined ? browserSynthesis() : options.synthesis
  const createUtterance = options.createUtterance === undefined
    ? browserUtteranceFactory()
    : options.createUtterance
  const isSupported = shallowRef(Boolean(synthesis && createUtterance))
  const activeMessageId = shallowRef<number | null>(null)
  const paused = shallowRef(false)
  let activeUtterance: SpeechUtteranceLike | null = null

  function reset(utterance?: SpeechUtteranceLike) {
    if (utterance && activeUtterance !== utterance) return
    activeUtterance = null
    activeMessageId.value = null
    paused.value = false
  }

  function stop() {
    if (!synthesis || activeMessageId.value === null) return
    synthesis.cancel()
    reset()
  }

  function start(messageId: number, content: string) {
    if (!synthesis || !createUtterance || !Number.isSafeInteger(messageId) || messageId <= 0) return false
    if (!/\S/.test(content)) return false
    if (activeMessageId.value !== null) stop()

    const utterance = createUtterance(content)
    const voice = selectVoice(synthesis.getVoices())
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }
    utterance.onend = () => reset(utterance)
    utterance.onerror = () => reset(utterance)
    activeUtterance = utterance
    activeMessageId.value = messageId
    paused.value = false
    synthesis.speak(utterance)
    return true
  }

  function pause() {
    if (!synthesis || activeMessageId.value === null || paused.value) return
    synthesis.pause()
    paused.value = true
  }

  function resume() {
    if (!synthesis || activeMessageId.value === null || !paused.value) return
    synthesis.resume()
    paused.value = false
  }

  function dispose() {
    stop()
  }

  if (getCurrentInstance()) onUnmounted(dispose)

  return {
    isSupported,
    activeMessageId,
    paused,
    start,
    pause,
    resume,
    stop,
    dispose,
  }
}
