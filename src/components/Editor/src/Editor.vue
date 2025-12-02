<script setup lang="ts">
import { onBeforeUnmount, computed, nextTick, ref, watch, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { ElMessage } from 'element-plus'
import { getCosUploadToken, uploadFileToCos } from '@/utils/cosUpload'

const props = defineProps({ editorId: { type: String, default: 'wangeditor-1' }, height: { type: [Number, String], default: '500px' }, editorConfig: { type: Object, default: () => undefined }, modelValue: { type: String, default: '' }, uploadFolder: { type: String, default: 'article' }, useCosUpload: { type: Boolean, default: true } })
const emit = defineEmits(['change','update:modelValue'])
const editorRef = shallowRef()
const valueHtml = ref('')
watch(() => props.modelValue, (val) => { if (val === valueHtml.value) return; valueHtml.value = val || '' }, { immediate: true })
watch(() => valueHtml.value, (val) => emit('update:modelValue', val))
const handleCreated = (editor: any) => { editorRef.value = editor }

const cfg = computed(() => {
  const base: any = { readOnly: false, customAlert: (s: string, t: string) => { if (t==='success') ElMessage.success(s); else if (t==='info') ElMessage.info(s); else if (t==='warning') ElMessage.warning(s); else if (t==='error') ElMessage.error(s); else ElMessage.info(s) }, autoFocus: false, scroll: true, uploadImgShowBase64: true }
  const user: any = props.editorConfig || {}
  const menu: any = Object.assign({}, user.MENU_CONF || {})
  if (props.useCosUpload) {
    if (!menu.uploadImage) menu.uploadImage = {}
    if (!menu.uploadImage.customUpload) menu.uploadImage.customUpload = async (file: File, insertFn: any) => { const tokenResponse = await getCosUploadToken({ folderName: props.uploadFolder }); const result = await uploadFileToCos(file, tokenResponse); insertFn(result.url || '', '', '') }
    if (!menu.uploadVideo) menu.uploadVideo = {}
    if (!menu.uploadVideo.customUpload) menu.uploadVideo.customUpload = async (file: File, insertFn: any) => { const tokenResponse = await getCosUploadToken({ folderName: props.uploadFolder }); const result = await uploadFileToCos(file, tokenResponse); insertFn(result.url || '') }
  }
  const merged: any = Object.assign({}, base, user); merged.MENU_CONF = menu; return merged
})
const editorStyle = computed(() => ({ height: typeof props.height === 'number' ? `${props.height}px` : props.height }))
const handleChange = (editor: any) => emit('change', editor)
onBeforeUnmount(() => { editorRef.value?.destroy() })
const getEditorRef = async () => { await nextTick(); return editorRef.value }
defineExpose({ getEditorRef })
</script>
<template>
  <div class="editor-wrap">
    <Toolbar :editor="editorRef" :editorId="props.editorId" class="toolbar" />
    <Editor v-model="valueHtml" :editorId="props.editorId" :defaultConfig="cfg" :style="editorStyle" @on-change="handleChange" @on-created="handleCreated" />
  </div>
</template>
<style src="@wangeditor/editor/dist/css/style.css"></style>
<style>
.editor-wrap { border: 1px solid var(--el-border-color); border-radius: 4px; background: #fff; }
.toolbar { border-bottom: 1px solid var(--el-border-color); }
.w-e-full-screen { position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647; background: #fff; }
.w-e-full-screen .w-e-toolbar { height: 50px; border-bottom: 1px solid #ccc; }
.w-e-full-screen .w-e-text-container { height: calc(100vh - 50px) !important; }
</style>
