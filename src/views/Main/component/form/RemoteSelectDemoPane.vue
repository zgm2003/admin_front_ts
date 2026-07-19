<script setup lang="ts">
import { ref } from 'vue'
import { RemoteSelect } from '@/components/RemoteSelect'
import type { RemoteListFetchMethod } from '@/types/common'

interface MockRemoteSelectOption {
  label: string
  value: number
}

interface MockRemoteSelectParams {
  keyword?: string
  current_page?: number
  page_size?: number
}
// RemoteSelect 演示
const remoteValue = ref('')
const mockFetch: RemoteListFetchMethod<MockRemoteSelectOption, MockRemoteSelectParams> = async (params) => {
  // 模拟接口
  await new Promise<void>((resolve) => setTimeout(resolve, 500))
  const allData = Array.from({ length: 100 }, (_, i) => ({ label: `用户${i + 1}`, value: i + 1 }))
  const keyword = params.keyword
  const filtered = keyword
    ? allData.filter(d => d.label.includes(keyword))
    : allData
  const currentPage = params.current_page === undefined ? 1 : params.current_page
  const pageSize = params.page_size === undefined ? 20 : params.page_size
  const start = (currentPage - 1) * pageSize
  return {
    list: filtered.slice(start, start + pageSize),
    page: { total: filtered.length }
  }
}
const remoteSelectProps = [
  {name: 'v-model', type: 'String/Number', default: "''", desc: '选中值'},
  {name: 'fetchMethod', type: 'Function', default: '-', desc: '远程搜索方法，返回 { list, page: { total } }（必填）'},
  {name: 'labelField', type: 'String/Function', default: "'label'", desc: '选项标签字段，支持函数 (item) => string'},
  {name: 'valueField', type: 'String', default: "'value'", desc: '选项值字段'},
  {name: 'keywordField', type: 'String', default: "'keyword'", desc: '搜索关键词参数名'},
  {name: 'pageField', type: 'String', default: "'current_page'", desc: '页码参数名'},
  {name: 'pageSizeField', type: 'String', default: "'page_size'", desc: '每页数量参数名'},
  {name: 'pageSize', type: 'Number', default: '20', desc: '每页数量'},
  {name: 'loadOnOpen', type: 'Boolean', default: 'true', desc: '打开时自动加载'},
  {name: 'extraParams', type: 'Object', default: '{}', desc: '额外请求参数'},
  {name: 'debounce', type: 'Number', default: '300', desc: '防抖延迟(ms)'},
  {name: 'placeholder', type: 'String', default: "''", desc: '占位符'},
  {name: 'clearable', type: 'Boolean', default: 'true', desc: '是否可清空'},
  {name: 'width', type: 'String', default: "'200px'", desc: '宽度'}
]
</script>

<template>
  <el-tab-pane
    label="RemoteSelect 远程搜索"
    name="RemoteSelect"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div class="demo-block">
        <el-space>
          <RemoteSelect
            v-model="remoteValue"
            :fetch-method="mockFetch"
            placeholder="搜索用户"
          />
          <el-tag v-if="remoteValue">
            选中: {{ remoteValue }}
          </el-tag>
        </el-space>
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;RemoteSelect v-model="value" :fetch-method="fetchUsers" /&gt;
        </el-text>
      </div>
    </div>
    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table
        :data="remoteSelectProps"
        border
      >
        <el-table-column
          prop="name"
          label="属性名"
          width="180"
        />
        <el-table-column
          prop="type"
          label="类型"
          width="120"
        />
        <el-table-column
          prop="default"
          label="默认值"
          width="150"
        />
        <el-table-column
          prop="desc"
          label="说明"
        />
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
</template>

<style scoped src="./pane.styles.css"></style>
