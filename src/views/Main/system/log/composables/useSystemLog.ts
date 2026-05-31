import { computed, ref, shallowRef } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  SystemLogApi,
  type SystemLogFileItem,
  type SystemLogInitResponse,
  type SystemLogLineItem,
  type SystemLogLevel,
} from '@/api/system/log'

export interface HighlightSegment {
  text: string
  hit: boolean
}

export type SystemLogLineTone = 'error' | 'warning' | 'info' | 'debug' | 'normal'

export interface SystemLogDisplayLine extends SystemLogLineItem {
  tone: SystemLogLineTone
  segments: HighlightSegment[]
}

type Translate = (key: string) => string

const emptyDict = (): SystemLogInitResponse['dict'] => ({
  log_level_arr: [],
  log_tail_arr: [],
})

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

const getLineTone = (line: SystemLogLineItem): SystemLogLineTone => {
  if (
    line.level === 'ERROR'
    || line.level === 'CRITICAL'
    || line.content.includes('Exception')
    || line.content.includes('Stack trace')
  ) {
    return 'error'
  }
  if (line.level === 'WARNING') return 'warning'
  if (line.level === 'INFO') return 'info'
  if (line.level === 'DEBUG') return 'debug'
  return 'normal'
}

const buildHighlightSegments = (content: string, keyword: string): HighlightSegment[] => {
  const search = keyword.trim()
  if (!search) return [{ text: content, hit: false }]

  const lowerContent = content.toLowerCase()
  const lowerSearch = search.toLowerCase()
  const segments: HighlightSegment[] = []
  let cursor = 0
  let index = lowerContent.indexOf(lowerSearch)

  while (index >= 0) {
    if (index > cursor) {
      segments.push({ text: content.slice(cursor, index), hit: false })
    }
    const nextCursor = index + search.length
    segments.push({ text: content.slice(index, nextCursor), hit: true })
    cursor = nextCursor
    index = lowerContent.indexOf(lowerSearch, cursor)
  }

  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), hit: false })
  }

  return segments
}

const formatLineForCopy = (line: SystemLogLineItem): string => `${line.number}\t${line.content}`

export const useSystemLog = (t: Translate) => {
  const files = ref<SystemLogFileItem[]>([])
  const lines = ref<SystemLogLineItem[]>([])
  const dict = ref<SystemLogInitResponse['dict']>(emptyDict())

  const filesLoading = shallowRef(false)
  const contentLoading = shallowRef(false)
  const selectedFile = shallowRef('')
  const keyword = shallowRef('')
  const level = shallowRef<SystemLogLevel | ''>('')
  const tail = shallowRef(500)
  const autoScroll = shallowRef(true)
  const fileKeyword = shallowRef('')

  const currentFile = computed(() => {
    const matched = files.value.find((file) => file.name === selectedFile.value)
    return matched || null
  })

  const filteredFiles = computed(() => {
    const search = fileKeyword.value.trim().toLowerCase()
    if (!search) return files.value
    return files.value.filter((file) => file.name.toLowerCase().includes(search))
  })

  const hasActiveFilter = computed(() => Boolean(keyword.value.trim() || level.value))

  const filterSummary = computed(() => {
    const parts: string[] = []
    if (keyword.value.trim()) parts.push(`${t('systemLog.meta.keyword')}: ${keyword.value.trim()}`)
    if (level.value) parts.push(`${t('systemLog.meta.level')}: ${level.value}`)
    parts.push(`${t('systemLog.meta.tail')}: ${tail.value}`)
    return parts.join(' / ')
  })

  const displayLines = computed<SystemLogDisplayLine[]>(() => lines.value.map((line) => ({
    ...line,
    tone: getLineTone(line),
    segments: buildHighlightSegments(line.content, keyword.value),
  })))

  const loadContent = async () => {
    if (!selectedFile.value) return
    contentLoading.value = true
    try {
      const res = await SystemLogApi.lines({
        filename: selectedFile.value,
        keyword: keyword.value,
        level: level.value,
        tail: tail.value,
      })
      lines.value = res.lines
    } catch (error: unknown) {
      ElNotification.error({ message: getErrorMessage(error, t('systemLog.error.loadContent')) })
    } finally {
      contentLoading.value = false
    }
  }

  const loadFiles = async () => {
    filesLoading.value = true
    try {
      const res = await SystemLogApi.files()
      files.value = res.list

      if (!files.value.length) {
        selectedFile.value = ''
        lines.value = []
        return
      }

      const selectedExists = files.value.some((file) => file.name === selectedFile.value)
      if (!selectedFile.value || !selectedExists) {
        const firstFile = files.value[0]
        if (!firstFile) return
        selectedFile.value = firstFile.name
        await loadContent()
      }
    } catch (error: unknown) {
      ElNotification.error({ message: getErrorMessage(error, t('systemLog.error.loadFiles')) })
    } finally {
      filesLoading.value = false
    }
  }

  const loadInit = async () => {
    try {
      const res = await SystemLogApi.pageInit()
      dict.value = res.dict
    } catch (error: unknown) {
      ElNotification.error({ message: getErrorMessage(error, t('systemLog.error.loadContent')) })
    }
  }

  const selectFile = async (name: string) => {
    selectedFile.value = name
    keyword.value = ''
    level.value = ''
    await loadContent()
  }

  const copyText = async (text: string) => {
    if (!text) return
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      ElMessage.error(t('systemLog.error.copyUnsupported'))
      return
    }
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success(t('systemLog.actions.copySuccess'))
    } catch (error: unknown) {
      ElMessage.error(getErrorMessage(error, t('systemLog.error.copyFailed')))
    }
  }

  const copyFileName = () => copyText(selectedFile.value)

  const copyLine = (line: SystemLogLineItem) => copyText(formatLineForCopy(line))

  const copyVisibleLines = () => copyText(lines.value.map(formatLineForCopy).join('\n'))

  const resetFilters = async () => {
    keyword.value = ''
    level.value = ''
    await loadContent()
  }

  return {
    files,
    filteredFiles,
    filesLoading,
    selectedFile,
    currentFile,
    fileKeyword,
    lines,
    displayLines,
    contentLoading,
    keyword,
    level,
    tail,
    autoScroll,
    dict,
    hasActiveFilter,
    filterSummary,
    loadInit,
    loadFiles,
    loadContent,
    selectFile,
    resetFilters,
    copyFileName,
    copyLine,
    copyVisibleLines,
  }
}
