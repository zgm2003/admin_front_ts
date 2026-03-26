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
import './personal.scss'

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
