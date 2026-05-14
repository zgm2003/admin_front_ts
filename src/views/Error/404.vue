<script setup>
import { useRouter } from 'vue-router'
import { HomeFilled, Back } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { t } = useI18n()
const goHome = () => router.push('/')
const goBack = () => router.back()
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <h1 class="error-title">{{ t('error.notFound.title') }}</h1>
      <p class="error-desc">{{ t('error.notFound.description') }}</p>
      <div class="error-actions">
        <el-button @click="goBack">
          <el-icon><Back /></el-icon>
          {{ t('error.notFound.back') }}
        </el-button>
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          {{ t('error.notFound.home') }}
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.error-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--el-bg-color-page); padding: 20px; }
.error-content { text-align: center; max-width: 480px; }
.error-code { font-size: 120px; font-weight: 700; line-height: 1; color: var(--el-color-primary); margin-bottom: 16px; }
.error-title { font-size: 24px; font-weight: 600; color: var(--el-text-color-primary); margin: 0 0 12px; }
.error-desc { font-size: 15px; color: var(--el-text-color-regular); margin: 0 0 32px; }
.error-actions { display: flex; align-items: center; justify-content: center; gap: 12px; .el-button { min-width: 120px; .el-icon { margin-right: 6px; } } }

@media (max-width: 480px) {
  .error-code { font-size: 80px; }
  .error-title { font-size: 20px; }
  .error-actions { flex-direction: column; .el-button { width: 100%; } }
}
</style>
