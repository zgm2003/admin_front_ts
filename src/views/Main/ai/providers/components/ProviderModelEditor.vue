<script setup lang="ts">
import { computed } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import type { AiProviderModelKind, AiProviderStatus } from '@/api/ai/providers'
import type { ProviderModelDraft } from '../composables/useProviderForm'

const models = defineModel<ProviderModelDraft[]>({ required: true })
const { t } = useI18n()

const columns = computed<TableColumn<ProviderModelDraft>[]>(() => [
  { prop: 'model_id', label: t('aiProviders.form.modelId'), minWidth: 240 },
  { prop: 'display_name', label: t('aiProviders.form.modelDisplayName'), minWidth: 200 },
  { prop: 'model_kind', label: t('aiProviders.form.modelKind'), width: 150 },
  { prop: 'status', label: t('aiProviders.form.modelStatus'), width: 100 },
  { key: 'actions', label: t('common.actions.action'), width: 72, fixed: 'right' },
])

const modelKindOptions = computed(() => [
  { label: t('aiProviders.modelKinds.chat'), value: 'chat' as const },
  { label: t('aiProviders.modelKinds.embedding'), value: 'embedding' as const },
  { label: t('aiProviders.modelKinds.rerank'), value: 'rerank' as const },
])

function updateRow<K extends keyof ProviderModelDraft>(
  index: number,
  key: K,
  value: ProviderModelDraft[K],
) {
  models.value = models.value.map((row, rowIndex) => (
    rowIndex === index ? { ...row, [key]: value } : row
  ))
}

function updateModelID(index: number, value: string) {
  updateRow(index, 'model_id', value)
}

function updateDisplayName(index: number, value: string) {
  updateRow(index, 'display_name', value)
}

function updateModelKind(index: number, value: AiProviderModelKind) {
  updateRow(index, 'model_kind', value)
}

function updateStatus(index: number, value: AiProviderStatus) {
  updateRow(index, 'status', value)
}

function addModel() {
  models.value = [...models.value, {
    model_id: '',
    model_kind: 'chat',
    display_name: '',
    status: 1,
  }]
}

function removeModel(index: number) {
  models.value = models.value.filter((_row, rowIndex) => rowIndex !== index)
}
</script>

<template>
  <div class="provider-model-editor">
    <AppTable
      :columns="columns"
      :data="models"
      :fixed-footer="false"
      :show-refresh="false"
      :show-column-setting="false"
    >
      <template #toolbar-right>
        <el-button
          type="primary"
          :icon="Plus"
          data-test="add-provider-model"
          @click="addModel"
        >
          {{ t('aiProviders.actions.addModel') }}
        </el-button>
      </template>
      <template #cell-model_id="{ row, index }">
        <el-input
          class="provider-model-editor__field"
          :model-value="row.model_id"
          :placeholder="t('aiProviders.form.modelIdPlaceholder')"
          @update:model-value="updateModelID(index, $event)"
        />
      </template>
      <template #cell-display_name="{ row, index }">
        <el-input
          class="provider-model-editor__field"
          :model-value="row.display_name"
          :placeholder="t('aiProviders.form.modelDisplayName')"
          @update:model-value="updateDisplayName(index, $event)"
        />
      </template>
      <template #cell-model_kind="{ row, index }">
        <el-select
          class="provider-model-editor__field"
          :model-value="row.model_kind"
          :options="modelKindOptions"
          @update:model-value="updateModelKind(index, $event)"
        >
          <el-option
            v-for="option in modelKindOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </template>
      <template #cell-status="{ row, index }">
        <el-switch
          :model-value="row.status"
          :active-value="1"
          :inactive-value="2"
          @update:model-value="updateStatus(index, $event)"
        />
      </template>
      <template #cell-actions="{ index }">
        <el-tooltip :content="t('aiProviders.actions.removeModel')">
          <el-button
            text
            type="danger"
            :icon="Delete"
            :aria-label="t('aiProviders.actions.removeModel')"
            data-test="remove-provider-model"
            @click="removeModel(index)"
          />
        </el-tooltip>
      </template>
    </AppTable>
  </div>
</template>

<style scoped>
.provider-model-editor,
.provider-model-editor__field {
  width: 100%;
}

.provider-model-editor {
  min-width: 0;
  overflow: hidden;
}
</style>
