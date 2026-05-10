<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import type { AiKnowledgeBaseItem } from '@/api/ai/knowledge'

interface Props {
  row: AiKnowledgeBaseItem
  selected: boolean
}

interface Emits {
  select: [row: AiKnowledgeBaseItem]
  edit: [row: AiKnowledgeBaseItem]
  toggle: [row: AiKnowledgeBaseItem, status: number]
  remove: [row: AiKnowledgeBaseItem]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const statusType = computed(() => (props.row.status === CommonEnum.YES ? 'success' : 'danger'))

function selectRow() {
  emit('select', props.row)
}

function editRow() {
  emit('edit', props.row)
}

function toggleStatus(status: number) {
  emit('toggle', props.row, status)
}

function removeRow() {
  emit('remove', props.row)
}
</script>

<template>
  <button
    type="button"
    class="knowledge-base-card"
    :class="{ 'is-active': selected }"
    @click="selectRow"
  >
    <span class="knowledge-base-card__main">
      <span class="knowledge-base-card__top">
        <strong>{{ row.name }}</strong>
        <el-tag
          size="small"
          :type="statusType"
        >
          {{ row.status_name || row.status }}
        </el-tag>
      </span>
      <span class="knowledge-base-card__code">{{ row.code }}</span>
      <span class="knowledge-base-card__desc">
        {{ row.description || t('aiKnowledge.nav.noDescription') }}
      </span>
      <span class="knowledge-base-card__stats">
        <span>TopK {{ row.default_top_k }}</span>
        <span>{{ t('aiKnowledge.nav.minScore') }} {{ row.default_min_score }}</span>
        <span>{{ row.chunk_size_chars }}/{{ row.chunk_overlap_chars }}</span>
      </span>
    </span>
    <el-dropdown
      trigger="click"
      @click.stop
    >
      <el-button
        text
        class="knowledge-base-card__more"
        @click.stop
      >
        {{ t('aiKnowledge.nav.more') }}
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="editRow">
            {{ t('common.actions.edit') }}
          </el-dropdown-item>
          <el-dropdown-item
            v-if="row.status === CommonEnum.NO"
            @click="toggleStatus(CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-dropdown-item>
          <el-dropdown-item
            v-if="row.status === CommonEnum.YES"
            @click="toggleStatus(CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-dropdown-item>
          <el-dropdown-item
            divided
            @click="removeRow"
          >
            {{ t('common.actions.del') }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </button>
</template>

<style scoped>
.knowledge-base-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  width: 100%;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
}

.knowledge-base-card:hover,
.knowledge-base-card.is-active {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 8px 20px rgb(64 158 255 / 10%);
}

.knowledge-base-card__main {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.knowledge-base-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.knowledge-base-card__top strong,
.knowledge-base-card__code,
.knowledge-base-card__desc {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-base-card__top strong {
  min-width: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.knowledge-base-card__code {
  color: var(--el-color-primary);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.knowledge-base-card__desc {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-base-card__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.knowledge-base-card__stats span {
  padding: 2px 6px;
  border-radius: 999px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  font-size: 11px;
}

.knowledge-base-card__more {
  padding: 0;
  font-size: 12px;
}
</style>
