<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LogStream } from '@/components/LogStream'
import type { LogStreamItem } from '@/components/LogStream'
import { useIsMobile } from '@/hooks/useResponsive'

export interface AuditStreamStat {
  key: string
  tone: 'primary' | 'success' | 'danger' | 'warning'
  label: string
  value: number | string
}

const props = defineProps<{
  title: string
  eyebrow: string
  description: string
  stats: AuditStreamStat[]
  filterTitle: string
  filterHint: string
  filterActive?: boolean
  timelineTitle: string
  timelineHint: string
  list: LogStreamItem[]
  loading?: boolean
  hasMore?: boolean
  emptyText?: string
}>()

const emit = defineEmits<{
  loadMore: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const slots = useSlots()
const statsExpanded = ref(false)

const hasHeaderTags = computed(() => Boolean(slots['header-tags']))
const hasFilterMeta = computed(() => Boolean(slots['filter-meta']))
const hasToolbarRight = computed(() => Boolean(slots['toolbar-right']))
const shouldShowStatsToggle = computed(() => isMobile.value && props.stats.length > 0)
const shouldShowStats = computed(() => !isMobile.value || statsExpanded.value)
const statsToggleLabel = computed(() =>
  statsExpanded.value ? t('common.actions.collapse') : t('common.actions.expand')
)

watch(isMobile, (mobile) => {
  statsExpanded.value = !mobile
}, { immediate: true })
</script>

<template>
  <div class="audit-layout">
    <section class="page-header">
      <div class="page-header__main">
        <div class="page-header__title-row">
          <div class="page-header__copy">
            <span class="page-header__eyebrow">{{ eyebrow }}</span>
            <h1 class="page-header__title">{{ title }}</h1>
          </div>
          <div v-if="hasHeaderTags" class="page-header__tags">
            <slot name="header-tags" />
          </div>
        </div>
        <p class="page-header__description">{{ description }}</p>
      </div>

      <button
        v-if="shouldShowStatsToggle"
        type="button"
        class="stats-toggle"
        @click="statsExpanded = !statsExpanded"
      >
        {{ statsToggleLabel }}
      </button>

      <div v-show="shouldShowStats" class="page-header__stats">
        <div
          v-for="stat in stats"
          :key="stat.key"
          class="stat-pill"
          :class="`is-${stat.tone}`"
        >
          <span class="stat-pill__label">{{ stat.label }}</span>
          <strong class="stat-pill__value">{{ stat.value }}</strong>
        </div>
      </div>
    </section>

    <section class="filter-panel" :class="{ 'has-active-filters': filterActive }">
      <div class="filter-panel__header">
        <div class="filter-panel__copy">
          <span class="filter-panel__title">{{ filterTitle }}</span>
          <span class="filter-panel__hint">{{ filterHint }}</span>
        </div>
        <div v-if="hasFilterMeta" class="filter-panel__meta">
          <slot name="filter-meta" />
        </div>
      </div>

      <div class="filter-panel__body">
        <slot name="search" />
      </div>
    </section>

    <div class="stream">
      <div class="stream-shell">
        <LogStream
          :list="list"
          :loading="loading"
          :has-more="hasMore"
          :empty-text="emptyText"
          variant="audit"
          hide-header
          @load-more="emit('loadMore')"
        >
          <template #toolbar-left>
            <div class="stream-heading">
              <span class="stream-heading__title">{{ timelineTitle }}</span>
              <span class="stream-heading__hint">{{ timelineHint }}</span>
            </div>
          </template>

          <template v-if="hasToolbarRight" #toolbar-right>
            <div class="stream-toolbar-meta">
              <slot name="toolbar-right" />
            </div>
          </template>

          <template #default="{ item }">
            <slot :item="item" />
          </template>
        </LogStream>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.audit-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-extra-light));
}

.page-header__main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.page-header__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header__copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-header__eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--el-color-primary);
}

.page-header__title {
  margin: 0;
  font-size: 28px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.page-header__description {
  max-width: 78ch;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.page-header__tags {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.page-header__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(110px, 1fr));
  gap: 10px;
}

.stats-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-fill-color-extra-light);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.stats-toggle:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.stat-pill {
  position: relative;
  min-width: 0;
  padding: 10px 14px 10px 16px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 12px;
  background: var(--el-fill-color-extra-light);
  overflow: hidden;
}

.stat-pill::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: var(--stat-color);
}

.stat-pill__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.stat-pill__value {
  display: block;
  font-size: 22px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.stat-pill.is-primary {
  --stat-color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}

.stat-pill.is-success {
  --stat-color: var(--el-color-success);
  border-color: var(--el-color-success-light-7);
}

.stat-pill.is-danger {
  --stat-color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-7);
}

.stat-pill.is-warning {
  --stat-color: var(--el-color-warning);
  border-color: var(--el-color-warning-light-7);
}

.filter-panel {
  padding: 14px 16px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: linear-gradient(180deg, var(--el-bg-color), var(--el-fill-color-blank));
}

.filter-panel.has-active-filters {
  border-color: var(--el-color-primary-light-7);
  box-shadow: inset 0 1px 0 var(--el-color-primary-light-9);
}

.filter-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.filter-panel__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.filter-panel__hint,
.stream-heading__hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.filter-panel__meta,
.stream-toolbar-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-panel__body :deep(.el-form-item) {
  margin-bottom: 10px;
}

.filter-panel__body :deep(.el-form-item__label) {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.stream {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.stream-shell {
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
}

.stream-heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stream-heading__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@media (max-width: 1100px) {
  .page-header__stats {
    width: 100%;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .audit-layout {
    height: auto;
    min-height: 100%;
  }

  .page-header,
  .filter-panel,
  .stream-shell {
    border-radius: 14px;
  }

  .page-header {
    padding: 16px;
  }

  .page-header__title {
    font-size: 24px;
  }

  .page-header__stats {
    width: 100%;
  }

  .stats-toggle {
    width: 100%;
  }

  .filter-panel {
    padding: 12px 12px 4px;
  }

  .stream {
    flex: none;
    overflow: visible;
  }

  .stream-shell {
    height: auto;
    overflow: visible;
  }
}

@media (max-width: 560px) {
  .page-header__stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .audit-layout {
    gap: 10px;
  }

  .page-header {
    padding: 14px;
    gap: 12px;
  }

  .page-header__title {
    font-size: 21px;
    line-height: 1.1;
  }

  .page-header__description {
    font-size: 12px;
  }

  .page-header__tags,
  .filter-panel__meta,
  .stream-toolbar-meta {
    width: 100%;
    justify-content: flex-start;
  }

  .stats-toggle {
    min-height: 30px;
  }

  .stat-pill {
    padding: 10px 12px 10px 14px;
  }

  .filter-panel {
    padding: 12px 10px 4px;
  }

  .stream-shell {
    border-radius: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stats-toggle {
    transition: none;
  }
}
</style>
