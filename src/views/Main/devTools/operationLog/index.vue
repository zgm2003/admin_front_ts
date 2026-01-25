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
import { ElButton, ElPopconfirm, ElMessage, ElIcon, ElCollapse, ElCollapseItem, ElSpace, ElText } from 'element-plus'
import { SuccessFilled, CircleCloseFilled, ArrowRight } from '@element-plus/icons-vue'

const userStore = useUserStore()
const { t } = useI18n()
const { copy } = useCopy()

const searchForm = ref({ user_id: '', action: '', date: '' })

const {
  list,
  loading,
  hasMore,
  loadInitial,
  loadMore,
  refresh
} = useLogStream({
  api: OperationLogApi,
  searchForm,
  pageSize: 20
})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('operationLog.filter.userName'),
    fetchMethod: UsersListApi.list,
    labelField: (item: any) => `${item.username} (${item.email})`,
    valueField: 'id',
    placeholder: t('operationLog.filter.userName'),
    width: 220
  },
  { key: 'action', type: 'input', label: t('operationLog.filter.action'), placeholder: t('operationLog.filter.action'), width: 200 },
  {
    key: 'date',
    type: 'date-range',
    label: t('operationLog.filter.date'),
    placeholder: t('operationLog.filter.date'),
    width: 300,
    props: { valueFormat: 'YYYY-MM-DD' }
  }
])

const onSearch = () => {
  refresh()
}

const handleDel = async (id: number | string) => {
  await OperationLogApi.del({ id: [id] })
  ElMessage.success(t('common.success.delete'))
  refresh()
}

const formatJson = (str: string) => {
  try {
    if (!str) return ''
    const obj = JSON.parse(str)
    return JSON.stringify(obj, null, 2)
  } catch (e) {
    return str
  }
}

onMounted(() => {
  loadInitial()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="stream-container">
      <LogStream
        :list="list"
        :loading="loading"
        :has-more="hasMore"
        @load-more="loadMore"
        @refresh="refresh"
      >
        <template #default="{ item }">
          <div class="log-item-content">
            <!-- 第一行：用户 | 操作 | 删除 -->
            <div class="log-row">
              <ElSpace class="log-left">
                <ElText tag="strong">{{ item.user_name }}</ElText>
                <ElText type="info" size="small">{{ item.user_email }}</ElText>
                <ElIcon :color="item.is_success === CommonEnum.YES ? 'var(--el-color-success)' : 'var(--el-color-danger)'" :size="14">
                  <SuccessFilled v-if="item.is_success === CommonEnum.YES" />
                  <CircleCloseFilled v-else />
                </ElIcon>
              </ElSpace>
              <ElText class="log-action">{{ item.action }}</ElText>
              <ElPopconfirm v-if="userStore.can('devTools_operationLog_del')" :title="t('common.confirmDelete')" @confirm="handleDel(item.id)">
                <template #reference>
                  <ElButton type="danger" text size="small">{{ t('common.actions.del') }}</ElButton>
                </template>
              </ElPopconfirm>
            </div>
            
            <!-- 参数折叠 -->
            <ElCollapse v-if="item.request_data || item.response_data" class="log-params">
              <ElCollapseItem name="params">
                <template #title>
                  <ElSpace :size="4">
                    <ElIcon><ArrowRight /></ElIcon>
                    <ElText type="info" size="small">{{ t('operationLog.table.params') }}</ElText>
                  </ElSpace>
                </template>
                <div class="params-grid">
                  <div v-if="item.request_data" class="param-item">
                    <div class="param-header">
                      <span>Request</span>
                      <ElButton type="primary" link size="small" @click.stop="copy(formatJson(item.request_data))">{{ t('common.actions.copy') }}</ElButton>
                    </div>
                    <pre class="param-code">{{ formatJson(item.request_data) }}</pre>
                  </div>
                  <div v-if="item.response_data" class="param-item">
                    <div class="param-header">
                      <span>Response</span>
                      <ElButton type="primary" link size="small" @click.stop="copy(formatJson(item.response_data))">{{ t('common.actions.copy') }}</ElButton>
                    </div>
                    <pre class="param-code">{{ formatJson(item.response_data) }}</pre>
                  </div>
                </div>
              </ElCollapseItem>
            </ElCollapse>
          </div>
        </template>
      </LogStream>
    </div>
  </div>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stream-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.log-item-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.log-left {
  flex-shrink: 0;
}

.log-action {
  flex: 1;
  min-width: 0;
  text-align: center;
  color: var(--el-text-color-regular);
}

.log-params {
  border: none;
  --el-collapse-header-height: 28px;
}

.log-params :deep(.el-collapse-item__header) {
  background: transparent;
  border: none;
  height: 28px;
  line-height: 28px;
  padding: 0;
}

.log-params :deep(.el-collapse-item__wrap) {
  border: none;
}

.log-params :deep(.el-collapse-item__content) {
  padding: 8px 0 0;
}

.log-params :deep(.el-collapse-item__arrow) {
  display: none;
}

.params-grid {
  display: grid;
  gap: 10px;
}

.param-item {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
}

.param-header {
  background: var(--el-fill-color);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.param-code {
  margin: 0;
  padding: 10px 12px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-regular);
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.5;
}

</style>
