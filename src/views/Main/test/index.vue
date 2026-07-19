<template>
  <el-card shadow="never">
    <template #header>
      <strong>{{ t('devTest.themeSwitch') }}</strong>
    </template>
    <el-switch
      v-model="isDark"
      :active-text="t('devTest.dark')"
      :inactive-text="t('devTest.light')"
      @change="toggleDarkMode"
    />
  </el-card>

  <el-card
    shadow="never"
    class="section-card"
  >
    <template #header>
      <strong>{{ t('devTest.downloadTitle') }}</strong>
    </template>

    <el-form
      label-position="top"
      @submit.prevent="handleDownload"
    >
      <el-form-item :label="t('devTest.downloadUrl')">
        <el-input
          v-model="testUrl"
          :placeholder="t('devTest.downloadUrlPlaceholder')"
          clearable
        />
      </el-form-item>
      <el-form-item :label="t('devTest.filename')">
        <el-input
          v-model="testFilename"
          :placeholder="t('devTest.filenamePlaceholder')"
          clearable
        />
      </el-form-item>
      <el-button
        native-type="submit"
        type="primary"
        :loading="downloading"
      >
        {{ t('devTest.startDownload') }}
      </el-button>
    </el-form>
  </el-card>

  <el-card
    shadow="never"
    class="section-card"
  >
    <template #header>
      <strong>{{ t('devTest.editor') }}</strong>
    </template>
    <RichEditor
      v-model="content"
      :height="350"
      @change="onEditorChange"
    />
  </el-card>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useAppKernel } from '@/app/injection'
import { downloadFile } from '@/lib/browser/download'
import {
  readDevicePreferences,
  writeDevicePreferences,
} from '@/modules/persistence/preferences'
import { toggleDarkMode as applyDarkMode } from '@/hooks/useTheme'

const RichEditor = defineAsyncComponent(() => import('@/views/Main/component/display/components/Editor.vue'))
const { t } = useI18n()
const kernel = useAppKernel()

const isDark = ref(false)
const content = ref(t('devTest.editorWelcome'))
const testUrl = ref('')
const testFilename = ref('')
const downloading = ref(false)

function toggleDarkMode(value: string | number | boolean) {
  const enabled = Boolean(value)
  applyDarkMode(enabled)
  writeDevicePreferences(kernel.persistence, {
    ...readDevicePreferences(kernel.persistence),
    theme: enabled ? 'dark' : 'light',
  })
}

function onEditorChange() {
}

function optionalFilename(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function requireDownloadError(error: unknown): string {
  if (!(error instanceof Error) || error.message.trim().length === 0) {
    throw new Error('dev test download failed without a valid error message')
  }
  return error.message
}

async function handleDownload() {
  const url = testUrl.value.trim()
  if (url.length === 0) {
    ElMessage.warning(t('devTest.downloadUrlRequired'))
    return
  }

  downloading.value = true
  try {
    await downloadFile(url, optionalFilename(testFilename.value))
    ElMessage.success(t('devTest.downloadDone'))
  } catch (error: unknown) {
    ElMessage.error(t('devTest.downloadFailed', { error: requireDownloadError(error) }))
  } finally {
    downloading.value = false
  }
}

onMounted(() => {
  isDark.value = readDevicePreferences(kernel.persistence).theme === 'dark'
  applyDarkMode(isDark.value)
})
</script>

<style scoped>
.section-card {
  margin-top: 16px;
}
</style>
