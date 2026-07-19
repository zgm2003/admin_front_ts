<script setup lang="ts">
import { ref } from 'vue'
import { AppTable } from '@/components/Table'

// Table 演示
const tableData = ref([
  {id: 1, name: '张三', email: 'zhangsan@test.com', status: 1},
  {id: 2, name: '李四', email: 'lisi@test.com', status: 0},
  {id: 3, name: '王五', email: 'wangwu@test.com', status: 1}
])
const tableColumns = [
  {key: 'id', label: 'ID', width: 80},
  {key: 'name', label: '姓名', width: 120},
  {key: 'email', label: '邮箱'},
  {key: 'status', label: '状态', width: 100},
  {key: 'actions', label: '操作', width: 120, fixed: 'right'}
]
const tablePage = ref({current_page: 1, page_size: 10, total: 3})
const tableProps = [
  {name: 'columns', type: 'Array', default: '[]', desc: '列配置，key/label 必填，其他属性透传给 ElTableColumn'},
  {name: 'data', type: 'Array', default: '[]', desc: '表格数据'},
  {name: 'loading', type: 'Boolean', default: 'false', desc: '是否显示加载状态'},
  {name: 'rowKey', type: 'String', default: "'id'", desc: '行数据唯一标识字段'},
  {name: 'selectable', type: 'Boolean', default: 'false', desc: '是否显示多选列'},
  {name: 'rowClickSelect', type: 'Boolean', default: 'true', desc: '点击行是否触发选中'},
  {name: 'pagination', type: 'Object', default: 'null', desc: '分页配置 { current_page, page_size, total }'},
  {name: 'tableProps', type: 'Object', default: '{}', desc: 'ElTable 原生属性透传（stripe/size等）'},
  {name: 'showRefresh', type: 'Boolean', default: 'true', desc: '是否显示刷新按钮'},
  {name: 'showColumnSetting', type: 'Boolean', default: 'true', desc: '是否显示列设置按钮'},
  {name: 'showIndex', type: 'Boolean', default: 'false', desc: '是否显示序号列'},
  {name: 'fixedFooter', type: 'Boolean', default: 'true', desc: '分页器固定底部（需父容器有高度）'},
  {name: 'autoOverflowTooltip', type: 'Boolean', default: 'true', desc: '内容超出时自动显示 tooltip'}
]

const tableSlots = [
  {name: 'toolbar-left', desc: '工具栏左侧插槽'},
  {name: 'toolbar-right', desc: '工具栏右侧插槽'},
  {name: 'cell-[key]', desc: '单元格自定义插槽，如 #cell-status'}
]

const columnProps = [
  {name: 'key', type: 'String', required: '✔', desc: '字段名（必填）'},
  {name: 'label', type: 'String', required: '✔', desc: '列标题（必填）'},
  {name: 'align', type: 'String', required: '', desc: '对齐方式（默认 center，可设 left/right）'},
  {name: 'hidden', type: 'Boolean', required: '', desc: '是否默认隐藏'},
  {name: 'overflowTooltip', type: 'Boolean', required: '', desc: '超出显示 tooltip'},
  {name: '...rest', type: 'Record<string, unknown>', required: '', desc: '其他属性透传给 ElTableColumn（width/fixed/sortable等）'}
]

const tableEvents = [
  {name: '@refresh', desc: '点击刷新按钮时触发'},
  {name: '@selection-change', desc: '多选变化时触发'},
  {name: '@update:pagination', desc: '分页变化时触发'},
  {name: '@column-change', desc: '列显示变化时触发'}
]
</script>

<template>
  <el-tab-pane
    label="AppTable 表格"
    name="Table"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div
        class="demo-block"
        style="height: 300px"
      >
        <AppTable
          :columns="tableColumns"
          :data="tableData"
          :pagination="tablePage"
          :fixed-footer="true"
        />
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;AppTable :columns="columns" :data="data" :pagination="page" /&gt;
        </el-text>
      </div>
    </div>
    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table
        :data="tableProps"
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
      <h4>Slots</h4>
      <el-table
        :data="tableSlots"
        border
      >
        <el-table-column
          prop="name"
          label="插槽名"
          width="200"
        />
        <el-table-column
          prop="desc"
          label="说明"
        />
      </el-table>
    </div>
    <div class="demo-section">
      <h4>Column 配置项</h4>
      <el-table
        :data="columnProps"
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
          width="100"
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
      <h4>Events</h4>
      <el-table
        :data="tableEvents"
        border
      >
        <el-table-column
          prop="name"
          label="事件名"
          width="200"
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
