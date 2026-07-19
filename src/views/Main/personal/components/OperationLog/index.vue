<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Clock } from '@element-plus/icons-vue'
import { OperationLogApi } from '@/api/system/operationLog'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import type { OperationLogItem } from '@/types/operationLog'

const props = defineProps<{
  userId: number
}>()

const { t } = useI18n()
const isMobile = useIsMobile()

const loading = ref(false)
const logList = ref<OperationLogItem[]>([])

async function getList() {
  loading.value = true

  try {
    const response = await OperationLogApi.list({
      current_page: 1,
      page_size: 5,
      user_id: props.userId,
    })
    logList.value = response.list
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void getList()
})
</script>

<template>
  <div class="operation-log-section">
    <div class="section-header">
      <span class="title">{{ t('personal.tabs.operationLog') }}</span>
      <span class="desc">{{ t('personal.log.recentOperationDesc') }}</span>
    </div>

    <template v-if="isMobile">
      <div
        v-loading="loading"
        class="card-list"
      >
        <el-card
          v-for="item in logList"
          :key="item.id"
          shadow="never"
          class="log-card"
        >
          <div class="card-row">
            <span class="label">{{ t('operationLog.table.action') }}:</span>
            <span class="value">{{ item.action }}</span>
          </div>
          <div class="card-row">
            <span class="label">{{ t('operationLog.table.is_success') }}:</span>
            <el-tag
              :type="item.is_success === CommonEnum.YES ? 'success' : 'danger'"
              size="small"
            >
              {{ item.is_success === CommonEnum.YES ? t('common.success.operation') : t('common.fail.operation') }}
            </el-tag>
          </div>
          <div class="card-row">
            <span class="label">{{ t('operationLog.table.created_at') }}:</span>
            <span class="value time">{{ item.created_at }}</span>
          </div>
        </el-card>
        <el-empty
          v-if="!loading && logList.length === 0"
          :description="t('personal.log.noData')"
        />
      </div>
    </template>

    <template v-else>
      <div
        v-loading="loading"
        class="log-list"
      >
        <div
          v-for="item in logList"
          :key="item.id"
          class="log-item"
        >
          <div class="log-main">
            <span class="action">{{ item.action }}</span>
            <el-tag
              :type="item.is_success === CommonEnum.YES ? 'success' : 'danger'"
              size="small"
            >
              {{ item.is_success === CommonEnum.YES ? t('common.success.operation') : t('common.fail.operation') }}
            </el-tag>
          </div>
          <div class="log-meta">
            <span class="meta-item time">
              <el-icon><Clock /></el-icon>{{ item.created_at }}
            </span>
          </div>
        </div>
        <el-empty
          v-if="!loading && logList.length === 0"
          :description="t('personal.log.noData')"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.operation-log-section {
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

  .log-list .log-item {
    padding: 12px 16px;
    border-radius: 8px;
    background: #fafafa;
    margin-bottom: 10px;

    &:hover {
      background: #f0f2f5;
    }

    .log-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
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

        &.time {
          color: #606266;
        }
      }
    }
  }

  .card-list .log-card {
    margin-bottom: 12px;

    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }
  }
}
</style>
