<script setup lang="ts">
import { ref } from 'vue'
import { AppTable } from '@/components/Table'
import { Editor } from '@/components/Editor'

const activeTab = ref('Table')

// Table 演示
const tableData = ref([
  { id: 1, name: '张三', email: 'zhangsan@test.com', status: 1 },
  { id: 2, name: '李四', email: 'lisi@test.com', status: 0 },
  { id: 3, name: '王五', email: 'wangwu@test.com', status: 1 }
])
const tableColumns = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'name', label: '姓名', width: 120 },
  { key: 'email', label: '邮箱' },
  { key: 'status', label: '状态', width: 100 }
]
const tablePage = ref({ current_page: 1, page_size: 10, total: 3 })

// Editor 演示
const editorContent = ref('<p>这是一段示例内容</p>')

const tableProps = [
  { name: 'columns', type: 'Array', default: '[]', desc: '列配置，每项包含 key/label/width/minWidth/align/overflowTooltip' },
  { name: 'data', type: 'Array', default: '[]', desc: '表格数据' },
  { name: 'loading', type: 'Boolean', default: 'false', desc: '是否显示加载状态' },
  { name: 'rowKey', type: 'String', default: "'id'", desc: '行数据唯一标识字段' },
  { name: 'selectable', type: 'Boolean', default: 'false', desc: '是否显示多选列' },
  { name: 'rowClickSelect', type: 'Boolean', default: 'true', desc: '点击行是否触发选中' },
  { name: 'pagination', type: 'Object', default: 'null', desc: '分页配置 { current_page, page_size, total }' },
  { name: 'showRefresh', type: 'Boolean', default: 'true', desc: '是否显示刷新按钮' },
  { name: 'showColumnSetting', type: 'Boolean', default: 'true', desc: '是否显示列设置按钮' },
  { name: 'showIndex', type: 'Boolean', default: 'false', desc: '是否显示序号列' },
  { name: 'fixedFooter', type: 'Boolean', default: 'true', desc: '分页器固定底部（需父容器有高度）' },
  { name: 'autoOverflowTooltip', type: 'Boolean', default: 'true', desc: '内容超出时自动显示 tooltip' }
]

const tableSlots = [
  { name: 'toolbar-left', desc: '工具栏左侧插槽' },
  { name: 'toolbar-right', desc: '工具栏右侧插槽' },
  { name: 'cell-[key]', desc: '单元格自定义插槽，如 #cell-status' }
]

const tableEvents = [
  { name: '@refresh', desc: '点击刷新按钮时触发' },
  { name: '@selection-change', desc: '多选变化时触发' },
  { name: '@update:pagination', desc: '分页变化时触发' },
  { name: '@column-change', desc: '列显示变化时触发' }
]

const editorProps = [
  { name: 'v-model / modelValue', type: 'String', default: "''", desc: 'HTML 内容，支持双向绑定' },
  { name: 'editorId', type: 'String', default: "'wangeditor-1'", desc: '编辑器唯一 ID（多编辑器时需不同）' },
  { name: 'height', type: 'String/Number', default: "'500px'", desc: '编辑器高度' },
  { name: 'uploadFolder', type: 'String', default: "'article'", desc: '图片/视频上传文件夹' },
  { name: 'useCosUpload', type: 'Boolean', default: 'true', desc: '是否使用云存储上传' },
  { name: 'editorConfig', type: 'Object', default: 'undefined', desc: 'wangEditor 配置项' }
]

const loadingDesc = `CustomLoading 是全局加载组件，绑定 userStore.loading 状态。
当 userStore.loading = true 时自动显示，无需手动调用。
通常在 API 请求开始时设置 loading = true，结束后设置为 false。`
</script>

<template>
  <div class="display-demo">
    <el-tabs v-model="activeTab">
      <!-- Table -->
      <el-tab-pane label="AppTable 表格" name="Table">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block" style="height: 300px">
            <AppTable :columns="tableColumns" :data="tableData" :pagination="tablePage" :fixed-footer="true" />
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;AppTable :columns="columns" :data="data" :pagination="page" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="tableProps" border>
            <el-table-column prop="name" label="属性名" width="200" />
            <el-table-column prop="type" label="类型" width="120" />
            <el-table-column prop="default" label="默认值" width="120" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Slots</h4>
          <el-table :data="tableSlots" border>
            <el-table-column prop="name" label="插槽名" width="200" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Events</h4>
          <el-table :data="tableEvents" border>
            <el-table-column prop="name" label="事件名" width="200" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Editor -->
      <el-tab-pane label="Editor 富文本" name="Editor">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <Editor v-model="editorContent" height="300px" />
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;Editor v-model="content" height="300px" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="editorProps" border>
            <el-table-column prop="name" label="属性名" width="200" />
            <el-table-column prop="type" label="类型" width="140" />
            <el-table-column prop="default" label="默认值" width="140" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- CustomLoading -->
      <el-tab-pane label="CustomLoading 加载" name="CustomLoading">
        <div class="demo-section">
          <h4>说明</h4>
          <div class="demo-block">
            <el-alert type="info" :closable="false">
              <pre style="margin:0;white-space:pre-wrap">{{ loadingDesc }}</pre>
            </el-alert>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;CustomLoading /&gt; (放在 App.vue 根节点)</el-text>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.display-demo {
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
