<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UsersLoginLogApi } from '@/api/user/usersLoginLog'
import { UsersListApi } from '@/api/user/users'
import { useI18n } from 'vue-i18n'
import { LogStream, useLogStream } from '@/components/LogStream'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum } from '@/enums'
import { ElSpace, ElText, ElIcon, ElCollapse, ElCollapseItem, ElTag } from 'element-plus'
import { SuccessFilled, CircleCloseFilled, ArrowRight, Monitor, Iphone } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'

const { t } = useI18n()
const isMobile = useIsMobile()
const platformArr = ref<any[]>([])
const loginTypeArr = ref<any[]>([])

const init = () => {
  UsersLoginLogApi.init().then((data: any) => {
    platformArr.value = data.dict.platformArr
    loginTypeArr.value = data.dict.login_type_arr
  }).catch(() => {})
}

const searchForm = ref({ user_id: '', login_account: '', login_type: '', ip: '', platform: '', is_success: '', date: '' })

const {
  list,
  loading,
  hasMore,
  loadInitial,
  loadMore,
  refresh
} = useLogStream({
  api: UsersLoginLogApi,
  searchForm,
  pageSize: 20
})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('usersLoginLog.filter.userName'),
    fetchMethod: UsersListApi.list,
    labelField: (item: any) => `${item.username} (${item.email})`,
    valueField: 'id',
    placeholder: t('usersLoginLog.filter.userName'),
    width: isMobile.value ? 200 : 220
  },
  { key: 'login_account', type: 'input', label: t('usersLoginLog.filter.account'), placeholder: t('usersLoginLog.filter.account'), width: isMobile.value ? 180 : 180 },
  { 
    key: 'login_type', 
    type: 'select-v2', 
    label: t('usersLoginLog.filter.loginType'), 
    placeholder: t('usersLoginLog.filter.loginType'), 
    width: isMobile.value ? 140 : 150,
    options: loginTypeArr.value
  },
  { key: 'ip', type: 'input', label: t('usersLoginLog.filter.ip'), placeholder: t('usersLoginLog.filter.ip'), width: isMobile.value ? 140 : 140 },
  {
    key: 'platform',
    type: 'select-v2',
    label: t('usersLoginLog.filter.platform'),
    options: platformArr.value,
    placeholder: t('usersLoginLog.filter.platform'),
    width: isMobile.value ? 140 : 140
  },
  {
    key: 'is_success',
    type: 'select-v2',
    label: t('usersLoginLog.filter.is_success'),
    options: [
      { label: t('common.success.login'), value: CommonEnum.YES },
      { label: t('common.fail.login'), value: CommonEnum.NO }
    ],
    placeholder: t('usersLoginLog.filter.is_success'),
    width: isMobile.value ? 120 : 120
  },
  {
    key: 'date',
    type: 'date-range',
    label: t('usersLoginLog.filter.date'),
    placeholder: t('usersLoginLog.filter.date'),
    width: isMobile.value ? 280 : 300,
    props: { valueFormat: 'YYYY-MM-DD' }
  }
])

const onSearch = () => {
  refresh()
}

const getPlatformIcon = (platform: string) => {
  // admin=PC, app/h5/mini=移动端
  if (['app', 'h5', 'mini'].includes(platform)) {
    return Iphone
  }
  return Monitor
}

onMounted(() => {
  init()
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
            <!-- 第一行：用户信息 | 登录方式 | 状态 -->
            <div class="log-row" :class="{ 'mobile-layout': isMobile }">
              <ElSpace class="log-left">
                <ElText tag="strong">{{ item.user_name }}</ElText>
                <ElText type="info" size="small">{{ item.login_account }}</ElText>
                <ElIcon :color="item.is_success === CommonEnum.YES ? 'var(--el-color-success)' : 'var(--el-color-danger)'" :size="14">
                  <SuccessFilled v-if="item.is_success === CommonEnum.YES" />
                  <CircleCloseFilled v-else />
                </ElIcon>
              </ElSpace>
              <ElSpace class="log-center" :size="12">
                <ElTag size="small">{{ item.login_type_name }}</ElTag>
                <ElSpace :size="4">
                  <ElIcon :size="14"><component :is="getPlatformIcon(item.platform)" /></ElIcon>
                  <ElText size="small">{{ item.platform }}</ElText>
                </ElSpace>
                <ElText type="info" size="small">{{ item.ip }}</ElText>
              </ElSpace>
              <ElTag v-if="item.is_success !== CommonEnum.YES" type="danger" size="small">{{
                item.reason || t('common.fail.login')
              }}</ElTag>
            </div>
            
            <!-- UA 折叠显示 -->
            <ElCollapse v-if="item.ua" class="log-params">
              <ElCollapseItem name="ua">
                <template #title>
                  <ElSpace :size="4">
                    <ElIcon><ArrowRight /></ElIcon>
                    <ElText type="info" size="small">User Agent</ElText>
                  </ElSpace>
                </template>
                <div class="ua-content">
                  <ElText size="small" type="info">{{ item.ua }}</ElText>
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

.log-row.mobile-layout {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.log-left {
  flex-shrink: 0;
}

.log-center {
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.log-center.mobile-layout {
  width: 100%;
  justify-content: flex-start;
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

.ua-content {
  background: var(--el-fill-color-lighter);
  border-radius: 6px;
  padding: 8px 12px;
  word-break: break-all;
}
</style>
