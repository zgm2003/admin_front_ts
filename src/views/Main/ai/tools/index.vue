<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { ElNotification } from 'element-plus'
import {
  AiToolApi,
  type AiToolGeneratedDraft,
  type AiToolInitResponse,
  type AiToolItem,
} from '@/api/ai/tools'
import ToolList from './components/ToolList/index.vue'
import ToolFormDialog from './components/ToolFormDialog/index.vue'
import ToolGenerateDialog from './components/ToolGenerateDialog/index.vue'

const dict = shallowRef<AiToolInitResponse['dict']>({
  risk_level_arr: [],
  common_status_arr: [],
})
const refreshSignal = shallowRef(0)
const formVisible = shallowRef(false)
const generateVisible = shallowRef(false)
const formMode = shallowRef<'add' | 'edit'>('add')
const editingTool = shallowRef<AiToolItem | null>(null)
const generatedDraft = shallowRef<AiToolGeneratedDraft | null>(null)

async function loadInit() {
  const initData = await AiToolApi.pageInit()
  dict.value = initData.dict
}

function openAdd() {
  formMode.value = 'add'
  editingTool.value = null
  generatedDraft.value = null
  formVisible.value = true
}

function openGenerate() {
  generateVisible.value = true
}

function applyGeneratedDraft(draft: AiToolGeneratedDraft) {
  formMode.value = 'add'
  editingTool.value = null
  generatedDraft.value = draft
  formVisible.value = true
}

function openEdit(row: AiToolItem) {
  formMode.value = 'edit'
  editingTool.value = row
  generatedDraft.value = null
  formVisible.value = true
}

function afterMutation() {
  refreshSignal.value += 1
}

onMounted(() => {
  loadInit().catch((error: unknown) => {
    ElNotification.error({ message: error instanceof Error ? error.message : 'AI工具初始化失败' })
  })
})
</script>

<template>
  <div class="ai-tools-page">
    <ToolList
      :dict="dict"
      :refresh-signal="refreshSignal"
      @add="openAdd"
      @generate="openGenerate"
      @edit="openEdit"
    />

    <ToolGenerateDialog v-model="generateVisible" @generated="applyGeneratedDraft" />

    <ToolFormDialog
      v-model="formVisible"
      :mode="formMode"
      :row="editingTool"
      :draft="generatedDraft"
      :dict="dict"
      @saved="afterMutation"
    />
  </div>
</template>

<style scoped>
.ai-tools-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: auto;
}
</style>
