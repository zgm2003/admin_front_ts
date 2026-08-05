<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiProviderModelItem } from '@/api/ai/providers'

const props = defineProps<{
  models: AiProviderModelItem[]
}>()
const { t } = useI18n()

const visibleLimit = 3
const enabledModels = computed(() => props.models.filter((model) => model.status === 1))
const visibleModels = computed(() => enabledModels.value.slice(0, visibleLimit))
const overflowModels = computed(() => enabledModels.value.slice(visibleLimit))

function modelLabel(model: AiProviderModelItem): string {
  return model.display_name || model.model_id
}

function modelKindLabel(model: AiProviderModelItem): string {
  return t(`aiProviders.modelKinds.${model.model_kind}`)
}
</script>

<template>
  <div
    v-if="enabledModels.length > 0"
    class="provider-model-list"
  >
    <el-tag
      v-for="model in visibleModels"
      :key="model.model_id"
      class="provider-model-list__tag"
      data-test="visible-provider-model"
      size="small"
      type="info"
    >
      <span class="provider-model-list__content">
        <span class="provider-model-list__kind">{{ modelKindLabel(model) }}</span>
        <span class="provider-model-list__label">{{ modelLabel(model) }}</span>
        <span
          v-if="model.display_name"
          class="provider-model-list__id"
        >{{ model.model_id }}</span>
      </span>
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
        <div class="provider-model-list__popover">
          <el-tag
            v-for="model in overflowModels"
            :key="model.model_id"
            class="provider-model-list__tag"
            data-test="overflow-provider-model"
            size="small"
            type="info"
          >
            <span class="provider-model-list__content">
              <span class="provider-model-list__kind">{{ modelKindLabel(model) }}</span>
              <span class="provider-model-list__label">{{ modelLabel(model) }}</span>
              <span
                v-if="model.display_name"
                class="provider-model-list__id"
              >{{ model.model_id }}</span>
            </span>
          </el-tag>
        </div>
      </el-scrollbar>
    </el-popover>
  </div>
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
  gap: 4px;
}

.provider-model-list__tag {
  min-width: 0;
  max-width: 300px;
}

.provider-model-list__content {
  display: flex;
  align-items: center;
  min-width: 0;
  max-width: 100%;
  gap: 6px;
}

.provider-model-list__kind,
.provider-model-list__label,
.provider-model-list__id {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-model-list__kind {
  flex: 0 0 auto;
  font-weight: 600;
}

.provider-model-list__label {
  max-width: 130px;
}

.provider-model-list__id {
  max-width: 90px;
  margin-left: 6px;
  opacity: 0.72;
}

.provider-model-list__overflow {
  flex: 0 0 auto;
  cursor: pointer;
}

.provider-model-list__popover {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
