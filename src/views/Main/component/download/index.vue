<script setup lang="ts">
import { ref } from 'vue'
import { Download, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { downloadFile, formatFileSize } from '@/lib/browser/download'

const downloadUrl = ref('')
const filename = ref('')
const downloading = ref(false)

const policyRows = [
  { rule: '站内文件', value: '允许当前站点同源 URL，包括相对路径' },
  { rule: '外部文件', value: '仅允许 www.zgm2003.cn 与 cos.zgm2003.cn 的 HTTPS URL' },
  { rule: '失败处理', value: 'HTTP 错误直接显示，不使用模拟文件或历史结果兜底' },
  { rule: '浏览器行为', value: '下载完成后释放临时 Blob URL，不保留后台下载任务' },
]

function optionalFilename(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function requireErrorMessage(error: unknown): string {
  if (!(error instanceof Error) || error.message.trim().length === 0) {
    throw new Error('download failed without a valid error message')
  }
  return error.message
}

async function startDownload() {
  const url = downloadUrl.value.trim()
  if (url.length === 0) {
    ElMessage.warning('请输入下载 URL')
    return
  }

  downloading.value = true
  try {
    await downloadFile(url, optionalFilename(filename.value))
    ElMessage.success('文件已交给浏览器下载')
  } catch (error: unknown) {
    ElMessage.error(requireErrorMessage(error))
  } finally {
    downloading.value = false
  }
}
</script>

<template>
  <div class="browser-download-demo">
    <el-alert
      type="info"
      :closable="false"
      show-icon
    >
      <template #title>
        <span class="alert-title">
          <el-icon><InfoFilled /></el-icon>
          浏览器下载
        </span>
      </template>
      此页面只验证真实浏览器下载，不提供后台任务、进度、取消或打开本地文件夹等虚假能力。
    </el-alert>

    <el-card shadow="never">
      <template #header>
        <strong>下载文件</strong>
      </template>

      <el-form
        label-position="top"
        @submit.prevent="startDownload"
      >
        <el-form-item label="下载 URL">
          <el-input
            v-model="downloadUrl"
            placeholder="输入同源路径或允许的 HTTPS URL"
            clearable
          />
        </el-form-item>
        <el-form-item label="建议文件名（可选）">
          <el-input
            v-model="filename"
            placeholder="例如 report.csv"
            clearable
          />
        </el-form-item>
        <el-button
          native-type="submit"
          type="primary"
          :loading="downloading"
        >
          <el-icon><Download /></el-icon>
          下载
        </el-button>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <strong>浏览器策略</strong>
      </template>
      <el-table
        :data="policyRows"
        border
      >
        <el-table-column
          prop="rule"
          label="项目"
          width="150"
        />
        <el-table-column
          prop="value"
          label="规则"
        />
      </el-table>
      <p class="format-example">
        文件大小格式化示例：{{ formatFileSize(1536) }}
      </p>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.browser-download-demo {
  display: grid;
  gap: 16px;
}

.alert-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.format-example {
  margin: 16px 0 0;
  color: var(--el-text-color-secondary);
}
</style>
