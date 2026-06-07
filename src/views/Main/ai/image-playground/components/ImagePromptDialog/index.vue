<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
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
const prompts = shallowRef<AiPromptItem[]>([])
const page = shallowRef<PageInfo>({
  current_page: 1,
  page_size: 8,
  total_page: 0,
  total: 0,
})

watch(visible, (nextVisible) => {
  if (!nextVisible) return
  void loadPrompts(1)
})

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
  void loadPrompts(1)
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
        <el-empty v-if="prompts.length === 0" :description="t('aiImages.emptyPromptLibrary')" />
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
        @current-change="loadPrompts"
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
