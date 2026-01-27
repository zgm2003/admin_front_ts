<script setup lang="ts">
import {ref, computed} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {GenApi} from '@/api/devTools/gen'
import {QuestionFilled} from '@element-plus/icons-vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'

const {t} = useI18n()
const isMobile = useIsMobile()

// 步骤
const activeStep = ref(0)

// 帮助弹窗
const helpVisible = ref(false)

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
      ElMessage.warning(t('codeGen.messages.selectTableRequired'))
      return
    }
    if (!moduleName.value) {
      ElMessage.warning(t('codeGen.messages.moduleNameRequired'))
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
  await ElMessageBox.confirm(t('codeGen.messages.generateConfirm'), t('common.tip'))
  
  const res = await GenApi.generate({
    table_name: selectedTable.value,
    module_name: moduleName.value,
    domain: domain.value,
    menu_name: menuName.value,
    route_path: routePath.value,
    columns: columns.value,
  })
  
  if (res.created?.length > 0) {
    ElMessage.success(t('codeGen.messages.generateSuccess', {count: res.created.length}))
  }
  if (res.skipped?.length > 0) {
    ElMessage.warning(t('codeGen.messages.generateSkipped', {count: res.skipped.length}))
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
const formTypeOptions = computed(() => [
  {label: t('codeGen.formTypes.input'), value: 'input'},
  {label: t('codeGen.formTypes.password'), value: 'password'},
  {label: t('codeGen.formTypes.number'), value: 'number'},
  {label: t('codeGen.formTypes.textarea'), value: 'textarea'},
  {label: t('codeGen.formTypes.editor'), value: 'editor'},
  {label: t('codeGen.formTypes.select'), value: 'select'},
  {label: t('codeGen.formTypes.date'), value: 'date'},
  {label: t('codeGen.formTypes.datetime'), value: 'datetime'},
  {label: t('codeGen.formTypes.image'), value: 'image'},
])

// 预览文件 tabs
const previewTabs = computed(() => {
  return Object.keys(previewFiles.value).map(key => ({
    name: key,
    label: previewFiles.value[key]?.path || key,
  }))
})

// 表单类型示例数据
const formTypeExamples = computed(() => [
  {type: t('codeGen.formTypes.input'), desc: '单行文本输入', example: '标题、用户名、邮箱等'},
  {type: t('codeGen.formTypes.password'), desc: '密码输入（隐藏字符）', example: '密码字段'},
  {type: t('codeGen.formTypes.number'), desc: '数字输入框', example: '年龄、数量、金额等'},
  {type: t('codeGen.formTypes.textarea'), desc: '多行文本输入', example: '描述、备注等'},
  {type: t('codeGen.formTypes.editor'), desc: '富文本编辑器', example: '文章内容、详情等'},
  {type: t('codeGen.formTypes.select'), desc: '下拉选择', example: '状态、类型、分类等'},
  {type: t('codeGen.formTypes.date'), desc: '日期选择器', example: '生日、日期等'},
  {type: t('codeGen.formTypes.datetime'), desc: '日期时间选择器', example: '发布时间、预约时间等'},
  {type: t('codeGen.formTypes.image'), desc: '图片上传组件', example: '头像、封面图等'},
])
</script>

<template>
  <div class="gen-container">
    <div class="gen-header">
      <h2>{{ t('codeGen.title') }}</h2>
      <el-button :icon="QuestionFilled" @click="helpVisible = true">{{ t('codeGen.helpButton') }}</el-button>
    </div>
    
    <el-steps :active="activeStep" finish-status="success" :direction="isMobile ? 'vertical' : 'horizontal'" class="gen-steps">
      <el-step :title="t('codeGen.steps.selectTable')" />
      <el-step :title="t('codeGen.steps.configFields')" />
      <el-step :title="t('codeGen.steps.previewCode')" />
    </el-steps>

    <!-- Step 1: 选择表 -->
    <div v-show="activeStep === 0" class="step-content">
      <el-form :label-width="isMobile ? '80px' : '100px'" :label-position="isMobile ? 'top' : 'right'">
        <el-form-item :label="t('codeGen.form.selectTable')">
          <el-select-v2 v-model="selectedTable" :options="tableOptions" filterable :placeholder="t('codeGen.form.selectTablePlaceholder')" :fit-input-width="false" style="width: 100%; max-width: 400px;" @change="handleTableChange" />
        </el-form-item>
        <el-form-item :label="t('codeGen.form.moduleName')">
          <el-input v-model="moduleName" :placeholder="t('codeGen.form.moduleNamePlaceholder')" style="width: 100%; max-width: 400px;" />
        </el-form-item>
        <el-form-item :label="t('codeGen.form.domain')">
          <el-select-v2 v-model="domain" :options="domainOptions" :placeholder="t('codeGen.form.domainPlaceholder')" style="width: 100%; max-width: 400px;" />
        </el-form-item>
        <el-form-item :label="t('codeGen.form.menuName')">
          <el-input v-model="menuName" :placeholder="t('codeGen.form.menuNamePlaceholder')" style="width: 100%; max-width: 400px;" />
        </el-form-item>
        <el-form-item :label="t('codeGen.form.routePath')">
          <el-input v-model="routePath" :placeholder="t('codeGen.form.routePathPlaceholder')" style="width: 100%; max-width: 400px;" />
        </el-form-item>
      </el-form>
    </div>

    <!-- Step 2: 配置字段 -->
    <div v-show="activeStep === 1" class="step-content">
      <div class="table-wrapper">
        <el-table :data="columns" border style="width: 100%">
          <el-table-column prop="column_name" :label="t('codeGen.table.columnName')" min-width="120" />
          <el-table-column prop="column_comment" :label="t('codeGen.table.comment')" min-width="120" />
          <el-table-column prop="data_type" :label="t('codeGen.table.dataType')" width="80" />
          <el-table-column :label="t('codeGen.table.showInList')" align="center" width="90">
            <template #default="{row}">
              <el-checkbox v-model="row.show_in_list" />
            </template>
          </el-table-column>
          <el-table-column :label="t('codeGen.table.showInSearch')" align="center" width="90">
            <template #default="{row}">
              <el-checkbox v-model="row.show_in_search" />
            </template>
          </el-table-column>
          <el-table-column :label="t('codeGen.table.showInForm')" align="center" width="90">
            <template #default="{row}">
              <el-checkbox v-model="row.show_in_form" />
            </template>
          </el-table-column>
          <el-table-column :label="t('codeGen.table.formType')" min-width="120">
            <template #default="{row}">
              <el-select-v2 v-model="row.form_type" :options="formTypeOptions" size="small" style="width: 100%;" />
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Step 3: 预览代码 -->
    <div v-show="activeStep === 2" class="step-content">
      <el-tabs v-model="previewTab" :tab-position="isMobile ? 'top' : 'left'">
        <el-tab-pane v-for="tab in previewTabs" :key="tab.name" :label="tab.label" :name="tab.name">
          <pre class="code-preview">{{ previewFiles[tab.name]?.content }}</pre>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 操作按钮 -->
    <div class="step-actions">
      <el-button v-if="activeStep > 0" @click="prevStep">{{ t('codeGen.actions.prevStep') }}</el-button>
      <el-button v-if="activeStep < 2" type="primary" @click="nextStep">{{ t('codeGen.actions.nextStep') }}</el-button>
      <el-button v-if="activeStep === 2" type="success" @click="handleGenerate">{{ t('codeGen.actions.generate') }}</el-button>
    </div>

    <!-- 帮助文档弹窗 -->
    <el-dialog v-model="helpVisible" :title="t('codeGen.title') + ' - ' + t('codeGen.helpButton')" :width="isMobile ? '95vw' : '800px'" :close-on-click-modal="false">
      <div class="help-content">
        <h3>📖 {{ t('codeGen.help.quickStart') }}</h3>
        <p>{{ t('codeGen.help.quickStartDesc') }}</p>

        <h3>🚀 {{ t('codeGen.help.usageSteps') }}</h3>
        <el-steps direction="vertical" :active="3">
          <el-step :title="t('codeGen.help.step1')" :description="t('codeGen.help.step1Desc')" />
          <el-step :title="t('codeGen.help.step2')" :description="t('codeGen.help.step2Desc')" />
          <el-step :title="t('codeGen.help.step3')" :description="t('codeGen.help.step3Desc')" />
        </el-steps>

        <h3 style="margin-top: 24px;">⚙️ {{ t('codeGen.help.configDesc') }}</h3>
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item :label="t('codeGen.form.moduleName')">{{ t('codeGen.help.moduleNameDesc') }}</el-descriptions-item>
          <el-descriptions-item :label="t('codeGen.form.domain')">{{ t('codeGen.help.domainDesc') }}</el-descriptions-item>
          <el-descriptions-item :label="t('codeGen.form.menuName')">{{ t('codeGen.help.menuNameDesc') }}</el-descriptions-item>
          <el-descriptions-item :label="t('codeGen.form.routePath')">{{ t('codeGen.help.routePathDesc') }}</el-descriptions-item>
        </el-descriptions>

        <h3 style="margin-top: 24px;">📋 {{ t('codeGen.help.fieldConfig') }}</h3>
        <ul>
          <li><strong>{{ t('codeGen.table.showInList') }}：</strong>{{ t('codeGen.help.showInListDesc') }}</li>
          <li><strong>{{ t('codeGen.table.showInSearch') }}：</strong>{{ t('codeGen.help.showInSearchDesc') }}</li>
          <li><strong>{{ t('codeGen.table.showInForm') }}：</strong>{{ t('codeGen.help.showInFormDesc') }}</li>
          <li><strong>{{ t('codeGen.table.formType') }}：</strong>{{ t('codeGen.help.formTypeDesc') }}</li>
        </ul>

        <h3>🎨 {{ t('codeGen.help.formTypeExamples') }}</h3>
        <el-table :data="formTypeExamples" border size="small">
          <el-table-column prop="type" :label="t('codeGen.help.formTypeTable.type')" width="120" />
          <el-table-column prop="desc" :label="t('codeGen.help.formTypeTable.desc')" />
          <el-table-column prop="example" :label="t('codeGen.help.formTypeTable.example')" />
        </el-table>

        <h3 style="margin-top: 24px;">✅ {{ t('codeGen.help.generatedFiles') }}</h3>
        <p><strong>{{ t('codeGen.help.backendFiles') }}</strong></p>
        <ul>
          <li>{{ t('codeGen.help.controller') }}</li>
          <li>{{ t('codeGen.help.module') }}</li>
          <li>{{ t('codeGen.help.dep') }}</li>
          <li>{{ t('codeGen.help.model') }}</li>
          <li>{{ t('codeGen.help.validate') }}</li>
        </ul>
        <p><strong>{{ t('codeGen.help.frontendFiles') }}</strong></p>
        <ul>
          <li>{{ t('codeGen.help.api') }}</li>
          <li>{{ t('codeGen.help.vue') }}</li>
        </ul>

        <h3>⚠️ {{ t('codeGen.help.notices') }}</h3>
        <el-alert type="warning" :closable="false" style="margin-bottom: 12px;">
          <ul style="margin: 0; padding-left: 20px;">
            <li>{{ t('codeGen.help.notice1') }}</li>
            <li>{{ t('codeGen.help.notice2') }}</li>
            <li>{{ t('codeGen.help.notice3') }}</li>
            <li>{{ t('codeGen.help.notice4') }}</li>
          </ul>
        </el-alert>

        <h3>💡 {{ t('codeGen.help.bestPractices') }}</h3>
        <ul>
          <li>{{ t('codeGen.help.practice1') }}</li>
          <li>{{ t('codeGen.help.practice2') }}</li>
          <li>{{ t('codeGen.help.practice3') }}</li>
          <li>{{ t('codeGen.help.practice4') }}</li>
          <li>{{ t('codeGen.help.practice5') }}</li>
        </ul>
      </div>
      <template #footer>
        <el-button type="primary" @click="helpVisible = false">{{ t('codeGen.actions.iKnow') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.gen-container {
  padding: 20px;
}
.gen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.gen-header h2 {
  margin: 0;
  font-size: 20px;
}
.gen-steps {
  margin-bottom: 24px;
}
.step-content {
  min-height: 400px;
}
.table-wrapper {
  overflow-x: auto;
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
.help-content {
  max-height: 600px;
  overflow-y: auto;
  padding: 0 8px;
}
.help-content h3 {
  color: var(--el-color-primary);
  margin-top: 20px;
  margin-bottom: 12px;
  font-size: 16px;
}
.help-content ul {
  margin: 8px 0;
  padding-left: 24px;
}
.help-content li {
  margin: 6px 0;
  line-height: 1.6;
}
.help-content p {
  line-height: 1.8;
  margin: 8px 0;
}

@media (max-width: 768px) {
  .gen-container { padding: 12px; }
  .gen-header h2 { font-size: 18px; }
  .step-content { min-height: 300px; }
  .code-preview { font-size: 12px; max-height: 400px; }
  .help-content { max-height: 500px; }
  .help-content h3 { font-size: 15px; }
}
</style>
