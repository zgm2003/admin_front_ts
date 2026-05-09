<script setup lang="ts">
import { computed } from 'vue'
import type { AiProviderModelItem } from '@/api/ai/engineConnections'

const props = defineProps<{
  models: AiProviderModelItem[]
}>()

const enabledModels = computed(() => props.models.filter((model) => model.status === 1))

function modelLabel(model: AiProviderModelItem): string {
  return model.display_name || model.model_id
}
</script>

<template>
  <div class="provider-model-list">
    <template v-if="enabledModels.length > 0">
      <el-tag
        v-for="model in enabledModels"
        :key="model.model_id"
        class="provider-model-list__tag"
        type="info"
      >
        {{ modelLabel(model) }}
        <span v-if="model.display_name" class="provider-model-list__id">{{ model.model_id }}</span>
      </el-tag>
    </template>
    <el-text v-else type="info">-</el-text>
  </div>
</template>

<style scoped>
.provider-model-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.provider-model-list__tag {
  max-width: 260px;
}

.provider-model-list__id {
  margin-left: 6px;
  opacity: 0.72;
}
</style>
