<script setup lang="ts">
import {computed} from 'vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {UserFilled, Setting, List, Tickets} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const {t} = useI18n()
const entries = computed(() => [
  {label: t('menu.userManager'), icon: UserFilled, path: '/userManager', color: '#409EFF'},
  {label: t('menu.role'), icon: Tickets, path: '/role', color: '#67C23A'},
  {label: t('menu.permission'), icon: Setting, path: '/permission', color: '#E6A23C'},
  {label: t('menu.systemLog'), icon: List, path: '/logs', color: '#F56C6C'},
])
const goTo = (p: any) => router.push(p)
const gotToPersonal = () => router.push({name: 'personal', query: {user_id: userStore.user_id}})
</script>
<template>
  <div class="home">
    <el-row :gutter="16">
      <el-col :span="24">
        <el-card shadow="never">
          <template #header>
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:16px;font-weight:700;">{{ t('menu.home') }}</span>
            </div>
          </template>
          <div class="hero">
            <el-avatar :src="userStore.avatar" :size="64"/>
            <div class="hero-text">
              <div class="title">{{ t('menu.home') }}</div>
              <div class="subtitle">{{ userStore.username }}</div>
            </div>
            <div class="hero-actions">
              <el-button type="primary" @click="gotToPersonal">{{ t('common.actions.edit') }}</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    <el-card shadow="never">
      <template #header>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:16px;font-weight:700;">{{ t('common.quickEntry') }}</span>
        </div>
      </template>
      <el-row :gutter="16" class="quick">
        <el-col v-for="e in entries" :key="e.path" :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="quick-card" @click="goTo(e.path)" shadow="hover">
            <div class="quick-item">
              <el-icon :style="{ color: e.color, fontSize: '24px' }">
                <component :is="e.icon"/>
              </el-icon>
              <span class="label">{{ e.label }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>
<style scoped>
.home {
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between
}

.hero-text {
  display: flex;
  flex-direction: column;
  margin-left: 16px;
  flex: 1
}

.title {
  font-size: 20px;
  font-weight: 600
}

.subtitle {
  color: #909399
}

.hero-actions {
  display: flex;
  gap: 8px
}

.quick {
  margin-top: 16px
}

.quick-card {
  cursor: pointer
}

.quick-item {
  display: flex;
  align-items: center;
  gap: 12px
}

@media (max-width: 768px) {
  .home {
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px
  }

  .hero-text {
    margin-left: 0
  }

  .hero-actions {
    width: 100%
  }
}
</style>
