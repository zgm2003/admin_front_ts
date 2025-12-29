<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {UsersApi} from '@/api/user/users.ts'
import {useRoute} from 'vue-router'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import UserInfo from './components/UserInfo/index.vue'
import BaseInfo from './components/BaseInfo/index.vue'
import Security from './components/Security/index.vue'
import LoginLog from './components/LoginLog/index.vue'
import OperationLog from './components/OperationLog/index.vue'

const {t} = useI18n()
const isMobile = useIsMobile()

const route = useRoute()
const userStore = useUserStore()
const sexArr = ref<any[]>([])
const addressTree = ref<any[]>([])
const verifyTypeArr = ref<any[]>([])
const loading = ref(false)
const user_id = (route.query as any).user_id || userStore.user_id

const userinfo = ref({
  uid: '',
  avatar: '',
  username: '',
  email: '',
  phone: '',
  role_id: 0,
  role_name: '',
  sex: 0,
  birthday: '',
  address: '',
  detail_address: '',
  bio: '',
  is_self: 0,
  has_password: false  // 新增：是否已设置密码
})

const activeTab = ref('basic')

const initPersonal = () => {
  loading.value = true
  UsersApi.initPersonal({user_id}).then((data: any) => {
    loading.value = false
    userinfo.value = data.list
    addressTree.value = data.dict.auth_address_tree || []
    sexArr.value = data.dict.sexArr || []
    verifyTypeArr.value = data.dict.verify_type_arr || []
  }).catch(() => {
    loading.value = false
  })
}

onMounted(() => {
  initPersonal()
})
</script>

<template>
  <div class="personal-page" :style="{padding: isMobile ? '10px' : '20px'}">
    <el-row :gutter="isMobile ? 10 : 20" justify="center">
      <!-- 左侧：个人信息展示 -->
      <el-col :lg="6" :md="8" :sm="24">
        <UserInfo :userinfo="userinfo" :sexArr="sexArr" :loading="loading"/>
      </el-col>
      
      <!-- 右侧：编辑区域（仅本人可见） -->
      <el-col :lg="18" :md="16" :sm="24" v-if="userinfo.is_self === 1">
        <el-card shadow="none">
          <el-tabs v-model="activeTab">
            <el-tab-pane :label="t('personal.tabs.basic')" name="basic" lazy>
              <BaseInfo :userinfo="userinfo" :addressTree="addressTree" :sexArr="sexArr" @refresh="initPersonal"/>
            </el-tab-pane>
            <el-tab-pane :label="t('personal.tabs.security')" name="security" lazy>
              <Security :userinfo="userinfo" :verifyTypeArr="verifyTypeArr" @refresh="initPersonal"/>
            </el-tab-pane>
            <el-tab-pane :label="t('personal.tabs.loginLog')" name="loginLog" lazy>
              <LoginLog :userId="user_id"/>
            </el-tab-pane>
            <el-tab-pane :label="t('personal.tabs.operationLog')" name="operationLog" lazy>
              <OperationLog :userId="user_id"/>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.personal-page {
  padding: 20px;
}
</style>
