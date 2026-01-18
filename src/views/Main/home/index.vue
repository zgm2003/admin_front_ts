<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { 
  UserFilled, Setting, List, Tickets, ArrowRight,
  TrendCharts, User, Document, Clock
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

// 统计数据
const stats = ref([
  { label: '总用户数', value: 0, icon: User, color: '#409EFF', trend: '+12%' },
  { label: '今日访问', value: 0, icon: TrendCharts, color: '#67C23A', trend: '+8%' },
  { label: '系统日志', value: 0, icon: Document, color: '#E6A23C', trend: '+5%' },
  { label: '在线用户', value: 0, icon: Clock, color: '#F56C6C', trend: '+3%' },
])

// 快捷入口
const entries = computed(() => [
  { label: t('menu.user_userManager'), icon: UserFilled, path: '/user/userManager', color: '#409EFF', bg: 'rgba(64, 158, 255, 0.1)' },
  { label: t('menu.permission_role'), icon: Tickets, path: '/permission/role', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
  { label: t('menu.permission_permission'), icon: Setting, path: '/permission/permission', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  { label: t('menu.system_operationLog'), icon: List, path: '/system/operationLog', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
])

// 最近活动（模拟数据）
const activities = ref([
  { user: '张三', action: '创建了新用户', time: '2 分钟前', type: 'success' },
  { user: '李四', action: '修改了角色权限', time: '15 分钟前', type: 'warning' },
  { user: '王五', action: '删除了系统日志', time: '1 小时前', type: 'danger' },
  { user: '赵六', action: '登录了系统', time: '2 小时前', type: 'info' },
])

const goTo = (path: string) => router.push(path)
const goToPersonal = () => router.push({ path: '/personal', query: { user_id: userStore.user_id } })

// 模拟加载数据
onMounted(() => {
  setTimeout(() => {
    stats.value[0].value = 1248
    stats.value[1].value = 856
    stats.value[2].value = 3421
    stats.value[3].value = 42
  }, 300)
})

// 格式化数字
const formatNumber = (num: number) => {
  return num.toLocaleString()
}
</script>

<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <el-avatar :src="userStore.avatar" :size="64" class="welcome-avatar" />
        <div class="welcome-text">
          <h2 class="welcome-title">{{ t('common.welcomeBack') }}，{{ userStore.username }}</h2>
          <p class="welcome-subtitle">{{ new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
        </div>
      </div>
      <el-button type="primary" size="large" @click="goToPersonal">
        <el-icon><Setting /></el-icon>
        <span>{{ t('menu.personal') }}</span>
      </el-button>
    </div>

    <!-- 数据统计卡片 -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
          <el-icon :size="28"><component :is="stat.icon" /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ formatNumber(stat.value) }}</div>
          <div class="stat-trend" :class="{ positive: stat.trend.startsWith('+') }">
            {{ stat.trend }}
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 快捷入口 -->
      <el-col :xs="24" :lg="16">
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">快捷入口</h3>
          </div>
          <div class="quick-grid">
            <div 
              v-for="entry in entries" 
              :key="entry.path" 
              class="quick-card"
              @click="goTo(entry.path)"
            >
              <div class="quick-icon" :style="{ backgroundColor: entry.bg, color: entry.color }">
                <el-icon :size="24"><component :is="entry.icon" /></el-icon>
              </div>
              <div class="quick-content">
                <span class="quick-label">{{ entry.label }}</span>
                <el-icon class="quick-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 最近活动 -->
      <el-col :xs="24" :lg="8">
        <div class="section-card">
          <div class="section-header">
            <h3 class="section-title">最近活动</h3>
          </div>
          <div class="activity-list">
            <div v-for="(activity, index) in activities" :key="index" class="activity-item">
              <el-tag :type="activity.type" size="small" class="activity-tag">
                {{ activity.user }}
              </el-tag>
              <div class="activity-content">
                <div class="activity-action">{{ activity.action }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px;
}

// 欢迎横幅
.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.25);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    padding: 24px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.welcome-avatar {
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.welcome-text {
  .welcome-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px;
    
    @media (max-width: 768px) {
      font-size: 20px;
    }
  }

  .welcome-subtitle {
    font-size: 14px;
    opacity: 0.9;
    margin: 0;
  }
}

.welcome-banner .el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  @media (max-width: 768px) {
    width: 100%;
  }
}

// 数据统计
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: all 0.3s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;

  .stat-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.2;
    margin-bottom: 4px;
  }

  .stat-trend {
    font-size: 12px;
    font-weight: 500;
    
    &.positive {
      color: #67C23A;
    }
  }
}

// 区块卡片
.section-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 24px;
  height: 100%;
}

.section-header {
  margin-bottom: 20px;

  .section-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--el-text-color-primary);
  }
}

// 快捷入口
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 768px) { 
    grid-template-columns: 1fr; 
  }
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
    
    .quick-arrow { 
      opacity: 1; 
      transform: translateX(0); 
    }
  }
}

.quick-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.quick-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .quick-label {
    font-size: 15px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .quick-arrow {
    color: var(--el-text-color-secondary);
    opacity: 0;
    transform: translateX(-8px);
    transition: all 0.3s;
  }
}

// 最近活动
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.activity-tag {
  flex-shrink: 0;
}

.activity-content {
  flex: 1;

  .activity-action {
    font-size: 14px;
    color: var(--el-text-color-primary);
    margin-bottom: 4px;
  }

  .activity-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}
</style>
