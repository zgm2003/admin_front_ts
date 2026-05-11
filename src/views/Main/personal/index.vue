<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CommonEnum } from '@/enums'
import { UsersApi } from '@/api/user/users.ts'
import { useUserStore } from '@/store/user'
import type { DictOption } from '@/types/common'
import type { AddressTreeNode, UserPersonalInfo } from '@/types/user'
import BaseInfo from './components/BaseInfo/index.vue'
import LoginLog from './components/LoginLog/index.vue'
import OperationLog from './components/OperationLog/index.vue'
import Security from './components/Security/index.vue'
import UserInfo from './components/UserInfo/index.vue'

const { t } = useI18n()
const route = useRoute()
const userStore = useUserStore()

const sexArr = ref<DictOption<number>[]>([])
const addressTree = ref<AddressTreeNode[]>([])
const verifyTypeArr = ref<DictOption<'password' | 'code'>[]>([])
const loading = ref(false)
const userId = computed(() => {
  const queryUserID = Array.isArray(route.query.user_id) ? route.query.user_id[0] : route.query.user_id
  return queryUserID || String(userStore.user_id)
})
const userIdForLog = computed(() => String(userId.value))

const userinfo = ref<UserPersonalInfo>({
  user_id: 0,
  username: '',
  email: '',
  avatar: '',
  phone: '',
  role_id: 0,
  role_name: '',
  sex: 0,
  birthday: '',
  address_id: 0,
  detail_address: '',
  bio: '',
  is_self: 0,
  has_password: false,
})

const activeTab = ref('basic')

const initPersonal = async () => {
  loading.value = true
  try {
    const data = await UsersApi.initPersonal({ user_id: userId.value })
    userinfo.value = data.profile
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
              <LoginLog :user-id="userIdForLog" />
            </el-tab-pane>
            <el-tab-pane :label="t('personal.tabs.operationLog')" name="operationLog" lazy>
              <OperationLog :user-id="userIdForLog" />
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
  padding: 18px 20px;
  background: var(--el-bg-color-page);
}

.personal-container {
  width: 100%;
  max-width: 960px;
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
    max-width: 1040px;
  }
}

@media (min-width: 769px) {
  .personal-page {
    flex: 1 1 auto;
    min-height: 0;
    padding: 12px 0 16px;
    overflow-y: auto;
    background: transparent;
  }

  .personal-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    background: var(--el-bg-color);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);

    :deep(.el-card__header) {
      padding: 14px 20px;
      border-bottom: 1px solid var(--el-border-color-extra-light);
      color: var(--el-text-color-primary);
      font-size: 16px;
      font-weight: 600;
    }

    :deep(.el-card__body) {
      padding: 18px 20px 0;
    }

    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      height: 1px;
      background: var(--el-border-color-light);
    }

    :deep(.el-tabs__item) {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      font-weight: 500;
      height: 38px;
      padding: 0 16px;

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
