<script setup lang="ts">
import { Back, HomeFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import ErrorStatePanel from './components/ErrorStatePanel.vue'

const router = useRouter()
const { t } = useI18n()

const goHome = () => router.push('/home')
const goBack = () => router.back()
</script>

<template>
  <ErrorStatePanel
    :code="404"
    :title="t('error.notFound.title')"
    :description="t('error.notFound.description')"
  >
    <template #actions>
      <el-button @click="goBack">
        <el-icon><Back /></el-icon>
        {{ t('error.notFound.back') }}
      </el-button>
      <el-button
        type="primary"
        @click="goHome"
      >
        <el-icon><HomeFilled /></el-icon>
        {{ t('error.notFound.home') }}
      </el-button>
    </template>
  </ErrorStatePanel>
</template>
