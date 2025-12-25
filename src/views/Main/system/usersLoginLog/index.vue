<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {UsersLoginLogApi} from '@/api/system/usersLoginLog'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import {useTable} from '@/hooks/useTable'

const {t} = useI18n()
const usernameArr = ref([])
const platformArr = ref([])
const loginTypeArr = ref([])

const init = () => {
  UsersLoginLogApi.init().then((data: any) => {
    usernameArr.value = data.dict.usernameArr;
    platformArr.value = data.dict.platformArr;
    loginTypeArr.value = data.dict.login_type_arr;
  }).catch(() => {
  })
}

const searchForm = ref({user_id: '', login_account: '', login_type: '', ip: '', platform: '', date: ''})

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList
} = useTable({
  api: UsersLoginLogApi.list,
  searchForm
})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'select-v2',
    label: t('usersLoginLog.filter.userName'),
    options: usernameArr.value,
    placeholder: t('usersLoginLog.filter.userName'),
    width: 200
  },
  { key: 'login_account', type: 'input', label: t('usersLoginLog.filter.account'), placeholder: t('usersLoginLog.filter.account'), width: 200 },
  { 
    key: 'login_type', 
    type: 'select-v2', 
    label: t('usersLoginLog.filter.loginType'), 
    placeholder: t('usersLoginLog.filter.loginType'), 
    width: 150,
    options: loginTypeArr.value
  },
  { key: 'ip', type: 'input', label: t('usersLoginLog.filter.ip'), placeholder: t('usersLoginLog.filter.ip'), width: 150 },
  {
    key: 'platform',
    type: 'select-v2',
    label: t('usersLoginLog.filter.platform'),
    options: platformArr.value,
    placeholder: t('usersLoginLog.filter.platform'),
    width: 150
  },
  {
    key: 'date',
    type: 'date-range',
    label: t('usersLoginLog.filter.date'),
    placeholder: t('usersLoginLog.filter.date'),
    width: 300,
    props: {valueFormat: 'YYYY-MM-DD'}
  }
])

onMounted(() => {
  init()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>
    <div class="table">
      <AppTable :columns="[
          { key: 'user_name', label: t('usersLoginLog.table.user_name') },
          { key: 'login_account', label: t('usersLoginLog.table.account') },
          { key: 'login_type_name', label: t('usersLoginLog.table.loginType') },
          { key: 'platform', label: t('usersLoginLog.table.platform') },
          { key: 'ip', label: t('usersLoginLog.table.ip') },
          { key: 'ua', label: t('usersLoginLog.table.ua'), showOverflowTooltip: true,width: 200},
          { key: 'success', label: t('usersLoginLog.table.is_success') },
          { key: 'reason', label: t('usersLoginLog.table.reason') },
          { key: 'created_at', label: t('usersLoginLog.table.created_at') }
        ]" :data="listData" :loading="listLoading" row-key="id" :pagination="page" :show-index="true"
                @refresh="refresh"
                @update:pagination="onPageChange">
        <template #cell-success="{ row }">
          <el-tag :type="row.success === 1 ? 'success' : 'danger'">{{
              row.success === 1 ? t('common.success.login') : t('common.fail.login')
            }}
          </el-tag>
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
</style>
