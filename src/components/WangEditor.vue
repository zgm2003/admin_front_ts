<template>
  <card class="editor-preview-container" :style="{ height: computedHeight }">
    <!-- 左侧编辑器 -->
    <div class="editor-container">
      <!-- 工具栏 -->
      <Toolbar
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          :mode="mode"
          :editorId="'wangeditor-1'"
          class="toolbar"
      />
      <!-- 编辑区域 -->
      <Editor
          v-model:content="content"
          :defaultConfig="editorConfig"
          :mode="mode"
          :editorId="'wangeditor-1'"
          @onCreated="handleCreated"
          @onChange="handleChange"
          class="editor"
      />
    </div>
    <!-- 右侧预览 -->
<!--    <div class="preview-container">-->
<!--      <div class="preview-toolbar">预览</div>-->
<!--      <div class="preview-content" v-html="content"></div>-->
<!--    </div>-->
  </card>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount, defineProps, defineEmits, watch, computed, nextTick } from 'vue'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import MarkdownIt from 'markdown-it'
import { getCosUploadToken, uploadFileToCos } from '@/utils/cosUpload.js'
import { ElMessage } from 'element-plus'

// props & emits
const props = defineProps({
  modelValue: { type: String, default: '' },
  toolbarConfig: { type: Object, default: () => ({}) },
  editorConfig: { type: Object, default: () => ({ placeholder: '请输入内容...' }) },
  mode: { type: String, default: 'default' },
  height: { type: [String, Number], default: '500px' },
})
const emit = defineEmits(['update:modelValue','change'])

// editor 实例 & 内容
const editorRef = shallowRef(null)
const content = ref('')

// markdown-it 实例
const mdParser = new MarkdownIt()

// 判断字符串是否 HTML
function isHtml(text) {
  return /<[^>]+>/.test(text)
}

// 合并用户传入的 editorConfig，并添加 paste 处理
const editorConfig = {
  ...props.editorConfig,
  // 拦截粘贴：如果是 Markdown 文本，则先渲染
  customPaste: (editor, event) => {
    const text = event.clipboardData.getData('text/plain')
    if (/^(#|>|\-|\*|```)/m.test(text)) {
      const html = mdParser.render(text)
      editor.insertHTML(html)
      event.preventDefault()
      return false
    }
    return true
  },
  MENU_CONF: {
    uploadImage: {
      customUpload(file, insertFn) {
        ;(async () => {
          try {
            const tokenResponse = await getCosUploadToken({ folderName: 'article' })
            const result = await uploadFileToCos(file, tokenResponse)
            insertFn(result.url || '', '', '')
          } catch {
            ElMessage.error('图片上传失败')
          }
        })()
      },
    },
    uploadVideo: {
      customUpload(file, insertFn) {
        ;(async () => {
          try {
            const tokenResponse = await getCosUploadToken({ folderName: 'article' })
            const result = await uploadFileToCos(file, tokenResponse)
            insertFn(result.url || '')
          } catch {
            ElMessage.error('视频上传失败')
          }
        })()
      },
    },
  },
}

editorConfig.customAlert = (s, t) => {
  if (t === 'success') ElMessage.success(s)
  else if (t === 'info') ElMessage.info(s)
  else if (t === 'warning') ElMessage.warning(s)
  else if (t === 'error') ElMessage.error(s)
  else ElMessage.info(s)
}

// 计算高度
const computedHeight = computed(() => typeof props.height === 'number' ? `${props.height}px` : props.height)

// 初始化 & 创建后钩子
function handleCreated(editor) {
  editorRef.value = editor
  editor.config = editorConfig

  const v = props.modelValue || ''
  if (v) {
    if (isHtml(v)) {
      editor.setHtml(v)
      content.value = v
    } else {
      const html = mdParser.render(v)
      editor.setHtml(html)
      content.value = html
    }
  }

  const obs = new MutationObserver(() => {
    const fsEl = document.querySelector('.w-e-full-screen')
    if (fsEl) {
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
    }
  })
  obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
  editorRef.value.__fsObserver = obs
}

// 编辑内容变化
function handleChange(editor) {
  const html = editor.getHtml()
  content.value = html
  emit('update:modelValue', html)
  emit('change', editor)
}

// 外部 modelValue 更新
watch(
    () => props.modelValue,
    (newVal) => {
      if (!editorRef.value) return
      if (newVal === content.value) return

      if (isHtml(newVal)) {
        editorRef.value.setHtml(newVal)
        content.value = newVal
      } else {
        const html = mdParser.render(newVal)
        editorRef.value.setHtml(html)
        content.value = html
      }
    }
)

onBeforeUnmount(() => {
  editorRef.value?.destroy()
  if (editorRef.value && editorRef.value.__fsObserver) {
    editorRef.value.__fsObserver.disconnect()
    document.documentElement.style.overflow = ''
  }
})

async function getEditorRef() {
  await nextTick()
  return editorRef.value
}

defineExpose({ getEditorRef })
</script>

<style scoped>
.editor-preview-container {
  display: flex;
  width: 100%;
  border-bottom: 1px solid #ccc;
}
.editor-container,
.preview-container {
  border: 1px solid #ccc;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.toolbar {
  flex: 0 0 50px;
  border-bottom: 1px solid #ccc;
}
.editor {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}
.preview-container {
  padding: 10px;
  background: #f9f9f9;
}
.preview-toolbar {
  flex: 0 0 50px;
  border-bottom: 1px solid #ccc;
  text-align: center;
  line-height: 50px;
  background-color: #f0f0f0;
}
.preview-content {
  flex: 1;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
<style>
.w-e-full-screen {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 2147483647 !important;
  background: #fff !important;
}
.w-e-full-screen .w-e-toolbar {
  height: 50px;
  border-bottom: 1px solid #ccc;
}
.w-e-full-screen .w-e-text-container {
  height: calc(100vh - 50px) !important;
}
</style>
