<script setup lang="ts">
import {ref} from 'vue'
import {delApi, listApi, initApi} from '@/api/system/logs'
import {ElNotification, ElMessageBox} from 'element-plus'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'

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
    <el-form :inline="true" :model="searchForm">
      <el-form-item>
        <el-dropdown>
          <el-button type="primary">{{ t('common.actions.batchDelete') }}
            <el-icon class="el-icon--right">
              <arrow-right/>
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="batchDel" v-if="userStore.can('log.del')">{{
                  t('common.actions.batchDelete')
                }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-form-item>
      <el-form-item>
        <el-select-v2 v-model="searchForm.user_id" :options="usernameArr" style="width:200px" filterable clearable
                      :placeholder="t('log.filter.userName')"/>
      </el-form-item>
      <el-form-item>
        <el-select-v2 v-model="searchForm.user_id" :options="emailArr" style="width:200px" filterable clearable
                      :placeholder="t('log.filter.userEmail')"/>
      </el-form-item>
      <el-form-item>
        <el-input v-model="searchForm.action" :placeholder="t('log.filter.action')" clearable style="width:200px"/>
      </el-form-item>
      <el-form-item>
        <el-date-picker v-model="searchForm.date" type="daterange" range-separator="至" start-placeholder="开始日期"
                        end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width:300px" clearable/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">{{ t('common.actions.query') }}</el-button>
      </el-form-item>
    </el-form>
    <div class="table">
      <AppTable :columns="[
          { key: 'id', label: t('log.table.id'), width: 55 },
          { key: 'user_name', label: t('log.table.user_name') },
          { key: 'user_email', label: t('log.table.user_email') },
          { key: 'action', label: t('log.table.action') },
          { key: 'request_data', label: t('log.table.request_data') },
          { key: 'response_data', label: t('log.table.response_data') },
          { key: 'is_success', label: t('log.table.is_success') },
          { key: 'created_at', label: t('log.table.created_at') },
          { key: 'actions', label: t('common.actions.action'), width: 180 }
        ]" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable @refresh="refresh"
                @update:pagination="onPageChange" @selection-change="onSelectionChange">
        <template #cell-is_success="{ row }">
          <el-tag :type="row.is_success === 1 ? 'success' : 'danger'">{{
              row.is_success === 1 ? '成功' : '失败'
            }}
          </el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="danger" text v-if="userStore.can('role.del')" @click="confirmDel(row)">
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
