<script setup lang="ts" generic="T extends LogStreamItem = LogStreamItem">
import { computed } from 'vue'
import {
  ElBacktop,
  ElButton,
  ElDivider,
  ElEmpty,
  ElIcon,
  ElScrollbar,
  ElSpace,
  ElText,
} from 'element-plus'
import type { ScrollbarDirection } from 'element-plus'
import { ArrowDown, Loading } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import type { LogStreamItem } from '../types'

const splitTimestamp = (value: string) => {
  const normalized = value.replace('T', ' ').trim()
  const [date = '', ...timeParts] = normalized.split(' ')

  return {
    date,
    time: timeParts.join(' '),
  }
}

const formatNativeDate = (value: string | number | Date) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date
}

const formatLogDateDivider = (value: string) => {
  if (!value) return '--'

  if (typeof value === 'string') {
    const { date } = splitTimestamp(value)
    if (date) return date
  }

  const date = formatNativeDate(value)
  if (!date) return '--'

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatLogTime = (value: string) => {
  if (!value) return '--:--:--'

  if (typeof value === 'string') {
    const { time } = splitTimestamp(value)
    if (time) return time
  }

  const date = formatNativeDate(value)
  if (!date) return '--:--:--'

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

const props = withDefaults(defineProps<{
  list: T[]
  loading?: boolean
  hasMore?: boolean
  showDateDivider?: boolean
  dateDividerFormatter?: (date: string) => string
  timeFormatter?: (date: string) => string
  emptyText?: string
  variant?: 'default' | 'audit'
  hideHeader?: boolean
}>(), {
  loading: false,
  hasMore: true,
  showDateDivider: true,
  variant: 'default',
  hideHeader: false,
})

const emit = defineEmits<{
  loadMore: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const slots = defineSlots<{
  'toolbar-left'?: () => unknown
  'toolbar-right'?: () => unknown
  'header-extra'?: (props: { item: T }) => unknown
  default?: (props: { item: T }) => unknown
}>()

const hasToolbar = computed(() => Boolean(slots['toolbar-left'] || slots['toolbar-right']))
const resolveDateDivider = (date: string) =>
  props.dateDividerFormatter?.(date) ?? formatLogDateDivider(date)
const resolveTime = (date: string) =>
  props.timeFormatter?.(date) ?? formatLogTime(date)

const groupedList = computed(() => {
  if (!props.showDateDivider) {
    return [{ date: null, items: props.list }]
  }

  const groups: Array<{ date: string | null; items: T[] }> = []
  let currentDate: string | null = null

  for (const item of props.list) {
    const itemDate = resolveDateDivider(item.created_at)
    if (itemDate !== currentDate) {
      currentDate = itemDate
      groups.push({ date: currentDate, items: [] })
    }

    const lastGroup = groups[groups.length - 1]
    if (lastGroup) {
      lastGroup.items.push(item)
    }
  }

  return groups
})

const handleEndReached = (direction: ScrollbarDirection) => {
  if (direction === 'bottom' && !props.loading && props.hasMore) {
    emit('loadMore')
  }
}
</script>

<template>
  <div class="log-stream" :class="{ 'is-audit': props.variant === 'audit' }">
    <div v-if="hasToolbar" class="log-stream-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left" />
      </div>
      <ElSpace class="toolbar-right" wrap>
        <slot name="toolbar-right" />
      </ElSpace>
    </div>

    <ElScrollbar class="log-stream-content" @end-reached="handleEndReached">
      <div v-if="!loading && list.length === 0" class="log-stream-empty">
        <ElEmpty :description="emptyText || t('common.noData')" />
      </div>

      <template v-else>
        <div v-for="(group, gIdx) in groupedList" :key="group.date || `group-${gIdx}`" class="log-group">
          <ElDivider v-if="group.date && showDateDivider" content-position="center">
            <ElText type="info" size="small">{{ group.date }}</ElText>
          </ElDivider>

          <div v-for="item in group.items" :key="item.id" class="log-item">
            <div class="log-timeline">
              <div class="timeline-dot" />
              <div class="timeline-line" />
            </div>

            <div class="log-content">
              <div v-if="!props.hideHeader" class="log-header">
                <span class="log-time">{{ resolveTime(item.created_at) }}</span>
                <slot name="header-extra" :item="item" />
              </div>

              <div class="log-body">
                <slot :item="item">
                  <pre class="log-default">{{ JSON.stringify(item, null, 2) }}</pre>
                </slot>
              </div>
            </div>
          </div>
        </div>

        <div class="log-stream-footer">
          <template v-if="loading">
            <ElIcon class="is-loading"><Loading /></ElIcon>
            <ElText type="info" size="small">{{ t('common.loading') }}</ElText>
          </template>
          <template v-else-if="hasMore">
            <ElButton text type="primary" @click="emit('loadMore')">
              <ElIcon><ArrowDown /></ElIcon>
              {{ t('common.loadMore') }}
            </ElButton>
          </template>
          <template v-else>
            <ElText type="info" size="small">{{ t('common.noMore') }}</ElText>
          </template>
        </div>
      </template>

      <ElBacktop
        v-if="!isMobile"
        target=".log-stream-content .el-scrollbar__wrap"
        :right="24"
        :bottom="24"
      />
    </ElScrollbar>
  </div>
</template>

<style scoped lang="scss">
.log-stream {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.log-stream-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 0;
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.toolbar-left {
  flex: 1 1 auto;
}

.toolbar-right {
  justify-content: flex-end;
}

.log-stream-content {
  flex: 1;
  min-height: 0;
  padding: 8px 0;
}

.log-stream-empty {
  padding: 20px 0 12px;
}

.log-group {
  margin-bottom: 8px;
}

.log-item {
  display: flex;
  padding: 0 16px;
}

.log-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.timeline-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
  flex-shrink: 0;
}

.timeline-line {
  width: 2px;
  flex: 1;
  margin-top: 4px;
  background: var(--el-border-color-lighter);
}

.log-item:last-child .timeline-line {
  display: none;
}

.log-content {
  flex: 1;
  min-width: 0;
  margin-left: 12px;
  padding-bottom: 16px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.log-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.log-default {
  margin: 0;
  padding: 10px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-stream-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
}

.log-stream.is-audit {
  .log-stream-toolbar {
    padding: 12px 16px 10px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    background: linear-gradient(180deg, var(--el-fill-color-extra-light), var(--el-bg-color));
  }

  .log-stream-content {
    padding: 8px 0 10px;
  }

  .log-item {
    padding: 0 14px;
  }

  .el-divider {
    margin: 8px 0 12px;
  }

  .timeline-dot {
    box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
  }

  .timeline-line {
    margin-top: 6px;
    background: linear-gradient(180deg, var(--el-color-primary-light-7), var(--el-border-color-extra-light));
  }

  .log-content {
    padding-bottom: 10px;
  }

  .log-stream-footer {
    padding: 18px 16px 14px;
  }
}

@media (max-width: 768px) {
  .log-stream {
    height: auto;
    min-height: auto;
    overflow: visible;
  }

  .log-stream-content {
    flex: none;
    min-height: auto;
    overflow: visible;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-start;
  }

  .log-item {
    padding: 0 8px;
  }

  .log-stream-content :deep(.el-scrollbar__wrap) {
    height: auto;
    overflow: visible;
  }

  .log-stream-content :deep(.el-scrollbar__view) {
    display: block;
  }

  .log-stream.is-audit .log-stream-toolbar {
    padding: 12px 12px 10px;
  }

  .log-stream.is-audit .log-item {
    padding: 0 10px;
  }
}

@media (max-width: 480px) {
  .log-stream-toolbar {
    gap: 10px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .log-item {
    padding: 0 6px;
  }

  .log-content {
    margin-left: 10px;
  }

  .log-stream.is-audit {
    .log-stream-toolbar {
      padding: 10px 10px 8px;
    }

    .log-item {
      padding: 0 8px;
    }

    .log-stream-footer {
      padding: 14px 10px 12px;
    }
  }
}
</style>
