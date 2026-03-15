<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ElButton,
  ElIcon,
  ElPopconfirm,
} from 'element-plus'
import {
  Clock,
  Delete,
  DocumentCopy,
  User,
} from '@element-plus/icons-vue'
import { useAuditTimestamp } from '@/components/AuditStreamLayout'
import { useCopy } from '@/hooks/useCopy'
import { CommonEnum } from '@/enums'

interface OperationLogItem {
  id: number | string
  action?: string
  created_at?: string
  is_success?: number
  request_data?: string
  response_data?: string
  user_email?: string
  user_name?: string
}

const props = defineProps<{
  item: OperationLogItem
  canDelete?: boolean
}>()

const emit = defineEmits<{
  delete: [id: number | string]
}>()

const { t } = useI18n()
const { copy } = useCopy()

const isSuccess = computed(() => props.item.is_success === CommonEnum.YES)
const hasRequest = computed(() => Boolean(props.item.request_data))
const hasResponse = computed(() => Boolean(props.item.response_data))
const hasPayload = computed(() => hasRequest.value || hasResponse.value)

const statusLabel = computed(() =>
  isSuccess.value ? t('common.success.operation') : t('common.fail.operation')
)

const actionLabel = computed(() => props.item.action || '--')
const userNameLabel = computed(() => props.item.user_name || '--')
const userEmailLabel = computed(() => props.item.user_email || '--')

const { createdAtParts } = useAuditTimestamp(() => props.item.created_at)

const formatJson = (raw?: string) => {
  try {
    return raw ? JSON.stringify(JSON.parse(raw), null, 2) : ''
  } catch {
    return raw || ''
  }
}

const summarizePayload = (raw?: string) => {
  if (!raw) return t('operationLog.entry.payloadNone')

  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return t('operationLog.entry.items', { count: parsed.length })
    }

    if (parsed && typeof parsed === 'object') {
      return t('operationLog.entry.keys', {
        count: Object.keys(parsed as Record<string, unknown>).length,
      })
    }
  } catch {
    // Fall back to raw text preview.
  }

  const plain = raw.replace(/\s+/g, ' ').trim()
  return plain.length > 84 ? `${plain.slice(0, 84)}...` : plain
}

const payloadSignal = computed(() => {
  const parts: string[] = []
  if (hasRequest.value) {
    parts.push(`${t('operationLog.table.request_data')}: ${summarizePayload(props.item.request_data)}`)
  }
  if (hasResponse.value) {
    parts.push(`${t('operationLog.table.response_data')}: ${summarizePayload(props.item.response_data)}`)
  }
  return parts.join(' / ') || t('operationLog.entry.payloadNone')
})

const requestText = computed(() => formatJson(props.item.request_data))
const responseText = computed(() => formatJson(props.item.response_data))

const handleDelete = () => {
  emit('delete', props.item.id)
}
</script>

<template>
  <article class="entry-row" :class="{ 'is-failed': !isSuccess }">
    <div class="entry-row__grid">
      <div class="entry-cell">
        <span class="entry-cell__label">{{ t('operationLog.table.created_at') }}</span>
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
        <span class="entry-cell__label">{{ t('operationLog.table.action') }}</span>
        <span class="entry-action" :title="actionLabel">{{ actionLabel }}</span>
      </div>

      <div class="entry-cell">
        <span class="entry-cell__label">{{ t('operationLog.table.user_name') }}</span>
        <div class="entry-operator">
          <span class="entry-operator__name">
            <ElIcon :size="14"><User /></ElIcon>
            {{ userNameLabel }}
          </span>
          <span class="entry-operator__email" :title="userEmailLabel">{{ userEmailLabel }}</span>
        </div>
      </div>

      <div class="entry-cell">
        <span class="entry-cell__label">{{ t('operationLog.table.is_success') }}</span>
        <div class="entry-actions">
          <span class="status-pill" :class="{ 'is-success': isSuccess, 'is-danger': !isSuccess }">
            {{ statusLabel }}
          </span>
          <ElPopconfirm
            v-if="canDelete"
            :title="t('common.confirmDelete')"
            @confirm="handleDelete"
          >
            <template #reference>
              <ElButton text type="danger" :icon="Delete" class="entry-delete">
                {{ t('common.actions.del') }}
              </ElButton>
            </template>
          </ElPopconfirm>
        </div>
      </div>

      <div class="entry-cell entry-cell--signal">
        <span class="entry-cell__label">{{ t('operationLog.table.params') }}</span>
        <span class="entry-signal" :title="payloadSignal">{{ payloadSignal }}</span>
      </div>
    </div>

    <details v-if="hasPayload" class="entry-details">
      <summary class="entry-details__summary">
        <span class="entry-details__summary-label">{{ t('common.actions.detail') }}</span>
        <span class="entry-details__summary-icon">+</span>
      </summary>

      <div class="entry-details__body">
        <section v-if="hasRequest" class="payload-panel">
          <div class="payload-panel__header">
            <span class="payload-panel__title">{{ t('operationLog.table.request_data') }}</span>
            <ElButton
              text
              size="small"
              :icon="DocumentCopy"
              @click.stop="copy(requestText)"
            >
              {{ t('common.actions.copy') }}
            </ElButton>
          </div>
          <pre class="payload-panel__code">{{ requestText }}</pre>
        </section>

        <section v-if="hasResponse" class="payload-panel is-response">
          <div class="payload-panel__header">
            <span class="payload-panel__title">{{ t('operationLog.table.response_data') }}</span>
            <ElButton
              text
              size="small"
              :icon="DocumentCopy"
              @click.stop="copy(responseText)"
            >
              {{ t('common.actions.copy') }}
            </ElButton>
          </div>
          <pre class="payload-panel__code">{{ responseText }}</pre>
        </section>
      </div>
    </details>
  </article>
</template>

<style scoped lang="scss">
@use '@/components/AuditStreamLayout/src/audit-stream-entry' as audit;

@include audit.audit-entry-foundation;

.entry-row {
  --entry-grid-columns: 140px minmax(220px, 1.4fr) minmax(220px, 1.25fr) minmax(180px, 0.95fr) minmax(240px, 1.3fr);
}

.entry-action {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.entry-operator {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.entry-operator__name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.entry-operator__email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.entry-delete {
  min-height: 28px;
  padding: 0 6px;
}

.payload-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light);
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}

.payload-panel.is-response {
  border-color: var(--el-color-success-light-7);
}

.payload-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  background: var(--el-fill-color);
}

.payload-panel__code {
  margin: 0;
  padding: 12px;
  max-height: 260px;
  overflow: auto;
  @include audit.audit-mono-text(12px, 400, var(--el-text-color-regular));
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  .entry-operator__email {
    white-space: normal;
    word-break: break-word;
  }

  .entry-signal {
    display: block;
  }
}

@media (max-width: 480px) {
  .payload-panel__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
