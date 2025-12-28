<script setup lang="ts">
import {computed, ref, onMounted} from 'vue'
import {ElNotification} from 'element-plus'
import {UsersApi} from '@/api/user/users.ts'
import {useRoute, useRouter} from 'vue-router'
import 'element-plus/theme-chalk/display.css'
import UpImg from '@/components/UpImg'
import {useI18n} from 'vue-i18n'
import {useUserStore} from '@/store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const sexArr = ref([])
const addressTree = ref([])
const userloading = ref(false)
const user_id = (route.query as any).user_id || userStore.user_id
const {t} = useI18n()
const initEdit = () => {
  userloading.value = true;
  const param = {user_id};
  UsersApi.initPersonal(param).then((data: any) => {
    userloading.value = false;
    userinfo.value = data.list;
    addressTree.value = data.dict.auth_address_tree;
    sexArr.value = data.dict.sexArr;
    // ElNotification.success(t('common.success.operation'))
  }).catch(() => {
    userloading.value = false
  })
}
const userinfo = ref({
  uid: '',
  avatar: '',
  username: '',
  email: '',
  phone: '',
  role_id: '',
  role_name: '',
  sex: '',
  birthday: '',
  address: '',
  detail_address: '',
  bio: '',
  video: '',
  is_self: ''
} as any)
const activeTab = ref('basic')
const confirmEdit = () => {
  const param = userinfo.value as any;
  userloading.value = true;
  UsersApi.editPersonal(param).then(() => {
    userloading.value = false;
    ElNotification.success(t('common.success.operation'))
  }).catch(() => {
    userloading.value = false
  })
}
onMounted(() => {
  initEdit()
})
const back = () => {
  //返回首页
  router.push('/home')
}
const forgetPassword = () => {
  router.push('/editPassword')
}
const sexLabel = computed(() => {
  const match = (sexArr.value as any[]).find((item: any) => item.value === (userinfo.value as any).sex);
  return match ? match.label : '未知'
})
</script>

<template>
  <div class="box">
<!--    <el-row justify="center">-->
<!--      <el-col :lg="24">-->
<!--        <el-button type="success" style="width:100%" @click="back">返回</el-button>-->
<!--      </el-col>-->
<!--    </el-row>-->
    <el-row gutter="20" justify="center">
      <el-col :lg="6" class="left">
        <el-card shadow="none" v-loading="userloading">
          <template #header>
            <div class="card-header"><span>个人信息</span></div>
          </template>
          <div class="content">
            <div class="one">
              <el-avatar :size="150" :src="userinfo.avatar"/>
            </div>
            <div class="two">
              <div class="zuo">用户名</div>
              <div class="you">{{ userinfo.username }}</div>
            </div>
            <el-divider/>
            <div class="two">
              <div class="zuo">邮箱</div>
              <div class="you">{{ userinfo.email }}</div>
            </div>
            <el-divider/>
            <div class="two">
              <div class="zuo">手机号</div>
              <div class="you">{{ userinfo.phone }}</div>
            </div>
            <el-divider/>
            <div class="two">
              <div class="zuo">性别</div>
              <div class="you">{{ sexLabel }}</div>
            </div>
            <el-divider/>
            <div class="two">
              <div class="zuo">权限</div>
              <div class="you">
                <el-tag v-if="userinfo.role_id === 1" type="success">{{ userinfo.role_name }}</el-tag>
                <el-tag v-else type="danger">{{ userinfo.role_name }}</el-tag>
              </div>
            </div>
            <el-divider/>
            <div class="two">
              <div class="zuo" style="min-width:80px;">个人简介</div>
              <div class="you">{{ userinfo.bio }}</div>
            </div>
            <el-divider/>
          </div>
        </el-card>
      </el-col>
      <el-col :lg="18" class="right" v-if="userinfo.is_self === 1">
        <el-card shadow="none" v-loading="userloading">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本资料" name="basic">
              <div class="content">
                <el-form label-width="auto">
                  <el-form-item label="头像">
                    <up-img v-model="userinfo.avatar" folderName="avatar" :isClearable="false"/>
                  </el-form-item>
                  <el-form-item label="用户名">
                    <el-input v-model="userinfo.username" placeholder="请输入用户名" clearable/>
                  </el-form-item>
                  <el-form-item label="性别">
                    <el-select-v2 v-model="userinfo.sex" :options="sexArr" placeholder="请选择性别" style="width:100%"
                                  clearable filterable/>
                  </el-form-item>
                  <el-form-item label="生日">
                    <el-date-picker v-model="userinfo.birthday" type="date" placeholder="选择日期" style="width:100%"
                                    format="YYYY-MM-DD" value-format="YYYY-MM-DD" clearable/>
                  </el-form-item>
                  <el-form-item label="地址">
                    <el-cascader v-model="userinfo.address" :options="addressTree" :props="{ emitPath: false }"
                                 placeholder="请选择地址" style="width:50%;margin-right:2%" clearable filterable/>
                    <el-input v-model="userinfo.detail_address" placeholder="详细地址" clearable style="width:48%"/>
                  </el-form-item>
                  <el-form-item label="个人简介">
                    <el-input type="textarea" :rows="5" v-model="userinfo.bio" placeholder="请输入内容"/>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="confirmEdit">保存基本资料</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
            <el-tab-pane label="账号与安全" name="security">
              <div class="content">
                <el-form label-width="auto">
                  <el-form-item label="手机号">
                    <el-input v-model="userinfo.phone" placeholder="请输入手机号" clearable/>
                  </el-form-item>
                  <el-form-item label="邮箱">
                    <el-input v-model="userinfo.email" placeholder="请输入邮箱" disabled/>
                    <div style="font-size:12px;color:#999;margin-top:5px">邮箱暂不支持修改</div>
                  </el-form-item>
                  <el-form-item label="密码">
                    <el-button type="danger" link @click="forgetPassword">修改密码 / 忘记密码</el-button>
                  </el-form-item>
                  <el-form-item>
                    <el-button type="primary" @click="confirmEdit">保存账号设置</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="scss">
.left .card-header {
  font-size: 20px;
  font-weight: bold
}
</style>
