<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { Boot, type IDomEditor, type IEditorConfig, type IModuleConf } from '@wangeditor/editor'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ElMessage } from 'element-plus'
import { getUploadToken, uploadFileToCloud } from '@/lib/upload'

let editorRegisterPromise: Promise<void> | null = null
type PrismWindow = Window & {
  Prism?: {
    languages?: Record<string, unknown>
  }
}
type EditorAlertType = Parameters<IEditorConfig['customAlert']>[1]
type ImageInsertFn = (src: string, alt: string, href: string) => void
type VideoInsertFn = (src: string, poster: string) => void
type MarkdownModule = { default: Partial<IModuleConf> }

interface EditorUploadImageConfig {
  customUpload?: (file: File, insertFn: ImageInsertFn) => Promise<void> | void
}

interface EditorUploadVideoConfig {
  customUpload?: (file: File, insertFn: VideoInsertFn) => Promise<void> | void
}

type WangEditorMenuConfig = NonNullable<IEditorConfig['MENU_CONF']>
type EditorMenuConfig = WangEditorMenuConfig & {
  uploadImage?: EditorUploadImageConfig
  uploadVideo?: EditorUploadVideoConfig
}

interface AdminEditorConfig extends Partial<Omit<IEditorConfig, 'MENU_CONF'>> {
  MENU_CONF?: EditorMenuConfig
  uploadImgShowBase64?: boolean
}

interface Props {
  editorId?: string
  height?: number | string
  editorConfig?: AdminEditorConfig
  modelValue?: string
  uploadFolder?: string
  useCosUpload?: boolean
}

interface Emits {
  change: [editor: IDomEditor]
  'update:modelValue': [value: string]
}

const ensurePrismMarkupTemplatingRegistered = async () => {
  if (typeof window === 'undefined') return
  const prismWindow = window as PrismWindow
  if (prismWindow.Prism?.languages?.['markup-templating']) return
  // wangEditor 内置的 Prism 缺少 markup-templating，会让 php 等模板类高亮偶发报错
  await import('prismjs/components/prism-markup-templating.js')
}

const ensureEditorRegistered = () => {
  if (editorRegisterPromise) return editorRegisterPromise
  editorRegisterPromise = (async () => {
    await ensurePrismMarkupTemplatingRegistered()
    const markdownModule: MarkdownModule = await import('@wangeditor/plugin-md')
    Boot.registerModule(markdownModule.default)
  })()
  return editorRegisterPromise
}

const props = withDefaults(defineProps<Props>(), {
  editorId: 'wangeditor-1',
  height: '500px',
  editorConfig: undefined,
  modelValue: '',
  uploadFolder: 'article',
  useCosUpload: true,
})
const emit = defineEmits<Emits>()
const editorRef = shallowRef<IDomEditor | null>(null)
const valueHtml = shallowRef('')
const editorReady = shallowRef(false)

watch(() => props.modelValue, (val) => {
  if (val === valueHtml.value) return
  valueHtml.value = val
}, { immediate: true })

watch(() => valueHtml.value, (val) => emit('update:modelValue', val))

const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor
}

const cfg = computed<AdminEditorConfig>(() => {
  const userConfig = props.editorConfig
  const menu = cloneMenuConfig(userConfig?.MENU_CONF)

  if (props.useCosUpload) {
    installCosUploadHandlers(menu)
  }

  const merged: AdminEditorConfig = {
    readOnly: false,
    customAlert: showEditorAlert,
    autoFocus: false,
    scroll: true,
    uploadImgShowBase64: true,
  }

  if (userConfig !== undefined) {
    Object.assign(merged, userConfig)
  }
  merged.MENU_CONF = menu

  return merged
})

const toolbarEditor = computed<IDomEditor | undefined>(() => {
  if (editorRef.value === null) return undefined
  return editorRef.value
})
const editorStyle = computed(() => ({ height: typeof props.height === 'number' ? `${props.height}px` : props.height }))
const handleChange = (editor: IDomEditor) => emit('change', editor)

onBeforeUnmount(() => {
  if (editorRef.value !== null) {
    editorRef.value.destroy()
  }
})

const getEditorRef = async (): Promise<IDomEditor | null> => {
  await nextTick()
  return editorRef.value
}

defineExpose({getEditorRef})

onMounted(async () => {
  try {
    await ensureEditorRegistered()
  } finally {
    editorReady.value = true
  }
})

function showEditorAlert(info: string, type: EditorAlertType) {
  switch (type) {
    case 'success':
      ElMessage.success(info)
      return
    case 'info':
      ElMessage.info(info)
      return
    case 'warning':
      ElMessage.warning(info)
      return
    case 'error':
      ElMessage.error(info)
      return
  }

  const unreachable: never = type
  throw new Error(`Unsupported wangEditor alert type: ${unreachable}`)
}

function cloneMenuConfig(menuConfig: AdminEditorConfig['MENU_CONF']): EditorMenuConfig {
  const menu: EditorMenuConfig = {}

  if (menuConfig !== undefined) {
    Object.assign(menu, menuConfig)
  }

  return menu
}

function installCosUploadHandlers(menu: EditorMenuConfig) {
  const uploadImage = ensureUploadImageConfig(menu)
  const uploadVideo = ensureUploadVideoConfig(menu)

  if (uploadImage.customUpload === undefined) {
    uploadImage.customUpload = async (file: File, insertFn: ImageInsertFn) => {
      const tokenResponse = await getUploadToken({
        folderName: props.uploadFolder,
        fileName: file.name,
        fileSize: file.size,
        fileKind: 'image',
      })
      const result = await uploadFileToCloud(file, tokenResponse)
      const uploadURL = requireUploadURL(result.url)
      insertFn(uploadURL, '', '')
    }
  }

  if (uploadVideo.customUpload === undefined) {
    uploadVideo.customUpload = async (file: File, insertFn: VideoInsertFn) => {
      const tokenResponse = await getUploadToken({
        folderName: props.uploadFolder,
        fileName: file.name,
        fileSize: file.size,
        fileKind: 'file',
      })
      const result = await uploadFileToCloud(file, tokenResponse)
      const uploadURL = requireUploadURL(result.url)
      insertFn(uploadURL, '')
    }
  }
}

function ensureUploadImageConfig(menu: EditorMenuConfig): EditorUploadImageConfig {
  if (menu.uploadImage === undefined) {
    menu.uploadImage = {}
  }

  return menu.uploadImage
}

function ensureUploadVideoConfig(menu: EditorMenuConfig): EditorUploadVideoConfig {
  if (menu.uploadVideo === undefined) {
    menu.uploadVideo = {}
  }

  return menu.uploadVideo
}

function requireUploadURL(url: string): string {
  if (url.trim().length === 0) {
    throw new Error('wangEditor upload returned empty URL')
  }

  return url
}
</script>
<template>
  <el-skeleton
    v-if="!editorReady"
    :rows="10"
    animated
  />
  <div
    v-else
    class="editor-wrap"
  >
    <Toolbar
      :editor="toolbarEditor"
      :editor-id="props.editorId"
      class="toolbar"
    />
    <Editor
      v-model="valueHtml"
      :editor-id="props.editorId"
      :default-config="cfg"
      :style="editorStyle"
      @on-change="handleChange"
      @on-created="handleCreated"
    />
  </div>
</template>
<style src="@wangeditor/editor/dist/css/style.css"></style>
<style>
.editor-wrap {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: #fff;
}

.toolbar {
  border-bottom: 1px solid var(--el-border-color);
}

.w-e-full-screen {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2147483647;
  background: #fff;
}

.w-e-full-screen .w-e-toolbar {
  height: 50px;
  border-bottom: 1px solid #ccc;
}

.w-e-full-screen .w-e-text-container {
  height: calc(100vh - 50px) !important;
  background: #fff;
}
</style>
