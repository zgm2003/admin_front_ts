<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { OperationLogApi } from '@/api/devTools/operationLog'
import { UsersListApi } from '@/api/user/users'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { LogStream, useLogStream } from '@/components/LogStream'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { useCopy } from '@/hooks/useCopy'
import { CommonEnum } from '@/enums'
import { ElCard, ElButton, ElPopconfirm, ElMessage, ElIcon, ElSpace, ElText, ElAvatar, ElCollapse, ElCollapseItem } from 'element-plus'
import { SuccessFilled, CircleCloseFilled, DocumentCopy, Delete } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'

const userStore = useUserStore()
const { t } = useI18n()
const { copy } = useCopy()
const isMobile = useIsMobile()
const searchForm = ref({ user_id: '', action: '', date: '' })

const { list, loading, hasMore, loadInitial, loadMore, refresh } = useLogStream({
  api: OperationLogApi, searchForm, pageSize: 20
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'user_id', type: 'remote-select', label: t('operationLog.filter.userName'), fetchMethod: UsersListApi.list, labelField: (item: any) => `${item.username} (${item.email})`, valueField: 'id', placeholder: t('operationLog.filter.userName'), width: isMobile.value ? 200 : 220 },
  { key: 'action', type: 'input', label: t('operationLog.filter.action'), placeholder: t('operationLog.filter.action'), width: isMobile.value ? 180 : 200 },
  { key: 'date', type: 'date-range', label: t('operationLog.filter.date'), placeholder: t('operationLog.filter.date'), width: isMobile.value ? 260 : 300, props: { valueFormat: 'YYYY-MM-DD' } }
])

const handleDel = async (id: number | string) => {
  await OperationLogApi.del({ id: [id] })
  ElMessage.success(t('common.success.delete'))
  refresh()
}

const formatJson = (str: string) => {
  try { return str ? JSON.stringify(JSON.parse(str), null, 2) : '' }
  catch { return str }
}

onMounted(loadInitial)
</script>

<template>
  <div class="page">
    <Search v-model="searchForm" :fields="searchFields" @query="refresh" @reset="refresh" />
    <div class="stream">
      <LogStream :list="list" :loading="loading" :has-more="hasMore" @load-more="loadMore" @refresh="refresh">
        <template #default="{ item }">
          <ElCard shadow="hover" :body-style="{ padding: '12px 16px' }">
            <div class="row">
              <ElSpace :size="12" class="left">
                <ElAvatar :size="36" :style="{ background: 'var(--el-color-primary)' }">
                  {{ item.user_name?.[0]?.toUpperCase() || 'U' }}
                </ElAvatar>
                <div class="info">
                  <ElSpace :size="6">
                    <ElText tag="b">{{ item.user_name }}</ElText>
                    <ElIcon :size="14" :color="item.is_success === CommonEnum.YES ? 'var(--el-color-primary)' : 'var(--el-color-danger)'">
                      <SuccessFilled v-if="item.is_success === CommonEnum.YES" /><CircleCloseFilled v-else />
                    </ElIcon>
                  </ElSpace>
                  <ElText type="info" size="small">{{ item.user_email }}</ElText>
                </div>
              </ElSpace>
              <ElText class="center">{{ item.action }}</ElText>
              <ElPopconfirm v-if="userStore.can('devTools_operationLog_del')" :title="t('common.confirmDelete')" @confirm="handleDel(item.id)">
                <template #reference>
                  <ElButton type="danger" :icon="Delete" circle size="small" plain />
                </template>
              </ElPopconfirm>
            </div>
            <!-- 参数折叠 -->
            <ElCollapse v-if="item.request_data || item.response_data" class="params">
              <ElCollapseItem :title="t('operationLog.table.params')" name="params">
                <div class="panels" :class="{ mobile: isMobile }">
                  <div v-if="item.request_data" class="panel">
                    <div class="panel-head">
                      <ElText size="small" type="primary" tag="b">Request</ElText>
                      <ElButton :icon="DocumentCopy" size="small" text @click.stop="copy(formatJson(item.request_data))">{{ t('common.actions.copy') }}</ElButton>
                    </div>
                    <pre class="code">{{ formatJson(item.request_data) }}</pre>
                  </div>
                  <div v-if="item.response_data" class="panel">
                    <div class="panel-head">
                      <ElText size="small" type="success" tag="b">Response</ElText>
                      <ElButton :icon="DocumentCopy" size="small" text @click.stop="copy(formatJson(item.response_data))">{{ t('common.actions.copy') }}</ElButton>
                    </div>
                    <pre class="code">{{ formatJson(item.response_data) }}</pre>
                  </div>
                </div>
              </ElCollapseItem>
            </ElCollapse>
          </ElCard>
        </template>
      </LogStream>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; height: 100%; gap: 12px; }
.stream { flex: 1; min-height: 0; overflow: hidden; }
.row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.left { flex-shrink: 0; }
.info { display: flex; flex-direction: column; gap: 2px; }
.center { flex: 1; text-align: center; min-width: 100px; }

.params {
  margin-top: 10px;
  border: none;
  :deep(.el-collapse-item__header) { height: 32px; font-size: 12px; color: var(--el-text-color-secondary); background: transparent; border: none; padding: 0; }
  :deep(.el-collapse-item__wrap) { border: none; }
  :deep(.el-collapse-item__content) { padding: 8px 0 0; }
}

.panels {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  &.mobile { grid-template-columns: 1fr; }
}

.panel {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.panel-head {
  background: var(--el-fill-color);
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.code {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-regular);
  max-height: 260px;
  overflow-y: auto;
  line-height: 1.5;
}
</style>
