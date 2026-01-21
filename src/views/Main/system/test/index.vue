<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {TestApi} from '@/api/system/test'
import {useIsMobile} from '@/hooks/useResponsive'
import {ElNotification, ElIcon} from 'element-plus'
import {ArrowRight} from '@element-plus/icons-vue'
import type {FormInstance, FormRules} from 'element-plus'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {useUserStore} from '@/store/user'
import {useTable} from '@/hooks/useTable'
import {Editor} from '@/components/Editor'
import { UpImg } from '@/components/UpImg'

const {t} = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()
const dict = ref({} as any)

const searchForm = ref({})

const {
  loading: listLoading,
  data: listData,
  page,
  selectedIds,
  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel
} = useTable({
  api: TestApi,
  searchForm
})

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

const form = ref({
  title: '',
  username: '',
  nickname: '',
  email: '',
  phone: '',
  password: '',
  avatar: '',
  cover_image: '',
  status: 1,
  type: 1,
  sex: 0,
  age: 0,
  score: '',
  description: '',
  content: '',
  remark: '',
  url: '',
  published_at: '',
  birthday: '',
  is_vip: 1,
  is_hot: 1,
})

const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  title: [{required: true, message: '标题' + t('common.required'), trigger: 'blur'}],
  username: [{required: true, message: '用户名' + t('common.required'), trigger: 'blur'}],
  password: [{required: true, message: '密码' + t('common.required'), trigger: 'blur'}],
  status: [{required: true, message: '状态：1-启用 2-禁用' + t('common.required'), trigger: 'blur'}],
  sex: [{required: true, message: '性别：0-未知 1-男 2-女' + t('common.required'), trigger: 'blur'}],
  is_vip: [{required: true, message: '是否VIP：1-是 2-否' + t('common.required'), trigger: 'blur'}],
  is_hot: [{required: true, message: '是否热门：1-是 2-否' + t('common.required'), trigger: 'blur'}],
}))

const init = () => {
  TestApi.init()
    .then((data: any) => {
      dict.value = data.dict || {}
    })
    .catch(() => {})
}

const searchFields = computed<SearchField[]>(() => [
  {key: 'title', type: 'input', label: '标题', placeholder: '标题', width: 200},
  {key: 'username', type: 'input', label: '用户名', placeholder: '用户名', width: 200},
  {key: 'nickname', type: 'input', label: '昵称', placeholder: '昵称', width: 200},
  {key: 'email', type: 'input', label: '邮箱', placeholder: '邮箱', width: 200},
])

const columns = computed(() => [
  {key: 'id', label: '主键ID'},
  {key: 'title', label: '标题'},
  {key: 'username', label: '用户名'},
  {key: 'nickname', label: '昵称'},
  {key: 'email', label: '邮箱'},
  {key: 'phone', label: '手机号'},
  {key: 'avatar', label: '头像'},
  {key: 'cover_image', label: '封面图'},
  {key: 'status', label: '状态：1-启用 2-禁用'},
  {key: 'type', label: '类型：1-类型A 2-类型B 3-类型C'},
  {key: 'sex', label: '性别：0-未知 1-男 2-女'},
  {key: 'age', label: '年龄'},
  {key: 'score', label: '分数'},
  {key: 'url', label: '网址'},
  {key: 'published_at', label: '发布时间'},
  {key: 'birthday', label: '生日'},
  {key: 'is_vip', label: '是否VIP：1-是 2-否'},
  {key: 'is_hot', label: '是否热门：1-是 2-否'},
  {key: 'created_at', label: '创建时间'},
  {key: 'updated_at', label: '更新时间'},
  {key: 'actions', label: t('common.actions.action'), width: 220}
])

const add = () => {
  dialogMode.value = 'add'
  form.value = {
  title: '',
  username: '',
  nickname: '',
  email: '',
  phone: '',
  password: '',
  avatar: '',
  cover_image: '',
  status: 1,
  type: 1,
  sex: 0,
  age: 0,
  score: '',
  description: '',
  content: '',
  remark: '',
  url: '',
  published_at: '',
  birthday: '',
  is_vip: 1,
  is_hot: 1,
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const edit = (row: any) => {
  dialogMode.value = 'edit'
  form.value = {...row}
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const confirmSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  
  const api = dialogMode.value === 'add' ? TestApi.add : TestApi.edit
  api(form.value).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    dialogVisible.value = false
    getList()
  })
}

onMounted(() => {
  init()
  getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        selectable
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button type="success" @click="add" v-if="userStore.can('system_test_add')">{{ t('common.actions.add') }}</el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <ElIcon class="el-icon--right">
                <ArrowRight/>
              </ElIcon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('system_test_del')">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-avatar="{ row }">
          <el-image v-if="row.avatar" :src="row.avatar" style="width: 50px; height: 50px" fit="cover" />
        </template>
        <template #cell-cover_image="{ row }">
          <el-image v-if="row.cover_image" :src="row.cover_image" style="width: 50px; height: 50px" fit="cover" />
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status_name || row.status }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)" v-if="userStore.can('system_test_edit')">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)" v-if="userStore.can('system_test_del')">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '900px'">
    <template #header>{{ dialogMode === 'add' ? '新增' : '编辑' }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item label="标题" prop="title" required>
            <el-input v-model="form.title" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="用户名" prop="username" required>
            <el-input v-model="form.username" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="form.nickname" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="密码" prop="password" required>
            <el-input v-model="form.password" type="password" show-password clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="头像" prop="avatar">
            <UpImg v-model="form.avatar" folder-name="avatar" width="80px" show-input/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="封面图" prop="cover_image">
            <UpImg v-model="form.cover_image" folder-name="cover_image" width="80px" show-input/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="状态：1-启用 2-禁用" prop="status" required>
            <el-select-v2 v-model="form.status" :options="dict.status_arr || []" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="类型：1-类型A 2-类型B 3-类型C" prop="type">
            <el-select-v2 v-model="form.type" :options="dict.type_arr || []" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="性别：0-未知 1-男 2-女" prop="sex" required>
            <el-select-v2 v-model="form.sex" :options="dict.sex_arr || []" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="年龄" prop="age">
            <el-input-number v-model="form.age" :min="0" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="分数" prop="score">
            <el-input-number v-model="form.score" :min="0" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" clearable/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="内容" prop="content">
            <Editor v-model="form.content" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="网址" prop="url">
            <el-input v-model="form.url" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="发布时间" prop="published_at">
            <el-date-picker v-model="form.published_at" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="生日" prop="birthday">
            <el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="是否VIP：1-是 2-否" prop="is_vip" required>
            <el-select-v2 v-model="form.is_vip" :options="dict.is_vip_arr || []" style="width:100%"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="是否热门：1-是 2-否" prop="is_hot" required>
            <el-select-v2 v-model="form.is_hot" :options="dict.is_hot_arr || []" style="width:100%"/>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible=false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto
}
</style>