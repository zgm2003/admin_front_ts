<script setup lang="ts">
import { computed } from 'vue'
import { ElButton, ElEmpty, ElIcon, ElScrollbar, ElDivider, ElSpace, ElText, ElBacktop } from 'element-plus'
import type { ScrollbarDirection } from 'element-plus'
import { Loading, ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { LogStreamItem } from '../types'

const props = withDefaults(defineProps<{
  /** 日志数据列表 */
  list: LogStreamItem[]
  /** 是否加载中 */
  loading?: boolean
  /** 是否还有更多 */
  hasMore?: boolean
  /** 是否显示日期分割线 */
  showDateDivider?: boolean
  /** 日期格式化（分割线显示） */
  dateDividerFormatter?: (date: string) => string
  /** 时间格式化（条目显示） */
  timeFormatter?: (date: string) => string
  /** 空状态文案 */
  emptyText?: string
}>(), {
  loading: false,
  hasMore: true,
  showDateDivider: true,
  dateDividerFormatter: (date: string) => {
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  },
  timeFormatter: (date: string) => {
    const d = new Date(date)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }
})

const emit = defineEmits<{
  loadMore: []
}>()

const { t } = useI18n()

/** 按日期分组 */
const groupedList = computed(() => {
  if (!props.showDateDivider) {
    return [{ date: null, items: props.list }]
  }
  
  const groups: { date: string | null; items: LogStreamItem[] }[] = []
  let currentDate: string | null = null
  
  for (const item of props.list) {
    const itemDate = props.dateDividerFormatter(item.created_at)
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

/** 滚动到底部触发加载更多 */
const handleEndReached = (direction: ScrollbarDirection) => {
  if (direction === 'bottom' && !props.loading && props.hasMore) {
    emit('loadMore')
  }
}
</script>

<template>
  <div class="log-stream">
    <!-- 工具栏 -->
    <div class="log-stream-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left" />
      </div>
      <ElSpace class="toolbar-right">
        <slot name="toolbar-right" />
      </ElSpace>
    </div>

    <!-- 内容区 -->
    <ElScrollbar class="log-stream-content" @end-reached="handleEndReached">
      <!-- 空状态 -->
      <ElEmpty v-if="!loading && list.length === 0" :description="emptyText || t('common.noData')" />

      <!-- 日志列表 -->
      <template v-else>
        <div v-for="(group, gIdx) in groupedList" :key="gIdx" class="log-group">
          <!-- 日期分割线 -->
          <ElDivider v-if="group.date && showDateDivider" content-position="center">
            <ElText type="info" size="small">{{ group.date }}</ElText>
          </ElDivider>

          <!-- 日志条目 -->
          <div v-for="item in group.items" :key="item.id" class="log-item">
            <div class="log-timeline">
              <div class="timeline-dot" />
              <div class="timeline-line" />
            </div>
            <div class="log-content">
              <div class="log-header">
                <span class="log-time">{{ timeFormatter(item.created_at) }}</span>
                <slot name="header-extra" :item="item" />
              </div>
              <div class="log-body">
                <slot :item="item">
                  <!-- 默认渲染 -->
                  <pre class="log-default">{{ JSON.stringify(item, null, 2) }}</pre>
                </slot>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载更多 / 底部状态 -->
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
      <!-- 回到顶部 -->
      <ElBacktop target=".log-stream-content .el-scrollbar__wrap" :right="24" :bottom="24" />
    </ElScrollbar>
  </div>
</template>

<style scoped>
.log-stream {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.log-stream-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  flex-shrink: 0;
}

.log-stream-content {
  flex: 1;
  padding: 8px 0;
}

.log-group {
  margin-bottom: 8px;
}

/* 日志条目 */
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
  background: var(--el-border-color-lighter);
  margin-top: 4px;
}

.log-item:last-child .timeline-line {
  display: none;
}

.log-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
  margin-left: 12px;
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

.log-body {
  /* background: var(--el-fill-color-lighter); */
  border-radius: 8px;
  /* padding: 12px; */
}

.log-default {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 底部状态 */
.log-stream-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

@media (max-width: 768px) {
  .log-item { padding: 0 8px; }
  .log-body { padding: 8px; }
}
</style>
