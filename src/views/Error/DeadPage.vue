<script setup lang="ts">
import { computed } from 'vue'
import { Back, HomeFilled } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import ErrorStatePanel from './components/ErrorStatePanel.vue'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const details = computed(() => [
  {
    label: t('error.deadPage.detailPath'),
    value: route.meta.deadRoutePath || route.path,
  },
  {
    label: t('error.deadPage.detailViewKey'),
    value: route.meta.deadViewKey || '-',
  },
])

const goHome = () => router.push('/home')
const goBack = () => router.back()
</script>

<template>
  <ErrorStatePanel
    code="DEAD"
    :title="t('error.deadPage.title')"
    :description="t('error.deadPage.description')"
    :details="details"
  >
    <template #actions>
      <el-button @click="goBack">
        <el-icon><Back /></el-icon>
        {{ t('error.deadPage.back') }}
      </el-button>
      <el-button type="primary" @click="goHome">
        <el-icon><HomeFilled /></el-icon>
        {{ t('error.deadPage.home') }}
      </el-button>
    </template>
  </ErrorStatePanel>
</template>
