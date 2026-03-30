<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import { UsersApi } from '@/api/user/users.ts'
import { useUserStore } from '@/store/user'
import type { DictOption } from '@/types/common'
import type { UserPersonalInfo } from '@/types/user'
import BaseInfo from './components/BaseInfo/index.vue'
import LoginLog from './components/LoginLog/index.vue'
import OperationLog from './components/OperationLog/index.vue'
import Security from './components/Security/index.vue'
import UserInfo from './components/UserInfo/index.vue'

const { t } = useI18n()
const route = useRoute()
const userStore = useUserStore()

const sexArr = ref<DictOption<number>[]>([])
const addressTree = ref<any[]>([])
const verifyTypeArr = ref<DictOption<'password' | 'code'>[]>([])
const loading = ref(false)
const userId = (route.query.user_id as string | undefined) || String(userStore.user_id)

const userinfo = ref<UserPersonalInfo>({
  username: '',
  email: '',
  avatar: '',
  phone: '',
  role_id: 0,
  role_name: '',
  sex: 0,
  birthday: '',
  address: 0,
  detail_address: '',
  bio: '',
  is_self: 0,
  has_password: false,
})

const activeTab = ref('basic')

const initPersonal = async () => {
  loading.value = true
  try {
    const data = await UsersApi.initPersonal({ user_id: userId })
    userinfo.value = data.list
    addressTree.value = data.dict.auth_address_tree || []
    sexArr.value = data.dict.sexArr || []
    verifyTypeArr.value = data.dict.verify_type_arr || []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void initPersonal()
})
</script>

<template>
  <div class="personal-page">
    <div class="personal-container">
      <!-- 外部用户：只显示左侧（用户信息卡片），全宽 -->
      <div v-if="userinfo.is_self !== CommonEnum.YES" class="module-full">
        <UserInfo :userinfo="userinfo" :sex-arr="sexArr" :loading="loading" />
      </div>

      <!-- 内部用户：只显示右侧（Tab 模块），全宽 -->
      <div v-else class="module-full">
        <el-card shadow="never" class="personal-card">
          <el-tabs v-model="activeTab">
            <el-tab-pane :label="t('personal.tabs.basic')" name="basic" lazy>
              <BaseInfo :userinfo="userinfo" :address-tree="addressTree" :sex-arr="sexArr" @refresh="initPersonal" />
            </el-tab-pane>
            <el-tab-pane :label="t('personal.tabs.security')" name="security" lazy>
              <Security :userinfo="userinfo" :verify-type-arr="verifyTypeArr" @refresh="initPersonal" />
            </el-tab-pane>
            <el-tab-pane :label="t('personal.tabs.loginLog')" name="loginLog" lazy>
              <LoginLog :user-id="userId" />
            </el-tab-pane>
            <el-tab-pane :label="t('personal.tabs.operationLog')" name="operationLog" lazy>
              <OperationLog :user-id="userId" />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@media (min-width: 769px) {
  .el-main.layout-content .layout-view.page-card:has(.personal-page) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
}
</style>

<style scoped lang="scss">
.personal-page {
  min-height: calc(100vh - 120px);
  padding: 24px;
  background: var(--el-bg-color-page);

  &::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 80% 50% at 16% 84%, rgba(64, 158, 255, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 85% 20%, rgba(103, 194, 58, 0.06) 0%, transparent 50%),
      radial-gradient(ellipse 50% 30% at 50% 50%, rgba(230, 162, 60, 0.04) 0%, transparent 50%);
  }
}

.personal-container {
  max-width: 900px;
  margin: 0 auto;
}

.module-full {
  width: 100%;
}

.personal-card {
  position: relative;
  z-index: 1;
}

@media (min-width: 1200px) {
  .personal-container {
    max-width: 1100px;
  }
}

@media (min-width: 769px) {
  .personal-page {
    flex: 1 1 auto;
    min-height: 0;
    padding: 8px 0 16px;
    overflow-y: auto;
    background: transparent;

    &::before {
      display: none;
    }
  }

  .personal-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 16px;
    background: var(--el-bg-color);
    backdrop-filter: blur(8px);

    :deep(.el-card__header) {
      padding: 18px 24px;
      border-bottom: 1px solid var(--el-border-color-extra-light);
      color: var(--el-text-color-primary);
      font-size: 16px;
      font-weight: 600;
    }

    :deep(.el-card__body) {
      padding: 24px;
    }

    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background: var(--el-border-color-light);
    }

    :deep(.el-tabs__item) {
      color: var(--el-text-color-secondary);
      font-size: 15px;
      font-weight: 500;

      &:hover {
        color: var(--el-color-primary);
      }

      &.is-active {
        color: var(--el-color-primary);
        font-weight: 600;
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      border-radius: 2px;
    }
  }
}

@media (max-width: 768px) {
  .personal-page {
    min-height: 0;
    flex-shrink: 0;
    padding: 0 2px 10px;
    background: transparent;

    &::before {
      display: none;
    }
  }

  .personal-card {
    margin-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-extra-light);
    border-radius: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;

    :deep(.el-card) {
      border: none !important;
      box-shadow: none !important;
    }

    :deep(.el-card__header) {
      padding: 8px 0 10px !important;
      border: none !important;
      background: transparent !important;
      box-shadow: none;
    }

    :deep(.el-card__body) {
      padding: 0 !important;
      border: none;
      box-shadow: none;
      background: transparent;
    }

    :deep(.el-tabs__header) {
      margin-bottom: 8px;
    }

    :deep(.el-tabs__item) {
      padding: 0 12px;
      font-size: 14px;
    }
  }
}

@media (max-width: 480px) {
  .personal-page {
    padding: 0 0 8px;
  }
}
</style>
