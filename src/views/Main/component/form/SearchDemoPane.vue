<script setup lang="ts">
import { computed, ref } from 'vue'
import { Search } from '@/components/Search'
import type { SearchFormModel } from '@/components/Search/types'

// Search 演示
const searchForm = ref<SearchFormModel>({keyword: '', status: ''})
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
const handleQuery = (form: SearchFormModel) => {
  console.log('查询:', form)
}
const searchProps = [
  {name: 'v-model / modelValue', type: 'Object', default: '{}', desc: '表单数据对象，支持双向绑定'},
  {name: 'fields', type: 'Field[]', default: '[]', desc: '字段配置数组'},
  {name: 'inline', type: 'Boolean', default: 'true', desc: '是否行内表单'},
  {name: 'collapseCount', type: 'Number', default: '1', desc: '折叠时显示的字段数量'},
  {name: 'size', type: 'String', default: "'default'", desc: '表单尺寸：large/default/small'}
]

const searchEvents = [
  {name: '@query', type: 'Event', desc: '点击查询按钮或回车时触发，参数为表单数据'},
  {name: '@reset', type: 'Event', desc: '点击重置按钮时触发，参数为重置后的表单数据'}
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
  {name: '...rest', type: 'Record<string, unknown>', required: '', desc: '其他属性透传给对应表单组件'}
]
</script>

<template>
  <el-tab-pane
    label="Search 搜索"
    name="Search"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div class="demo-block">
        <Search
          v-model="searchForm"
          :fields="searchFields"
          @query="handleQuery"
        />
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;Search v-model="searchForm" :fields="searchFields" @query="handleQuery" /&gt;
        </el-text>
      </div>
    </div>
    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table
        :data="searchProps"
        border
      >
        <el-table-column
          prop="name"
          label="属性名"
          width="200"
        />
        <el-table-column
          prop="type"
          label="类型"
          width="120"
        />
        <el-table-column
          prop="default"
          label="默认值"
          width="120"
        />
        <el-table-column
          prop="desc"
          label="说明"
        />
      </el-table>
    </div>
    <div class="demo-section">
      <h4>Events</h4>
      <el-table
        :data="searchEvents"
        border
      >
        <el-table-column
          prop="name"
          label="事件名"
          width="200"
        />
        <el-table-column
          prop="type"
          label="类型"
          width="120"
        />
        <el-table-column
          prop="desc"
          label="说明"
        />
      </el-table>
    </div>
    <div class="demo-section">
      <h4>Field 配置项</h4>
      <el-table
        :data="fieldProps"
        border
      >
        <el-table-column
          prop="name"
          label="属性名"
          width="160"
        />
        <el-table-column
          prop="type"
          label="类型"
          width="120"
        />
        <el-table-column
          prop="required"
          label="必填"
          width="80"
        />
        <el-table-column
          prop="desc"
          label="说明"
        />
      </el-table>
    </div>
    <div class="demo-section">
      <h4>Field type 可选值</h4>
      <el-table
        :data="[
          { type: 'input', desc: '文本输入框，透传 el-input 属性' },
          { type: 'select-v2', desc: '虚拟下拉选择器，需配置 options，透传 el-select-v2 属性' },
          { type: 'cascader', desc: '级联选择器，需配置 options 和 cascaderProps，透传 el-cascader 属性' },
          { type: 'date-range', desc: '日期范围选择器，透传 el-date-picker 属性' },
          { type: 'date', desc: '单日期选择器，透传 el-date-picker 属性' },
          { type: 'remote-select', desc: '远程搜索选择器，需配置 fetchMethod，支持滚动加载' },
          { type: 'slot', desc: '插槽，通过 #[key] 自定义内容' }
        ]"
        border
      >
        <el-table-column
          prop="type"
          label="type 值"
          width="150"
        />
        <el-table-column
          prop="desc"
          label="说明"
        />
      </el-table>
    </div>
  </el-tab-pane>
</template>

<style scoped src="./pane.styles.css"></style>
