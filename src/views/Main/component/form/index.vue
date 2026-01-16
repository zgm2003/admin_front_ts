<script setup lang="ts">
import {ref, computed} from 'vue'
import {Search} from '@/components/Search'
import SendCode from '@/components/SendCode'
import IconSelect from '@/components/IconSelect'
import RemoteSelect from '@/components/RemoteSelect/index.vue'

const activeTab = ref('Search')

// Search 演示
const searchForm = ref({keyword: '', status: ''})
const searchFields = computed(() => [
  {key: 'keyword', type: 'input' as const, label: '关键词', placeholder: '请输入关键词', width: 200},
  {
    key: 'status',
    type: 'select-v2' as const,
    label: '状态',
    placeholder: '请选择',
    width: 150,
    options: [{value: 1, label: '启用'}, {value: 0, label: '禁用'}]
  }
])
const handleQuery = (form: any) => {
  console.log('查询:', form)
}

// SendCode 演示
const code = ref('')
const testEmail = ref('test@example.com')

// IconSelect 演示
const iconSelectRef = ref<any>(null)
const selectedIcon = ref('')
const handleIconSelect = (name: string) => {
  selectedIcon.value = name
}

// RemoteSelect 演示
const remoteValue = ref('')
const mockFetch = async (params: any) => {
  // 模拟接口
  await new Promise(r => setTimeout(r, 500))
  const allData = Array.from({ length: 100 }, (_, i) => ({ label: `用户${i + 1}`, value: i + 1 }))
  const filtered = params.keyword 
    ? allData.filter(d => d.label.includes(params.keyword))
    : allData
  const start = (params.pageNo - 1) * params.pageSize
  return {
    list: filtered.slice(start, start + params.pageSize),
    total: filtered.length
  }
}

const searchProps = [
  {name: 'v-model / modelValue', type: 'Object', default: '{}', desc: '表单数据对象，支持双向绑定'},
  {name: 'fields', type: 'Field[]', default: '[]', desc: '字段配置数组'},
  {name: 'inline', type: 'Boolean', default: 'true', desc: '是否行内表单'},
  {name: 'collapseCount', type: 'Number', default: '1', desc: '折叠时显示的字段数量'},
  {name: 'size', type: 'String', default: "'default'", desc: '表单尺寸：large/default/small'}
]

const fieldProps = [
  {name: 'key', type: 'String', required: '✔', desc: '字段名（必填）'},
  {name: 'type', type: 'String', required: '✔', desc: "'input'|'select-v2'|'cascader'|'date-range'|'date'|'remote-select'|'slot'"},
  {name: 'label', type: 'String', required: '', desc: '字段标签'},
  {name: 'placeholder', type: 'String', required: '', desc: '占位符'},
  {name: 'width', type: 'Number', required: '', desc: '宽度（px）'},
  {name: 'options', type: 'Array', required: '', desc: '选项数据（select-v2/cascader）'},
  {name: 'cascaderProps', type: 'Object', required: '', desc: 'cascader 的 :props 配置'},
  {name: 'fetchMethod', type: 'Function', required: '', desc: 'remote-select 远程搜索方法，返回 { list, total }'},
  {name: 'labelField', type: 'String', required: '', desc: 'remote-select 选项标签字段，默认 label'},
  {name: 'valueField', type: 'String', required: '', desc: 'remote-select 选项值字段，默认 value'},
  {name: '...rest', type: 'any', required: '', desc: '其他属性透传给对应表单组件'}
]

const sendCodeProps = [
  {name: 'v-model', type: 'String', default: "''", desc: '验证码输入值'},
  {name: 'account', type: 'String', default: '-', desc: '发送目标（邮箱/手机号），必填'},
  {name: 'scene', type: 'String', default: '-', desc: "场景：'login'|'bind_phone'|'bind_email'|'change_password'"},
  {name: 'placeholder', type: 'String', default: "''", desc: '输入框占位符'},
  {name: 'sendDisabled', type: 'Boolean', default: 'false', desc: '额外禁用发送按钮条件'},
  {name: 'countdown', type: 'Number', default: '60', desc: '倒计时秒数'},
  {name: 'mobile', type: 'Boolean', default: 'false', desc: '是否强制移动端竖向布局'}
]

const iconSelectProps = [
  {name: '@select-icon', type: 'Event', default: '-', desc: '选中图标时触发，参数为图标名称'}
]

const iconSelectExpose = [
  {name: 'show()', type: 'Method', default: '-', desc: '打开图标选择弹窗'}
]

const remoteSelectProps = [
  {name: 'v-model', type: 'String/Number', default: "''", desc: '选中值'},
  {name: 'fetchMethod', type: 'Function', default: '-', desc: '远程搜索方法，返回 { list, total }（必填）'},
  {name: 'labelField', type: 'String', default: "'label'", desc: '选项标签字段'},
  {name: 'valueField', type: 'String', default: "'value'", desc: '选项值字段'},
  {name: 'keywordField', type: 'String', default: "'keyword'", desc: '搜索关键词参数名'},
  {name: 'pageField', type: 'String', default: "'pageNo'", desc: '页码参数名'},
  {name: 'pageSizeField', type: 'String', default: "'pageSize'", desc: '每页数量参数名'},
  {name: 'pageSize', type: 'Number', default: '20', desc: '每页数量'},
  {name: 'loadOnOpen', type: 'Boolean', default: 'true', desc: '打开时自动加载'},
  {name: 'debounce', type: 'Number', default: '300', desc: '防抖延迟(ms)'},
  {name: 'placeholder', type: 'String', default: "'请输入关键词搜索'", desc: '占位符'},
  {name: 'clearable', type: 'Boolean', default: 'true', desc: '是否可清空'},
  {name: 'width', type: 'String', default: "'200px'", desc: '宽度'}
]
</script>

<template>
  <div class="form-demo">
    <el-tabs v-model="activeTab">
      <!-- Search -->
      <el-tab-pane label="Search 搜索" name="Search">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <Search v-model="searchForm" :fields="searchFields" @query="handleQuery"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;Search v-model="searchForm" :fields="searchFields" @query="handleQuery" /&gt;
            </el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="searchProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Field 配置项</h4>
          <el-table :data="fieldProps" border>
            <el-table-column prop="name" label="属性名" width="160"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="required" label="必填" width="80"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Field type 可选值</h4>
          <el-table :data="[
            { type: 'input', desc: '文本输入框，透传 el-input 属性' },
            { type: 'select-v2', desc: '虚拟下拉选择器，需配置 options，透传 el-select-v2 属性' },
            { type: 'cascader', desc: '级联选择器，需配置 options 和 cascaderProps，透传 el-cascader 属性' },
            { type: 'date-range', desc: '日期范围选择器，透传 el-date-picker 属性' },
            { type: 'date', desc: '单日期选择器，透传 el-date-picker 属性' },
            { type: 'remote-select', desc: '远程搜索选择器，需配置 fetchMethod，支持滚动加载' },
            { type: 'slot', desc: '插槽，通过 #[key] 自定义内容' }
          ]" border>
            <el-table-column prop="type" label="type 值" width="150"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- SendCode -->
      <el-tab-pane label="SendCode 验证码" name="SendCode">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block" style="max-width: 400px">
            <SendCode v-model="code" :account="testEmail" scene="login" placeholder="请输入验证码"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;SendCode v-model="code" account="test@example.com" scene="login" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="sendCodeProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- IconSelect -->
      <el-tab-pane label="IconSelect 图标选择" name="IconSelect">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <el-space>
              <el-button @click="iconSelectRef?.show()">选择图标</el-button>
              <el-tag v-if="selectedIcon">
                <el-icon>
                  <component :is="selectedIcon"/>
                </el-icon>
                {{ selectedIcon }}
              </el-tag>
            </el-space>
            <IconSelect ref="iconSelectRef" @select-icon="handleIconSelect"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;IconSelect ref="iconSelectRef" @select-icon="handleIconSelect" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Events</h4>
          <el-table :data="iconSelectProps" border>
            <el-table-column prop="name" label="事件名" width="200"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Exposes</h4>
          <el-table :data="iconSelectExpose" border>
            <el-table-column prop="name" label="方法名" width="200"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- RemoteSelect -->
      <el-tab-pane label="RemoteSelect 远程搜索" name="RemoteSelect">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <el-space>
              <RemoteSelect v-model="remoteValue" :fetch-method="mockFetch" placeholder="搜索用户" />
              <el-tag v-if="remoteValue">选中: {{ remoteValue }}</el-tag>
            </el-space>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;RemoteSelect v-model="value" :fetch-method="fetchUsers" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="remoteSelectProps" border>
            <el-table-column prop="name" label="属性名" width="180"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="default" label="默认值" width="150"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>功能特性</h4>
          <ul style="line-height: 2; color: var(--el-text-color-regular);">
            <li>打开下拉框自动加载数据</li>
            <li>输入关键词远程搜索（自带防抖）</li>
            <li>滚动到底部自动加载更多</li>
            <li>支持自定义字段名和参数名</li>
          </ul>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.form-demo {
  height: 100%;
}

.demo-section {
  margin-bottom: 24px;
}

.demo-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.demo-block {
  padding: 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
}

.demo-code {
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

@media (max-width: 768px) {
  .demo-block {
    padding: 16px;
  }

  .demo-section :deep(.el-table) {
    font-size: 12px;
  }
}
</style>
