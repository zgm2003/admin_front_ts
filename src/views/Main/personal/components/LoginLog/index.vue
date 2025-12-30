<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {UsersLoginLogApi} from '@/api/system/usersLoginLog'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import {Monitor, Location, Key, Clock} from '@element-plus/icons-vue'

const props = defineProps<{
  userId: string | number
}>()

const {t} = useI18n()
const isMobile = useIsMobile()

const loading = ref(false)
const logList = ref<any[]>([])

const getList = () => {
  loading.value = true
  UsersLoginLogApi.list({page: 1, page_size: 5, user_id: props.userId}).then((data: any) => {
    logList.value = data.list || []
  }).finally(() => {
    loading.value = false
  })
}

onMounted(() => {
  getList()
})
</script>

<template>
  <div class="login-log-section">
    <div class="section-header">
      <span class="title">{{ t('personal.tabs.loginLog') }}</span>
      <span class="desc">{{ t('personal.log.recentLoginDesc') }}</span>
    </div>
    
    <!-- 移动端卡片布局 -->
    <template v-if="isMobile">
      <div v-loading="loading" class="card-list">
        <el-card v-for="(item, index) in logList" :key="index" shadow="never" class="log-card">
          <div class="card-row">
            <span class="label">{{ t('usersLoginLog.table.account') }}:</span>
            <span class="value">{{ item.login_account }}</span>
          </div>
          <div class="card-row">
            <span class="label">{{ t('usersLoginLog.table.loginType') }}:</span>
            <span class="value">{{ item.login_type_name }}</span>
          </div>
          <div class="card-row">
            <span class="label">{{ t('usersLoginLog.table.ip') }}:</span>
            <span class="value">{{ item.ip }}</span>
          </div>
          <div class="card-row">
            <span class="label">{{ t('usersLoginLog.table.platform') }}:</span>
            <span class="value">{{ item.platform }}</span>
          </div>
          <div class="card-row">
            <span class="label">{{ t('usersLoginLog.table.is_success') }}:</span>
            <el-tag :type="item.is_success === 1 ? 'success' : 'danger'" size="small">
              {{ item.is_success === 1 ? t('common.success.login') : t('common.fail.login') }}
            </el-tag>
          </div>
          <div class="card-row">
            <span class="label">{{ t('usersLoginLog.table.created_at') }}:</span>
            <span class="value time">{{ item.created_at }}</span>
          </div>
        </el-card>
        <el-empty v-if="!loading && logList.length === 0" :description="t('personal.log.noData')" />
      </div>
    </template>
    
    <!-- PC端卡片列表布局 -->
    <template v-else>
      <div v-loading="loading" class="log-list">
        <div v-for="(item, index) in logList" :key="index" class="log-item">
          <div class="log-main">
            <span class="account">{{ item.login_account }}</span>
            <el-tag :type="item.is_success === 1 ? 'success' : 'danger'" size="small">
              {{ item.is_success === 1 ? t('common.success.login') : t('common.fail.login') }}
            </el-tag>
          </div>
          <div class="log-meta">
            <span class="meta-item"><el-icon><Monitor/></el-icon>{{ item.platform }}</span>
            <span class="meta-item"><el-icon><Location/></el-icon>{{ item.ip }}</span>
            <span class="meta-item"><el-icon><Key/></el-icon>{{ item.login_type_name }}</span>
            <span class="meta-item time"><el-icon><Clock/></el-icon>{{ item.created_at }}</span>
          </div>
        </div>
        <el-empty v-if="!loading && logList.length === 0" :description="t('personal.log.noData')" />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.login-log-section {
  .section-header {
    margin-bottom: 16px;
    
    .title {
      font-size: 16px;
      font-weight: 500;
      margin-right: 10px;
    }
    
    .desc {
      color: #909399;
      font-size: 13px;
    }
  }

  .log-list {
    .log-item {
      padding: 12px 16px;
      border-radius: 8px;
      background: #fafafa;
      margin-bottom: 10px;
      transition: all 0.2s;
      
      &:hover {
        background: #f0f2f5;
      }
      
      .log-main {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
        
        .account {
          font-weight: 500;
          color: #303133;
        }
      }
      
      .log-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        
        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #909399;
          font-size: 13px;
          
          .el-icon {
            font-size: 14px;
          }
          
          &.time {
            color: #606266;
          }
        }
      }
    }
  }
  
  .card-list {
    .log-card {
      margin-bottom: 12px;
      
      .card-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .label {
          color: #909399;
          font-size: 13px;
        }
        
        .value {
          color: #303133;
          font-size: 13px;
          
          &.time {
            color: #606266;
          }
        }
      }
    }
  }
}
</style>
