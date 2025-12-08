<script setup lang="ts">
import {ref, computed} from 'vue'
import {delApi, listApi, initApi} from '@/api/system/logs'
import {ElNotification, ElMessageBox} from 'element-plus'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import { Search } from '@/components/Search'

const userStore = useUserStore()
const {t} = useI18n()
const usernameArr = ref([])
const emailArr = ref([])
const init = () => {
  initApi().then((data: any) => {
    usernameArr.value = data.dict.usernameArr;
    emailArr.value = data.dict.emailArr
  }).catch(() => {
  })
}
init()
const listLoading = ref(false)
const listData = ref([])
const searchForm = ref({user_id: '', action: '', date: ''})
const page = ref({current_page: 1, page_size: 20, total: 0})
const getList = () => {
  listLoading.value = true;
  const param: any = {...searchForm.value, page_size: page.value.page_size, current_page: page.value.current_page};
  listApi(param).then((data: any) => {
    listLoading.value = false;
    listData.value = data.list;
    page.value = data.page
  }).catch(() => {
    listLoading.value = false
  })
}
getList()
const onSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item: any) => item.id)
}
const refresh = () => {
  getList()
}
const onPageChange = (p: any) => {
  page.value = p;
  getList()
}
const searchFields = computed(() => [
  { key: 'user_id', type: 'select-v2', label: t('log.filter.userName'), options: usernameArr.value, placeholder: t('log.filter.userName'), width: 200 },
  { key: 'user_id', type: 'select-v2', label: t('log.filter.userEmail'), options: emailArr.value, placeholder: t('log.filter.userEmail'), width: 200 },
  { key: 'action', type: 'input', label: t('log.filter.action'), placeholder: t('log.filter.action'), width: 200 },
  { key: 'date', type: 'date-range', label: t('log.filter.date'), placeholder: t('log.filter.date'), width: 300, props: { valueFormat: 'YYYY-MM-DD' } }
])
const confirmDel = async (current: any) => {
  try {
    await ElMessageBox.confirm('确定要删除吗？此操作不可撤销', '二次确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const param = {id: current.id}
  delApi(param).then(() => {
    ElNotification.success({message: '删除成功'});
    getList();
    init()
  }).catch(() => {
  })
}
const selectedIds = ref([] as any[])
const batchDel = async () => {
  if (!selectedIds.value || selectedIds.value.length === 0) {
    ElNotification.error({message: '请至少选择一个记录'});
    return
  }
  try {
    await ElMessageBox.confirm('确定批量删除选中记录吗？此操作不可撤销', '二次确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const param = {id: selectedIds.value}
  delApi(param).then(() => {
    ElNotification.success({message: '删除成功'});
    getList()
  }).catch(() => {
  })
}
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="getList" @reset="getList" />
    <div class="table">
      <AppTable :columns="[
          { key: 'user_name', label: t('log.table.user_name') },
          { key: 'user_email', label: t('log.table.user_email') },
          { key: 'action', label: t('log.table.action') },
          { key: 'request_data', label: t('log.table.request_data') },
          { key: 'response_data', label: t('log.table.response_data') },
          { key: 'is_success', label: t('log.table.is_success') },
          { key: 'created_at', label: t('log.table.created_at') },
          { key: 'actions', label: t('common.actions.action'), width: 180 }
        ]" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable :show-index="true" @refresh="refresh"
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
                <el-dropdown-item @click="batchDel" v-if="userStore.can('log.del')">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-is_success="{ row }">
          <el-tag :type="row.is_success === 1 ? 'success' : 'danger'">{{
              row.is_success === 1 ? '成功' : '失败'
            }}
          </el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="danger" text v-if="userStore.can('log.del')" @click="confirmDel(row)">
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
