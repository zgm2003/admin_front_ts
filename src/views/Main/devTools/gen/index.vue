<script setup lang="ts">
import {ref, computed} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {GenApi} from '@/api/devTools/gen'

// 步骤
const activeStep = ref(0)

// Step 1: 表列表
const tables = ref<any[]>([])
const selectedTable = ref('')
const moduleName = ref('')
const domain = ref('System')
const menuName = ref('')
const routePath = ref('')

// Step 2: 字段配置
const columns = ref<any[]>([])

// Step 3: 预览
const previewFiles = ref<any>({})
const previewTab = ref('controller')

// 加载表列表
const loadTables = async () => {
  const res = await GenApi.tables()
  tables.value = res || []
}
loadTables()

// 选择表后加载字段
const handleTableChange = async (tableName: string) => {
  if (!tableName) return
  const res = await GenApi.columns({table: tableName})
  columns.value = res || []
  
  // 自动生成模块名
  const parts = tableName.split('_')
  moduleName.value = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  menuName.value = moduleName.value
  routePath.value = '/' + domain.value.toLowerCase() + '/' + tableName.replace(/_/g, '-')
}

// 下一步
const nextStep = async () => {
  if (activeStep.value === 0) {
    if (!selectedTable.value) {
      ElMessage.warning('请选择表')
      return
    }
    if (!moduleName.value) {
      ElMessage.warning('请输入模块名')
      return
    }
  }
  
  if (activeStep.value === 1) {
    // 预览代码
    const res = await GenApi.preview({
      table_name: selectedTable.value,
      module_name: moduleName.value,
      domain: domain.value,
      menu_name: menuName.value,
      route_path: routePath.value,
      columns: columns.value,
    })
    previewFiles.value = res || {}
  }
  
  activeStep.value++
}

// 上一步
const prevStep = () => {
  activeStep.value--
}

// 生成代码
const handleGenerate = async () => {
  await ElMessageBox.confirm('确定生成代码吗？已存在的文件将被跳过。', '提示')
  
  const res = await GenApi.generate({
    table_name: selectedTable.value,
    module_name: moduleName.value,
    domain: domain.value,
    menu_name: menuName.value,
    route_path: routePath.value,
    columns: columns.value,
  })
  
  if (res.created?.length > 0) {
    ElMessage.success(`成功生成 ${res.created.length} 个文件`)
  }
  if (res.skipped?.length > 0) {
    ElMessage.warning(`跳过 ${res.skipped.length} 个已存在的文件`)
  }
}

// 业务域选项
const domainOptions = [
  {label: 'System - 系统管理', value: 'System'},
  {label: 'User - 用户管理', value: 'User'},
  {label: 'DevTools - 开发工具', value: 'DevTools'},
  {label: 'Ai - AI助手', value: 'Ai'},
]

// 表选项（el-select-v2 格式）
const tableOptions = computed(() => tables.value.map(t => ({
  label: `${t.table_name} (${t.table_comment || '无注释'})`,
  value: t.table_name
})))

// 表单类型选项
const formTypeOptions = [
  {label: '文本框', value: 'input'},
  {label: '密码框', value: 'password'},
  {label: '数字', value: 'number'},
  {label: '文本域', value: 'textarea'},
  {label: '富文本', value: 'editor'},
  {label: '下拉框', value: 'select'},
  {label: '日期', value: 'date'},
  {label: '日期时间', value: 'datetime'},
  {label: '图片上传', value: 'image'},
]

// 预览文件 tabs
const previewTabs = computed(() => {
  return Object.keys(previewFiles.value).map(key => ({
    name: key,
    label: previewFiles.value[key]?.path || key,
  }))
})
</script>

<template>
  <div class="gen-container">
    <el-steps :active="activeStep" finish-status="success" style="margin-bottom: 24px;">
      <el-step title="选择表" />
      <el-step title="配置字段" />
      <el-step title="预览代码" />
    </el-steps>

    <!-- Step 1: 选择表 -->
    <div v-show="activeStep === 0" class="step-content">
      <el-form label-width="100px">
        <el-form-item label="选择表">
          <el-select-v2 v-model="selectedTable" :options="tableOptions" filterable placeholder="请选择表" :fit-input-width="false" style="width: 300px;" @change="handleTableChange" />
        </el-form-item>
        <el-form-item label="模块名">
          <el-input v-model="moduleName" placeholder="如 Article（大驼峰）" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="业务域">
          <el-select-v2 v-model="domain" :options="domainOptions" placeholder="选择业务域" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="菜单名称">
          <el-input v-model="menuName" placeholder="显示在菜单的名称" style="width: 300px;" />
        </el-form-item>
        <el-form-item label="路由路径">
          <el-input v-model="routePath" placeholder="如 /article" style="width: 300px;" />
        </el-form-item>
      </el-form>
    </div>

    <!-- Step 2: 配置字段 -->
    <div v-show="activeStep === 1" class="step-content">
      <el-table :data="columns" border style="width: 100%">
        <el-table-column prop="column_name" label="字段名" />
        <el-table-column prop="column_comment" label="注释"  />
        <el-table-column prop="data_type" label="类型"  />
        <el-table-column label="列表显示" align="center">
          <template #default="{row}">
            <el-checkbox v-model="row.show_in_list" />
          </template>
        </el-table-column>
        <el-table-column label="搜索条件"  align="center">
          <template #default="{row}">
            <el-checkbox v-model="row.show_in_search" />
          </template>
        </el-table-column>
        <el-table-column label="表单显示"  align="center">
          <template #default="{row}">
            <el-checkbox v-model="row.show_in_form" />
          </template>
        </el-table-column>
        <el-table-column label="表单类型" >
          <template #default="{row}">
            <el-select-v2 v-model="row.form_type" :options="formTypeOptions" size="small" />
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Step 3: 预览代码 -->
    <div v-show="activeStep === 2" class="step-content">
      <el-tabs v-model="previewTab">
        <el-tab-pane v-for="tab in previewTabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <pre class="code-preview">{{ previewFiles[tab.name]?.content }}</pre>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <el-button v-if="activeStep > 0" @click="prevStep">上一步</el-button>
      <el-button v-if="activeStep < 2" type="primary" @click="nextStep">下一步</el-button>
      <el-button v-if="activeStep === 2" type="success" @click="handleGenerate">生成代码</el-button>
    </div>
  </div>
</template>

<style scoped>
.gen-container {
  padding: 20px;
}
.step-content {
  min-height: 400px;
}
.step-actions {
  margin-top: 24px;
  text-align: center;
}
.code-preview {
  background: var(--el-fill-color-light);
  padding: 16px;
  border-radius: 4px;
  overflow: auto;
  max-height: 500px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
