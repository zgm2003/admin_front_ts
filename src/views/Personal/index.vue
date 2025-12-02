<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElNotification } from 'element-plus'
import { initPersonalApi, editPersonalApi } from '@/api/user/users'
import { useRoute, useRouter } from 'vue-router'
import { setupDynamicRoutes } from '@/router'
import 'element-plus/theme-chalk/display.css'
import UpImg from '@/components/UpImg'
const router = useRouter()
const route = useRoute()
const sexArr = ref([])
const addressTree = ref([])
const userloading = ref(false)
const user_id = (route.query as any).user_id
const initEdit = () => { userloading.value = true; const param = { user_id }; initPersonalApi(param).then((data:any)=>{ userloading.value = false; userinfo.value = data.list; addressTree.value = data.dict.auth_address_tree; sexArr.value = data.dict.sexArr; ElNotification.success('初始化成功') }).catch(()=>{ userloading.value = false }) }
initEdit()
const userinfo = ref({ uid:'', avatar:'', username:'', email:'', phone:'', role_id:'', role_name:'', sex:'', address:'', detail_address:'', desc:'', video:'', is_self:'' } as any)
const confirmEdit = () => { const param = userinfo.value as any; userloading.value = true; editPersonalApi(param).then(()=>{ userloading.value = false; ElNotification.success('保存成功') }).catch(()=>{ userloading.value = false }) }
const back = () => { router.go(-1); setupDynamicRoutes() }
const forgetPassword = () => { router.push('/editPassword') }
const sexLabel = computed(() => { const match = (sexArr.value as any[]).find((item:any)=> item.value === (userinfo.value as any).sex); return match ? match.label : '未知' })
</script>

<template>
  <div class="box">
    <el-row justify="center">
      <el-col :lg="24"><el-button type="success" style="width:100%" @click="back">返回</el-button></el-col>
    </el-row>
    <el-row gutter="20" justify="center">
      <el-col :lg="6" class="left">
        <el-card v-loading="userloading">
          <template #header><div class="card-header"><span>个人信息</span></div></template>
          <div class="content">
            <div class="one"><el-avatar :size="150" :src="userinfo.avatar" /></div>
            <div class="two"><div class="zuo">用户名</div><div class="you">{{ userinfo.username }}</div></div>
            <el-divider />
            <div class="two"><div class="zuo">邮箱</div><div class="you">{{ userinfo.email }}</div></div>
            <el-divider />
            <div class="two"><div class="zuo">手机号</div><div class="you">{{ userinfo.phone }}</div></div>
            <el-divider />
            <div class="two"><div class="zuo">性别</div><div class="you">{{ sexLabel }}</div></div>
            <el-divider />
            <div class="two"><div class="zuo">权限</div><div class="you"><el-tag v-if="userinfo.role_id === 1" type="success">{{ userinfo.role_name }}</el-tag><el-tag v-else type="danger">{{ userinfo.role_name }}</el-tag></div></div>
            <el-divider />
            <div class="two"><div class="zuo" style="min-width:80px;">个人简介</div><div class="you">{{ userinfo.desc }}</div></div>
            <el-divider />
          </div>
        </el-card>
      </el-col>
      <el-col :lg="18" class="right" v-if="userinfo.is_self === 1">
        <el-card v-loading="userloading">
          <template #header><div class="card-header"><span>基本资料</span></div></template>
          <div class="content">
            <el-form label-width="auto">
              <el-form-item label="头像"><up-img v-model="userinfo.avatar" folderName="avatar" :isClearable="false" /></el-form-item>
              <el-form-item label="用户名"><el-input v-model="userinfo.username" placeholder="请输入用户名" clearable /></el-form-item>
              <el-form-item label="手机号"><el-input v-model="userinfo.phone" placeholder="请输入用户名" clearable /></el-form-item>
              <el-form-item label="性别"><el-select-v2 v-model="userinfo.sex" :options="sexArr" placeholder="请选择性别" style="width:100%" clearable filterable /></el-form-item>
              <el-form-item label="地址"><el-cascader v-model="userinfo.address" :options="addressTree" placeholder="请选择地址" style="width:50%;margin-right:2%" clearable filterable /><el-input v-model="userinfo.detail_address" placeholder="详细地址" clearable style="width:48%" /></el-form-item>
              <el-form-item label="个人简介"><el-input type="textarea" :rows="5" v-model="userinfo.desc" placeholder="请输入内容" /></el-form-item>
              <el-form-item><el-button type="primary" @click="confirmEdit">保存</el-button><el-button type="danger" @click="forgetPassword">忘记密码/修改密码</el-button></el-form-item>
            </el-form>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped lang="less">
.box{ padding:20px }
.left .card-header{ font-size:20px; font-weight:bold }
</style>
