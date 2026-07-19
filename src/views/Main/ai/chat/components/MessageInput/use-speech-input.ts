import { nextTick, onUnmounted, ref, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}

interface SpeechRecognitionErrorEventLike {
  error: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

export function useSpeechInput(inputText: Ref<string>, afterTranscript: () => void) {
  const { t } = useI18n()
  const isRecording = ref(false)
  let recognition: SpeechRecognitionLike | null = null

  function stopVoiceInput() {
    recognition?.stop()
    recognition = null
    isRecording.value = false
  }

  function startVoiceInput() {
    const win = window as WindowWithSpeechRecognition
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition
    if (!SpeechRecognition) {
      ElNotification.error({ message: t('aiChat.voiceNotSupported') })
      return
    }

    try {
      recognition = new SpeechRecognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onstart = () => { isRecording.value = true }
      recognition.onresult = (event) => {
        let finalTranscript = ''
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index]
          const alternative = result?.[0]
          if (result?.isFinal && alternative) finalTranscript += alternative.transcript
        }
        if (!finalTranscript) return
        inputText.value += finalTranscript
        nextTick(afterTranscript)
      }
      recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
          ElNotification.warning({ message: t('aiChat.voiceNoSpeech') })
        } else if (event.error === 'not-allowed') {
          ElNotification.error({ message: t('aiChat.voiceDenied') })
        } else {
          ElNotification.error({ message: `${t('aiChat.voiceError')}: ${event.error}` })
        }
        stopVoiceInput()
      }
      recognition.onend = () => { isRecording.value = false }
      recognition.start()
    } catch (error: unknown) {
      ElNotification.error({ message: error instanceof Error ? error.message : t('aiChat.voiceError') })
      isRecording.value = false
    }
  }

  function toggleVoiceInput() {
    if (isRecording.value) stopVoiceInput()
    else startVoiceInput()
  }

  onUnmounted(stopVoiceInput)

  return { isRecording, toggleVoiceInput }
}
