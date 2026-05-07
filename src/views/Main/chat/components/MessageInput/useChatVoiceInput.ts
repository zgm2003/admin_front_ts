import { onUnmounted, ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'

interface SpeechRecognitionAlternativeLike {
  transcript: string
}

interface SpeechRecognitionResultLike {
  readonly isFinal: boolean
  readonly [index: number]: SpeechRecognitionAlternativeLike
}

interface SpeechRecognitionResultListLike {
  readonly length: number
  readonly [index: number]: SpeechRecognitionResultLike
}

interface SpeechRecognitionResultEventLike extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultListLike
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string
}

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructorLike
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike
}

interface UseChatVoiceInputOptions {
  content: Ref<string>
  setText: (text: string) => void
  getErrorMessage: (error: unknown, fallback: string) => string
}

export function useChatVoiceInput(options: UseChatVoiceInputOptions) {
  const isRecording = ref(false)
  let recognition: SpeechRecognitionLike | null = null

  function stopVoiceInput() {
    if (recognition) {
      recognition.stop()
      recognition = null
    }
    isRecording.value = false
    ElMessage.info('语音输入已停止')
  }

  function startVoiceInput() {
    const recognitionWindow = window as SpeechRecognitionWindow
    const SpeechRecognition = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition
    if (!SpeechRecognition) {
      ElMessage.error('当前浏览器不支持语音识别')
      return
    }

    try {
      recognition = new SpeechRecognition()
      recognition.lang = 'zh-CN'
      recognition.continuous = true
      recognition.interimResults = true

      recognition.onstart = () => {
        isRecording.value = true
        ElMessage.success('开始语音输入')
      }

      recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result?.[0]?.transcript ?? ''
          if (result?.isFinal) finalTranscript += transcript
        }
        if (finalTranscript) options.setText(`${options.content.value}${finalTranscript}`)
      }

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.error('语音识别错误:', event.error)
        if (event.error === 'no-speech') {
          ElMessage.warning('未检测到语音，请重试')
        } else if (event.error === 'not-allowed') {
          ElMessage.error('麦克风权限被拒绝')
        } else {
          ElMessage.error(`语音识别失败: ${event.error}`)
        }
        stopVoiceInput()
      }

      recognition.onend = () => {
        isRecording.value = false
      }

      recognition.start()
    } catch (error: unknown) {
      ElMessage.error(options.getErrorMessage(error, '启动语音识别失败'))
      isRecording.value = false
    }
  }

  function toggleVoiceInput() {
    if (isRecording.value) {
      stopVoiceInput()
      return
    }
    startVoiceInput()
  }

  onUnmounted(() => {
    if (recognition) {
      recognition.stop()
      recognition = null
    }
  })

  return {
    isRecording,
    toggleVoiceInput,
  }
}
