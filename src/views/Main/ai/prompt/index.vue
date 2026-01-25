<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { AiPromptApi } from '@/api/ai/prompt'
import { useIsMobile } from '@/hooks/useResponsive'
import { useCopy } from '@/hooks/useCopy'
import { useUserStore } from '@/store/user'
import { CommonEnum } from '@/enums'
import { ElCard, ElButton, ElInput, ElDialog, ElForm, ElFormItem, ElMessage, ElMessageBox, ElSpace, ElText, ElEmpty, ElScrollbar, ElInputTag } from 'element-plus'
import { Plus, Star, StarFilled, Edit, Delete, DocumentCopy, Search } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()
const { copy } = useCopy()

// 列表
const list = ref<any[]>([])
const keyword = ref('')

const filteredList = computed(() => {
  if (!keyword.value.trim()) return list.value
  const k = keyword.value.toLowerCase()
  return list.value.filter(item => 
    item.title.toLowerCase().includes(k) || 
    item.category?.toLowerCase().includes(k) ||
    item.tags?.some((tag: string) => tag.toLowerCase().includes(k))
  )
})

const getList = async () => {
  const res = await AiPromptApi.list()
  list.value = res.list || []
}

// 使用提示词
const handleUse = async (item: any) => {
  await AiPromptApi.use({ id: item.id })
  copy(item.content)
  item.use_count++
}

// 收藏切换
const handleToggleFavorite = async (item: any) => {
  const res = await AiPromptApi.toggleFavorite({ id: item.id })
  item.is_favorite = res.is_favorite
}

// 删除
const handleDel = async (item: any) => {
  await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirmTitle'), { type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel') })
  await AiPromptApi.del({ id: item.id })
  ElMessage.success(t('common.success.delete'))
  getList()
}

// 弹窗
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance>()
const form = ref({ id: 0, title: '', content: '', category: '', tags: [] as string[] })

const openAdd = () => {
  dialogMode.value = 'add'
  form.value = { id: 0, title: '', content: '', category: '', tags: [] }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const openEdit = (item: any) => {
  dialogMode.value = 'edit'
  form.value = { id: item.id, title: item.title, content: item.content, category: item.category || '', tags: item.tags || [] }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  await formRef.value?.validate()
  const api = dialogMode.value === 'add' ? AiPromptApi.add : AiPromptApi.edit
  await api(form.value)
  ElMessage.success(t('common.success.operation'))
  dialogVisible.value = false
  getList()
}

onMounted(getList)
</script>

<template>
  <div class="page">
    <div class="header">
      <ElInput v-model="keyword" :prefix-icon="Search" :placeholder="t('aiPrompt.search')" clearable class="search" />
      <ElButton v-if="userStore.can('ai_prompt_add')" type="primary" :icon="Plus" @click="openAdd">{{ t('aiPrompt.add') }}</ElButton>
    </div>

    <ElScrollbar class="content">
      <div v-if="filteredList.length" class="grid" :class="{ mobile: isMobile }">
        <ElCard v-for="item in filteredList" :key="item.id" shadow="hover" class="card">
          <div class="card-header">
            <ElSpace :size="8">
              <ElText tag="b" truncated>{{ item.title }}</ElText>
              <ElButton v-if="item.category" size="small" round plain>{{ item.category }}</ElButton>
            </ElSpace>
            <ElButton :icon="item.is_favorite === CommonEnum.YES ? StarFilled : Star" circle size="small" :type="item.is_favorite === CommonEnum.YES ? 'warning' : 'default'" @click="handleToggleFavorite(item)" />
          </div>
          <ElText class="card-content" type="info" line-clamp="3">{{ item.content }}</ElText>
          <div class="card-footer">
            <ElText size="small" type="info">{{ t('aiPrompt.useCount', { count: item.use_count }) }}</ElText>
            <ElSpace :size="4">
              <ElButton type="primary" size="small" :icon="DocumentCopy" @click="handleUse(item)">{{ t('aiPrompt.use') }}</ElButton>
              <ElButton v-if="userStore.can('ai_prompt_edit')" size="small" type="primary" :icon="Edit" @click="openEdit(item)" />
              <ElButton v-if="userStore.can('ai_prompt_del')" size="small" type="danger" :icon="Delete" @click="handleDel(item)" />
            </ElSpace>
          </div>
        </ElCard>
      </div>
      <ElEmpty v-else :description="t('aiPrompt.empty')" />
    </ElScrollbar>
  </div>

  <ElDialog v-model="dialogVisible" :title="dialogMode === 'add' ? t('aiPrompt.addTitle') : t('aiPrompt.editTitle')" :width="isMobile ? '94vw' : '600px'">
    <ElForm ref="formRef" :model="form" label-width="70px">
      <ElFormItem :label="t('aiPrompt.form.title')" prop="title" :rules="[{ required: true, message: t('aiPrompt.form.title') + t('common.required') }]">
        <ElInput v-model="form.title" :placeholder="t('aiPrompt.form.titlePlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('aiPrompt.form.content')" prop="content" :rules="[{ required: true, message: t('aiPrompt.form.content') + t('common.required') }]">
        <ElInput v-model="form.content" type="textarea" :rows="8" :placeholder="t('aiPrompt.form.contentPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('aiPrompt.form.category')">
        <ElInput v-model="form.category" :placeholder="t('aiPrompt.form.categoryPlaceholder')" />
      </ElFormItem>
      <ElFormItem :label="t('aiPrompt.form.tags')">
        <ElInputTag v-model="form.tags" :placeholder="t('aiPrompt.form.tagsPlaceholder')" clearable tag-type="primary"/>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="dialogVisible = false">{{ t('common.actions.cancel') }}</ElButton>
      <ElButton type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; height: 100%; gap: 16px; }
.header { display: flex; gap: 12px; flex-shrink: 0; }
.search { max-width: 300px; }
.content { flex: 1; min-height: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; padding: 4px; &.mobile { grid-template-columns: 1fr; } }
.card { display: flex; flex-direction: column; :deep(.el-card__body) { display: flex; flex-direction: column; gap: 12px; padding: 16px; height: 100%; } }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-content { flex: 1; white-space: pre-wrap; word-break: break-word; }
.card-footer { display: flex; justify-content: space-between; align-items: center; }
</style>
