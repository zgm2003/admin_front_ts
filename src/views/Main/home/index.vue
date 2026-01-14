<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { UserFilled, Setting, List, Tickets, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

const entries = computed(() => [
  { label: t('menu.userManager'), icon: UserFilled, path: '/userManager', color: 'var(--el-color-primary)', bg: 'var(--el-color-primary-light-9)' },
  { label: t('menu.role'), icon: Tickets, path: '/role', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
  { label: t('menu.permission'), icon: Setting, path: '/permission', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  { label: t('menu.operationLog'), icon: List, path: '/operationLog', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
])

const goTo = (path: string) => router.push(path)
const goToPersonal = () => router.push({ path: '/personal', query: { user_id: userStore.user_id } })
</script>

<template>
  <div class="home-page">
    <!-- 欢迎卡片 -->
    <div class="welcome-card">
      <div class="welcome-content">
        <el-avatar :src="userStore.avatar" :size="72" class="welcome-avatar" />
        <div>
          <h2 class="welcome-title">{{ t('common.welcomeBack') }}，{{ userStore.username }}</h2>
          <p class="welcome-subtitle">{{ t('menu.home') }} · {{ t('common.welcomeSubtitle') }}</p>
        </div>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" @click="goToPersonal">
          <el-icon><Setting /></el-icon>
          {{ t('menu.personal') }}
        </el-button>
      </div>
    </div>
    
    <!-- 快捷入口 -->
    <div class="section">
      <div class="section-header">
        <h3 class="section-title">{{ t('common.quickEntry') }}</h3>
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
  </div>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: var(--el-color-primary);
  border-radius: 12px;
  color: #fff;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

.welcome-avatar {
  border: 3px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.welcome-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 18px;
  }
}

.welcome-subtitle {
  font-size: 14px;
  opacity: 0.85;
  margin: 0;
}

.welcome-actions {
  .el-button {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }

  @media (max-width: 768px) {
    width: 100%;
    .el-button { width: 100%; }
  }
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1200px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 768px) { grid-template-columns: 1fr; }
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: all var(--transition-fast);
  
  &:hover {
    border-color: var(--primary-light);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    .quick-arrow { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 768px) { padding: 16px; }
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
}

.quick-label {
  font-size: 15px;
  font-weight: 500;
}

.quick-arrow {
  color: var(--text-muted);
  opacity: 0;
  transform: translateX(-8px);
  transition: all var(--transition-fast);
}
</style>
