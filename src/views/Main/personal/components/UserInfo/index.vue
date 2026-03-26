<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'

const {t} = useI18n()
const isMobile = useIsMobile()

const props = defineProps<{
  userinfo: {
    avatar: string
    username: string
    email: string
    phone: string
    role_id: number
    role_name: string
    bio: string
    sex: number
    has_password: boolean
  }
  sexArr: Array<{label: string, value: number}>
  loading: boolean
}>()

const sexLabel = computed(() => {
  const match = props.sexArr.find((item) => item.value === props.userinfo.sex)
  return match ? match.label : t('personal.unknown')
})
</script>

<template>
  <el-card shadow="never" v-loading="loading" class="user-info-card">
    <template #header>
      <div class="card-header"><span>{{ t('personal.title') }}</span></div>
    </template>
    <div class="content">
      <div class="avatar-section">
        <el-avatar :size="isMobile ? 100 : 120" :src="userinfo.avatar" class="avatar"/>
      </div>
      <div class="info-row">
        <div class="label">{{ t('personal.username') }}</div>
        <div class="value">{{ userinfo.username }}</div>
      </div>
      <el-divider/>
      <div class="info-row">
        <div class="label">{{ t('personal.email') }}</div>
        <div class="value">{{ userinfo.email || t('personal.notSet') }}</div>
      </div>
      <el-divider/>
      <div class="info-row">
        <div class="label">{{ t('personal.phone') }}</div>
        <div class="value">{{ userinfo.phone || t('personal.notSet') }}</div>
      </div>
      <el-divider/>
      <div class="info-row">
        <div class="label">{{ t('personal.sex') }}</div>
        <div class="value">{{ sexLabel }}</div>
      </div>
      <el-divider/>
      <div class="info-row">
        <div class="label">{{ t('personal.role') }}</div>
        <div class="value">
          <el-tag v-if="userinfo.role_id === 1" type="success">{{ userinfo.role_name }}</el-tag>
          <el-tag v-else type="danger">{{ userinfo.role_name }}</el-tag>
        </div>
      </div>
      <el-divider/>
      <div class="info-row">
        <div class="label">{{ t('personal.passwordStatus') }}</div>
        <div class="value">
          <el-tag v-if="userinfo.has_password" type="success">{{ t('personal.set') }}</el-tag>
          <el-tag v-else type="warning">{{ t('personal.notSet') }}</el-tag>
        </div>
      </div>
      <el-divider/>
      <div class="info-row bio-row">
        <div class="label">{{ t('personal.bio') }}</div>
        <div class="value">{{ userinfo.bio || t('personal.noBio') }}</div>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.user-info-card {
  .card-header {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .content {
    .avatar-section {
      display: flex;
      justify-content: center;
      margin-bottom: 28px;

      .avatar {
        border: 3px solid var(--el-border-color-lighter);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      transition: background-color 0.2s;

      .label {
        color: var(--el-text-color-secondary);
        min-width: 80px;
        flex-shrink: 0;
        font-size: 14px;
      }

      .value {
        color: var(--el-text-color-primary);
        text-align: right;
        flex: 1;
        word-break: break-all;
        font-size: 14px;
        font-weight: 500;
      }
    }

    .bio-row {
      flex-direction: column;
      align-items: flex-start;

      .label {
        margin-bottom: 8px;
      }

      .value {
        text-align: left;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
        background: var(--el-fill-color-light);
        padding: 12px 16px;
        border-radius: 8px;
        width: 100%;
        box-sizing: border-box;
      }
    }
  }
}
</style>
