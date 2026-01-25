<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { UsersLoginLogApi } from '@/api/user/usersLoginLog'
import { UsersListApi } from '@/api/user/users'
import { useI18n } from 'vue-i18n'
import { LogStream, useLogStream } from '@/components/LogStream'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum } from '@/enums'
import { ElCard, ElSpace, ElText, ElIcon, ElAvatar, ElButton, ElDescriptions, ElDescriptionsItem } from 'element-plus'
import { SuccessFilled, CircleCloseFilled, Monitor, Iphone } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'

const { t } = useI18n()
const isMobile = useIsMobile()
const platformArr = ref<any[]>([])
const loginTypeArr = ref<any[]>([])
const searchForm = ref({ user_id: '', login_account: '', login_type: '', ip: '', platform: '', is_success: '', date: '' })

const { list, loading, hasMore, loadInitial, loadMore, refresh } = useLogStream({
  api: UsersLoginLogApi, searchForm, pageSize: 20
})

UsersLoginLogApi.init().then((data: any) => {
  platformArr.value = data.dict.platformArr
  loginTypeArr.value = data.dict.login_type_arr
}).catch(() => {})

const searchFields = computed<SearchField[]>(() => [
  { key: 'user_id', type: 'remote-select', label: t('usersLoginLog.filter.userName'), fetchMethod: UsersListApi.list, labelField: (item: any) => `${item.username} (${item.email})`, valueField: 'id', placeholder: t('usersLoginLog.filter.userName'), width: isMobile.value ? 200 : 220 },
  { key: 'login_account', type: 'input', label: t('usersLoginLog.filter.account'), placeholder: t('usersLoginLog.filter.account'), width: 180 },
  { key: 'login_type', type: 'select-v2', label: t('usersLoginLog.filter.loginType'), placeholder: t('usersLoginLog.filter.loginType'), width: isMobile.value ? 140 : 150, options: loginTypeArr.value },
  { key: 'ip', type: 'input', label: t('usersLoginLog.filter.ip'), placeholder: t('usersLoginLog.filter.ip'), width: 140 },
  { key: 'platform', type: 'select-v2', label: t('usersLoginLog.filter.platform'), options: platformArr.value, placeholder: t('usersLoginLog.filter.platform'), width: 140 },
  { key: 'is_success', type: 'select-v2', label: t('usersLoginLog.filter.is_success'), options: [{ label: t('common.success.login'), value: CommonEnum.YES }, { label: t('common.fail.login'), value: CommonEnum.NO }], placeholder: t('usersLoginLog.filter.is_success'), width: 120 },
  { key: 'date', type: 'date-range', label: t('usersLoginLog.filter.date'), placeholder: t('usersLoginLog.filter.date'), width: isMobile.value ? 280 : 300, props: { valueFormat: 'YYYY-MM-DD' } }
])

/** 根据平台和UA判断设备图标 */
const getDeviceIcon = (platform: string, ua?: string) => {
  if (['app', 'h5', 'mini'].includes(platform)) return Iphone
  if (ua && /iPhone|iPad|Android|Mobile/i.test(ua)) return Iphone
  return Monitor
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
            <ElSpace :size="12" wrap alignment="center">
              <ElAvatar :size="36" :style="{ background: `var(--el-color-${item.is_success === CommonEnum.YES ? 'primary' : 'danger'})` }">
                {{ item.user_name?.[0]?.toUpperCase() || 'U' }}
              </ElAvatar>
              <div class="info">
                <ElSpace :size="6">
                  <ElText tag="b">{{ item.user_name }}</ElText>
                  <ElIcon :size="14" :color="item.is_success === CommonEnum.YES ? 'var(--el-color-primary)' : 'var(--el-color-danger)'">
                    <SuccessFilled v-if="item.is_success === CommonEnum.YES" /><CircleCloseFilled v-else />
                  </ElIcon>
                </ElSpace>
                <ElText type="info" size="small">{{ item.login_account }}</ElText>
              </div>
              <ElSpace :size="8" wrap class="tags">
                <ElButton type="primary" size="small" round plain>{{ item.login_type_name }}</ElButton>
                <ElButton size="small" :icon="getDeviceIcon(item.platform, item.ua)" round plain>{{ item.platform }}</ElButton>
                <ElButton size="small" round plain>{{ item.ip }}</ElButton>
                <ElButton v-if="item.is_success !== CommonEnum.YES" type="danger" size="small" round plain>
                  {{ item.reason || t('common.fail.login') }}
                </ElButton>
              </ElSpace>
            </ElSpace>
            <ElDescriptions v-if="item.ua" :column="1" size="small" class="ua">
              <ElDescriptionsItem label="UA">{{ item.ua }}</ElDescriptionsItem>
            </ElDescriptions>
          </ElCard>
        </template>
      </LogStream>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page { display: flex; flex-direction: column; height: 100%; gap: 12px; }
.stream { flex: 1; min-height: 0; overflow: hidden; }
.info { display: flex; flex-direction: column; gap: 2px; }
.tags { flex: 1; }
.ua { margin-top: 10px; :deep(.el-descriptions__label) { width: 32px; } }
</style>
