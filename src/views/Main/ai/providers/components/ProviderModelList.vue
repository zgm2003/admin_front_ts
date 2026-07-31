<script setup lang="ts">
import { computed } from 'vue'
import type { AiProviderModelItem } from '@/api/ai/providers'

const props = defineProps<{
  models: AiProviderModelItem[]
}>()

const visibleLimit = 3
const enabledModels = computed(() => props.models.filter((model) => model.status === 1))
const visibleModels = computed(() => enabledModels.value.slice(0, visibleLimit))
const overflowModels = computed(() => enabledModels.value.slice(visibleLimit))

function modelLabel(model: AiProviderModelItem): string {
  return model.display_name || model.model_id
}
</script>

<template>
  <el-space
    v-if="enabledModels.length > 0"
    class="provider-model-list"
    :size="4"
  >
    <el-tag
      v-for="model in visibleModels"
      :key="model.model_id"
      class="provider-model-list__tag"
      data-test="visible-provider-model"
      size="small"
      type="info"
    >
      <span class="provider-model-list__label">{{ modelLabel(model) }}</span>
      <span
        v-if="model.display_name"
        class="provider-model-list__id"
      >{{ model.model_id }}</span>
    </el-tag>
    <el-popover
      v-if="overflowModels.length > 0"
      :trigger="['hover', 'focus']"
      :persistent="false"
      :teleported="true"
      :enterable="true"
      placement="top"
      :width="320"
      :popper-style="{ maxWidth: 'calc(100vw - 32px)' }"
    >
      <template #reference>
        <el-tag
          class="provider-model-list__overflow"
          data-test="provider-model-overflow"
          size="small"
          type="info"
          tabindex="0"
        >
          +{{ overflowModels.length }}
        </el-tag>
      </template>
      <el-scrollbar max-height="240px">
        <el-space
          wrap
          :size="4"
        >
          <el-tag
            v-for="model in overflowModels"
            :key="model.model_id"
            class="provider-model-list__tag"
            data-test="overflow-provider-model"
            size="small"
            type="info"
          >
            <span class="provider-model-list__label">{{ modelLabel(model) }}</span>
            <span
              v-if="model.display_name"
              class="provider-model-list__id"
            >{{ model.model_id }}</span>
          </el-tag>
        </el-space>
      </el-scrollbar>
    </el-popover>
  </el-space>
  <el-text
    v-else
    type="info"
  >
    -
  </el-text>
</template>

<style scoped>
.provider-model-list {
  display: flex;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  vertical-align: middle;
}

.provider-model-list :deep(.el-space__item) {
  min-width: 0;
  max-width: 100%;
}

.provider-model-list__tag {
  min-width: 0;
  max-width: 260px;
}

.provider-model-list__tag :deep(.el-tag__content) {
  display: flex;
  min-width: 0;
  max-width: 100%;
}

.provider-model-list__label,
.provider-model-list__id {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-model-list__label {
  max-width: 150px;
}

.provider-model-list__id {
  max-width: 90px;
  margin-left: 6px;
  opacity: 0.72;
}

.provider-model-list__overflow {
  cursor: pointer;
}
</style>
