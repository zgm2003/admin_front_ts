<script setup lang="ts">
import {ref} from 'vue'
import {ElNotification} from 'element-plus'
import {UsersApi} from '@/api/user/users.ts'
import { UpMedia } from '@/components/UpMedia'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'

const props = defineProps<{
  userinfo: any
  addressTree: any[]
  sexArr: any[]
}>()

const emit = defineEmits(['refresh'])

const {t} = useI18n()
const isMobile = useIsMobile()
const loading = ref(false)

const confirmEdit = () => {
  const param = {
    avatar: props.userinfo.avatar,
    username: props.userinfo.username,
    sex: props.userinfo.sex,
    birthday: props.userinfo.birthday,
    address: props.userinfo.address,
    detail_address: props.userinfo.detail_address,
    bio: props.userinfo.bio,
  }
  loading.value = true
  UsersApi.editPersonal(param).then(() => {
    loading.value = false
    ElNotification.success(t('common.success.operation'))
    emit('refresh')
  }).catch(() => {
    loading.value = false
  })
}
</script>

<template>
  <div class="base-info" v-loading="loading">
    <el-form label-width="auto" label-position="top" class="base-form">
      <el-form-item :label="t('personal.form.avatar')">
        <UpMedia v-model="userinfo.avatar" folder-name="avatars" :isClearable="false"/>
      </el-form-item>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item :label="t('personal.form.username')">
            <el-input v-model="userinfo.username" :placeholder="t('personal.form.usernamePlaceholder')" clearable/>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item :label="t('personal.form.sex')">
            <el-select-v2 v-model="userinfo.sex" :options="sexArr" :placeholder="t('personal.form.sexPlaceholder')"
                          style="width:100%" clearable filterable/>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item :label="t('personal.form.birthday')">
            <el-date-picker v-model="userinfo.birthday" type="date" :placeholder="t('personal.form.birthdayPlaceholder')"
                            style="width:100%" format="YYYY-MM-DD" value-format="YYYY-MM-DD" clearable/>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item :label="t('personal.form.address')">
            <el-cascader v-model="userinfo.address" :options="addressTree" :props="{ emitPath: false }"
                         :placeholder="t('personal.form.addressPlaceholder')" style="width:100%" clearable filterable/>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item :label="t('personal.form.detailAddress')">
        <el-input v-model="userinfo.detail_address" :placeholder="t('personal.form.detailAddress')" clearable/>
      </el-form-item>
      <el-form-item :label="t('personal.form.bio')">
        <el-input type="textarea" :rows="4" v-model="userinfo.bio" :placeholder="t('personal.form.bioPlaceholder')"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="confirmEdit" :style="{width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 'auto' : '120px'}">{{ t('personal.form.saveBasic') }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.base-info {
  padding: 10px 0;

  .base-form {
    max-width: 800px;
  }
}
</style>
