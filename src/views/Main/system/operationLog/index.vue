<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {OperationLogApi} from '@/api/system/logs'
import {UsersListApi} from '@/api/user/users'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import {ArrowRight} from "@element-plus/icons-vue";
import type { SearchField } from '@/components/Search/types'
import {useTable} from '@/hooks/useTable'
import { CommonEnum } from '@/enums'

const userStore = useUserStore()
const {t} = useI18n()

const searchForm = ref({user_id: '', action: '', date: ''})

const {
  loading: listLoading,
  data: listData,
  page,
  selectedIds,
  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel
} = useTable({
  api: OperationLogApi,
  searchForm
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
    props: {valueFormat: 'YYYY-MM-DD'}
  }
])
onMounted(() => {
  getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>
    <div class="table">
      <AppTable :columns="[
          { key: 'user_name', label: t('operationLog.table.user_name') },
          { key: 'user_email', label: t('operationLog.table.user_email') },
          { key: 'action', label: t('operationLog.table.action') },
          { key: 'request_data', label: t('operationLog.table.request_data'),width:200 },
          { key: 'response_data', label: t('operationLog.table.response_data'),width:200 },
          { key: 'is_success', label: t('operationLog.table.is_success') },
          { key: 'created_at', label: t('operationLog.table.created_at') },
          { key: 'actions', label: t('common.actions.action'), width: 180 }
        ]" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable :show-index="true"
                @refresh="refresh"
                @update:pagination="onPageChange" @selection-change="onSelectionChange">
        <template #toolbar-left>
          <el-dropdown>
            <el-button type="primary">{{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <arrow-right/>
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('operationLog.del')">{{
                    t('common.actions.batchDelete')
                  }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-is_success="{ row }">
          <el-tag :type="row.is_success === CommonEnum.YES ? 'success' : 'danger'">{{
              row.is_success === CommonEnum.YES ? t('common.success.operation') : 'Failed'
            }}
          </el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="danger" text v-if="userStore.can('operationLog.del')" @click="confirmDel(row)">
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto
}

.fenye {
  flex: 0 0 auto;
  margin-left: 30%;
  margin-top: 10px
}
</style>
