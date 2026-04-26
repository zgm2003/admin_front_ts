<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElTag, ElText } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { UsersLoginLogApi } from '@/api/user/usersLoginLog'
import { UsersListApi } from '@/api/user/users'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import type { DictOption } from '@/types/common'
import type { UserListItem, UserLoginLogInitResponse, UserLoginType } from '@/types/user'
import { useUsersLoginLogTable, type UsersLoginLogSearchForm } from './composables/useUsersLoginLogTable'

const { t } = useI18n()
const isMobile = useIsMobile()

const platformArr = ref<DictOption<string>[]>([])
const loginTypeArr = ref<DictOption<UserLoginType>[]>([])
const searchForm = ref<UsersLoginLogSearchForm>({
  user_id: '',
  login_account: '',
  login_type: '' as UserLoginType | '',
  ip: '',
  platform: '',
  is_success: '' as number | '',
  date: [] as string[],
})

const {
  loading,
  data,
  page,
  onPageChange,
  refresh,
  getList,
  onSearch,
} = useUsersLoginLogTable(searchForm)

const init = async () => {
  const response: UserLoginLogInitResponse = await UsersLoginLogApi.init()
  platformArr.value = response.dict.platformArr
  loginTypeArr.value = response.dict.login_type_arr
}

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('usersLoginLog.filter.userName'),
    fetchMethod: UsersListApi.list,
    labelField: (item: UserListItem) => `${item.username} (${item.email})`,
    valueField: 'id',
    placeholder: t('usersLoginLog.filter.userName'),
    width: isMobile.value ? 200 : 220,
  },
  {
    key: 'login_account',
    type: 'input',
    label: t('usersLoginLog.filter.account'),
    placeholder: t('usersLoginLog.filter.account'),
    width: 180,
  },
  {
    key: 'login_type',
    type: 'select-v2',
    label: t('usersLoginLog.filter.loginType'),
    placeholder: t('usersLoginLog.filter.loginType'),
    options: loginTypeArr.value,
    width: 140,
  },
  {
    key: 'ip',
    type: 'input',
    label: t('usersLoginLog.filter.ip'),
    placeholder: t('usersLoginLog.filter.ip'),
    width: 150,
  },
  {
    key: 'platform',
    type: 'select-v2',
    label: t('usersLoginLog.filter.platform'),
    options: platformArr.value,
    placeholder: t('usersLoginLog.filter.platform'),
    width: 140,
  },
  {
    key: 'is_success',
    type: 'select-v2',
    label: t('usersLoginLog.filter.is_success'),
    options: [
      { value: CommonEnum.YES, label: t('common.success.login') },
      { value: CommonEnum.NO, label: t('common.fail.login') },
    ],
    placeholder: t('usersLoginLog.filter.is_success'),
    width: 140,
  },
  {
    key: 'date',
    type: 'date-range',
    label: t('usersLoginLog.filter.date'),
    placeholder: t('usersLoginLog.filter.date'),
    width: isMobile.value ? 260 : 300,
  },
])

const columns = computed(() => [
  { key: 'user_name', label: t('usersLoginLog.table.user_name'), width: 140 },
  { key: 'login_account', label: t('usersLoginLog.table.account'), minWidth: 180 },
  { key: 'login_type_name', label: t('usersLoginLog.table.loginType'), width: 130 },
  { key: 'platform_name', label: t('usersLoginLog.table.platform'), width: 130 },
  { key: 'ip', label: t('usersLoginLog.table.ip'), width: 150 },
  { key: 'is_success', label: t('usersLoginLog.table.is_success'), width: 110 },
  { key: 'reason', label: t('usersLoginLog.table.reason'), minWidth: 180 },
  { key: 'ua', label: t('usersLoginLog.table.ua'), minWidth: 260, overflowTooltip: true },
  { key: 'created_at', label: t('usersLoginLog.table.created_at'), width: 180 },
])

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="isMobile ? 2 : 6"
      @query="onSearch"
      @reset="onSearch"
    />

    <div class="table">
      <AppTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="page"
        row-key="id"
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #cell-is_success="{ row }">
          <ElTag :type="row.is_success === CommonEnum.YES ? 'success' : 'danger'" size="small">
            {{ row.is_success === CommonEnum.YES ? t('common.success.login') : t('common.fail.login') }}
          </ElTag>
        </template>

        <template #cell-reason="{ row }">
          <ElText truncated>{{ row.reason || '-' }}</ElText>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
