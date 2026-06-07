<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AiPromptApi, type AiPromptItem } from '@/api/ai/prompts'
import type { PageInfo } from '@/types/common'

interface Emits {
  selectPrompt: [prompt: AiPromptItem]
}

const emit = defineEmits<Emits>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()

const loading = shallowRef(false)
const keyword = shallowRef('')
const loadError = shallowRef('')
const prompts = shallowRef<AiPromptItem[]>([])
const page = shallowRef<PageInfo>({
  current_page: 1,
  page_size: 8,
  total_page: 0,
  total: 0,
})
const emptyDescription = computed(() => (loadError.value === '' ? t('aiImages.emptyPromptLibrary') : loadError.value))

watch(visible, (nextVisible) => {
  if (!nextVisible) return
  loadPromptsSafely(1)
})

function loadPromptsSafely(currentPage: number) {
  loadError.value = ''
  void loadPrompts(currentPage).catch(handlePromptLoadError)
}

async function loadPrompts(currentPage: number) {
  loading.value = true
  try {
    const data = await AiPromptApi.list({
      current_page: currentPage,
      page_size: page.value.page_size,
      keyword: keyword.value,
    })
    prompts.value = data.list
    page.value = data.page
  } finally {
    loading.value = false
  }
}

function searchPrompts() {
  loadPromptsSafely(1)
}

function handlePromptLoadError(error: unknown) {
  prompts.value = []
  page.value = emptyPage(page.value.page_size)
  loadError.value = errorMessage(error, t('aiImages.promptLoadFailed'))
  ElMessage.error(loadError.value)
}

function emptyPage(pageSize: number): PageInfo {
  return {
    current_page: 1,
    page_size: pageSize,
    total_page: 0,
    total: 0,
  }
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function selectPrompt(prompt: AiPromptItem) {
  emit('selectPrompt', prompt)
  visible.value = false
}
</script>

<template>
  <AppDialog v-model="visible" :title="t('aiImages.promptLibrary')" width="760px" height="68vh" body-padding="20px">
    <div class="prompt-dialog" v-loading="loading">
      <div class="prompt-search">
        <el-input v-model="keyword" :placeholder="t('aiImages.promptSearchPlaceholder')" clearable @keyup.enter="searchPrompts" />
        <el-button type="primary" @click="searchPrompts">{{ t('common.actions.query') }}</el-button>
      </div>

      <div class="prompt-list">
        <el-empty v-if="prompts.length === 0" :description="emptyDescription" />
        <button v-for="prompt in prompts" v-else :key="prompt.id" class="prompt-card" type="button" @click="selectPrompt(prompt)">
          <strong>{{ prompt.title }}</strong>
          <span>{{ prompt.category }}</span>
          <p>{{ prompt.preview }}</p>
        </button>
      </div>

      <el-pagination
        small
        background
        layout="prev, pager, next"
        :page-size="page.page_size"
        :current-page="page.current_page"
        :total="page.total"
        @current-change="loadPromptsSafely"
      />
    </div>
  </AppDialog>
</template>

<style scoped>
.prompt-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100%;
}

.prompt-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
}

.prompt-list {
  border: 1px dashed var(--image-studio-line-strong, var(--el-border-color));
  border-radius: 16px;
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  padding: 12px;
}

.prompt-card {
  width: 100%;
  border: 1px solid var(--image-studio-line, var(--el-border-color-lighter));
  border-radius: 14px;
  background: var(--image-studio-surface, var(--el-bg-color));
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 10px;
  padding: 12px;
  text-align: left;
}

.prompt-card strong {
  color: var(--image-studio-text, var(--el-text-color-primary));
}

.prompt-card span,
.prompt-card p {
  color: var(--image-studio-muted, var(--el-text-color-secondary));
  font-size: 12px;
}

.prompt-card p {
  line-height: 1.65;
  margin: 0;
}
</style>
