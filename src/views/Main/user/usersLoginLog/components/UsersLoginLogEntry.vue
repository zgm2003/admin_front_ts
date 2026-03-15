<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElIcon } from 'element-plus'
import {
  ArrowRight,
  Clock,
  Iphone,
  Key,
  Location,
  Monitor,
} from '@element-plus/icons-vue'
import { useAuditTimestamp } from '@/components/AuditStreamLayout'
import { CommonEnum } from '@/enums'

interface LoginLogEntryItem {
  id: number | string
  created_at?: string
  ip?: string
  is_success?: number
  login_account?: string
  login_type?: string
  login_type_name?: string
  platform?: string
  platform_name?: string
  reason?: string
  ua?: string
  user_name?: string
}

const props = defineProps<{
  item: LoginLogEntryItem
}>()

const { t } = useI18n()

const isSuccess = computed(() => props.item.is_success === CommonEnum.YES)

const accountLabel = computed(() => props.item.login_account || '--')
const userLabel = computed(() => props.item.user_name || '--')
const ipLabel = computed(() => props.item.ip || '--')
const loginTypeLabel = computed(
  () => props.item.login_type_name || props.item.login_type || '--'
)
const platformLabel = computed(
  () => props.item.platform_name || props.item.platform || '--'
)
const reasonLabel = computed(
  () => props.item.reason || t('common.fail.login')
)
const statusLabel = computed(() =>
  isSuccess.value ? t('common.success.login') : t('common.fail.login')
)
const signalTitle = computed(() =>
  isSuccess.value ? t('usersLoginLog.table.ua') : t('usersLoginLog.table.reason')
)
const summarySignal = computed(() =>
  isSuccess.value ? props.item.ua || '--' : reasonLabel.value
)
const shouldShowDetails = computed(() => Boolean(props.item.ua || !isSuccess.value))

const { createdAtParts } = useAuditTimestamp(() => props.item.created_at)

const deviceIcon = computed(() => {
  if (['app', 'h5', 'mini'].includes(props.item.platform || '')) return Iphone
  if (props.item.ua && /iPhone|iPad|Android|Mobile/i.test(props.item.ua)) return Iphone
  return Monitor
})
</script>

<template>
  <article class="entry-row" :class="{ 'is-failed': !isSuccess }">
    <div class="entry-row__grid">
      <div class="entry-cell">
        <span class="entry-cell__label">{{ t('usersLoginLog.table.created_at') }}</span>
        <div class="entry-time">
          <span class="entry-time__main">
            <ElIcon :size="14"><Clock /></ElIcon>
            {{ createdAtParts.time }}
          </span>
          <span v-if="createdAtParts.date" class="entry-time__sub">
            {{ createdAtParts.date }}
          </span>
        </div>
      </div>

      <div class="entry-cell">
        <span class="entry-cell__label">{{ t('usersLoginLog.table.account') }}</span>
        <div class="entry-identity">
          <span class="entry-account" :title="accountLabel">{{ accountLabel }}</span>
          <ElIcon class="entry-identity__arrow" :size="13"><ArrowRight /></ElIcon>
          <span class="entry-user" :title="userLabel">{{ userLabel }}</span>
        </div>
      </div>

      <div class="entry-cell">
        <span class="entry-cell__label">{{ t('usersLoginLog.table.is_success') }}</span>
        <div class="entry-pills">
          <span class="status-pill" :class="{ 'is-success': isSuccess, 'is-danger': !isSuccess }">
            {{ statusLabel }}
          </span>
          <span class="meta-pill">
            <ElIcon :size="13"><Key /></ElIcon>
            {{ loginTypeLabel }}
          </span>
        </div>
      </div>

      <div class="entry-cell">
        <span class="entry-cell__label">{{ t('usersLoginLog.table.platform') }}</span>
        <div class="entry-pills">
          <span class="meta-pill">
            <ElIcon :size="14"><component :is="deviceIcon" /></ElIcon>
            {{ platformLabel }}
          </span>
          <span class="meta-pill">
            <ElIcon :size="14"><Location /></ElIcon>
            {{ ipLabel }}
          </span>
        </div>
      </div>

      <div class="entry-cell entry-cell--signal">
        <span class="entry-cell__label">{{ signalTitle }}</span>
        <span class="entry-signal" :class="{ 'is-danger': !isSuccess }" :title="summarySignal">
          {{ summarySignal }}
        </span>
      </div>
    </div>

    <details v-if="shouldShowDetails" class="entry-details">
      <summary class="entry-details__summary">
        <span class="entry-details__summary-label">{{ t('common.actions.detail') }}</span>
        <span class="entry-details__summary-icon">+</span>
      </summary>

      <div class="entry-details__body">
        <div v-if="!isSuccess" class="entry-detail-card is-danger">
          <span class="entry-detail-card__label">{{ t('usersLoginLog.table.reason') }}</span>
          <span class="entry-detail-card__value">{{ reasonLabel }}</span>
        </div>

        <div v-if="item.ua" class="entry-detail-card">
          <span class="entry-detail-card__label">UA</span>
          <span class="entry-detail-card__value entry-detail-card__value--mono">
            {{ item.ua }}
          </span>
        </div>
      </div>
    </details>
  </article>
</template>

<style scoped lang="scss">
@use '@/components/AuditStreamLayout/src/audit-stream-entry' as audit;

@include audit.audit-entry-foundation;

.entry-row {
  --entry-grid-columns: 140px minmax(220px, 1.5fr) minmax(180px, 0.95fr) minmax(220px, 1.1fr) minmax(220px, 1.25fr);
  --entry-hover-shadow: rgba(2, 132, 199, 0.08);
}

.entry-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.entry-account,
.entry-user {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-account {
  @include audit.audit-mono-text(13px, 600, var(--el-text-color-primary));
}

.entry-user {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.entry-identity__arrow {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
}

.meta-pill .el-icon {
  color: var(--el-color-primary);
}

.entry-row.is-failed .meta-pill .el-icon {
  color: var(--el-color-danger);
}

.entry-detail-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.entry-detail-card.is-danger {
  border-color: var(--el-color-danger-light-7);
  background: var(--el-color-danger-light-9);
}

.entry-detail-card__value {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.entry-detail-card__value--mono {
  @include audit.audit-mono-text(12px, 400, var(--el-text-color-regular));
}

@media (max-width: 768px) {
  .entry-identity {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .entry-identity {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .entry-identity__arrow {
    display: none;
  }

  .entry-account,
  .entry-user {
    white-space: normal;
  }
}
</style>
