<script setup lang="ts">
import {ref, defineAsyncComponent} from 'vue'
import {AppTable} from '@/components/Table'
import {DIcon} from '@/components/DIcon'

const Editor = defineAsyncComponent(() => import('./components/Editor.vue'))
const MarkdownRenderer = defineAsyncComponent(() => import('@/components/MarkdownRenderer').then(m => m.MarkdownRenderer))

const activeTab = ref('Table')

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

// Editor 演示
const editorContent = ref('<p>这是一段示例内容</p>')

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
  {name: '...rest', type: 'any', required: '', desc: '其他属性透传给 ElTableColumn（width/fixed/sortable等）'}
]

const tableEvents = [
  {name: '@refresh', desc: '点击刷新按钮时触发'},
  {name: '@selection-change', desc: '多选变化时触发'},
  {name: '@update:pagination', desc: '分页变化时触发'},
  {name: '@column-change', desc: '列显示变化时触发'}
]

const editorProps = [
  {name: 'v-model / modelValue', type: 'String', default: "''", desc: 'HTML 内容，支持双向绑定'},
  {name: 'editorId', type: 'String', default: "'wangeditor-1'", desc: '编辑器唯一 ID（多编辑器时需不同）'},
  {name: 'height', type: 'String/Number', default: "'500px'", desc: '编辑器高度'},
  {name: 'uploadFolder', type: 'String', default: "'article'", desc: '图片/视频上传文件夹'},
  {name: 'useCosUpload', type: 'Boolean', default: 'true', desc: '是否使用云存储上传'},
  {name: 'editorConfig', type: 'Object', default: 'undefined', desc: 'wangEditor 配置项'}
]

const loadingDesc = `CustomLoading 是全局加载组件，绑定 userStore.loading 状态。
当 userStore.loading = true 时自动显示，无需手动调用。
通常在 API 请求开始时设置 loading = true，结束后设置为 false。`

// MarkdownRenderer 演示
const markdownContent = ref(`# Markdown 渲染示例

这是一段 **加粗** 和 *斜体* 文本。

## 代码块

\`\`\`typescript
const greeting = (name: string): string => {
  return \`Hello, \${name}!\`
}
console.log(greeting('World'))
\`\`\`

## 列表

- 项目一
- 项目二
- 项目三

## 引用

> 这是一段引用文本，支持多行内容。

## 表格

| 名称 | 类型 | 说明 |
|------|------|------|
| content | String | Markdown 内容 |

## 链接

[Element Plus](https://element-plus.org)
`)

const markdownProps = [
  {name: 'content', type: 'String', default: "''", desc: 'Markdown 文本内容'}
]

// DIcon 演示
const iconExamples = [
  {type: 'Element Plus', icon: 'UserFilled', desc: 'Element Plus 用户图标'},
  {type: 'Element Plus', icon: 'Setting', desc: 'Element Plus 设置图标'},
  {type: 'Element Plus', icon: 'HomeFilled', desc: 'Element Plus 首页图标'},
  {type: 'Iconify', icon: 'mdi:account', desc: 'Material Design Icons 用户'},
  {type: 'Iconify', icon: 'carbon:user', desc: 'Carbon 用户图标'},
  {type: 'Iconify', icon: 'lucide:home', desc: 'Lucide 首页图标'},
  {type: 'Iconify', icon: 'heroicons:cog-6-tooth', desc: 'Heroicons 设置图标'},
]

const dIconProps = [
  {name: 'icon', type: 'String', default: "''", desc: '图标名称（Element Plus 组件名或 Iconify 格式）'},
  {name: 'size', type: 'Number/String', default: '18', desc: '图标大小（像素）'}
]


</script>

<template>
  <div class="display-demo">
    <el-tabs v-model="activeTab">
      <!-- Table -->
      <el-tab-pane label="AppTable 表格" name="Table">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block" style="height: 300px">
            <AppTable :columns="tableColumns" :data="tableData" :pagination="tablePage" :fixed-footer="true"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;AppTable :columns="columns" :data="data" :pagination="page" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="tableProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Slots</h4>
          <el-table :data="tableSlots" border>
            <el-table-column prop="name" label="插槽名" width="200"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Column 配置项</h4>
          <el-table :data="columnProps" border>
            <el-table-column prop="name" label="属性名" width="160"/>
            <el-table-column prop="type" label="类型" width="100"/>
            <el-table-column prop="required" label="必填" width="80"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Events</h4>
          <el-table :data="tableEvents" border>
            <el-table-column prop="name" label="事件名" width="200"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Editor -->
      <el-tab-pane label="Editor 富文本" name="Editor">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <Editor v-model="editorContent" height="300px"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;Editor v-model="content" height="300px" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="editorProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="140"/>
            <el-table-column prop="default" label="默认值" width="140"/>
            <el-table-column prop="desc" label="说明"/>
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

      <!-- MarkdownRenderer -->
      <el-tab-pane label="MarkdownRenderer" name="MarkdownRenderer">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <MarkdownRenderer :content="markdownContent" />
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;MarkdownRenderer :content="markdownText" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="markdownProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="120"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>特性</h4>
          <el-alert type="info" :closable="false">
            <ul style="margin: 0; padding-left: 20px;">
              <li>基于 markdown-it 解析 Markdown</li>
              <li>代码高亮使用 highlight.js（github-dark 主题）</li>
              <li>代码块支持一键复制</li>
              <li>支持表格、引用、列表等常用语法</li>
              <li>适配暗色/亮色主题</li>
            </ul>
          </el-alert>
        </div>
      </el-tab-pane>

      <!-- DIcon -->
      <el-tab-pane label="DIcon 图标" name="DIcon">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <el-space :size="24" wrap>
              <div v-for="item in iconExamples" :key="item.icon" style="text-align: center;">
                <DIcon :icon="item.icon" :size="32" />
                <div style="margin-top: 8px; font-size: 12px; color: var(--el-text-color-secondary);">
                  {{ item.desc }}
                </div>
                <el-tag size="small" style="margin-top: 4px;">{{ item.type }}</el-tag>
              </div>
            </el-space>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;DIcon icon="UserFilled" :size="24" /&gt;</el-text>
            <br/>
            <el-text type="info">&lt;DIcon icon="mdi:account" :size="24" /&gt;</el-text>
          </div>
        </div>
        
        <div class="demo-section">
          <h4>不同尺寸</h4>
          <div class="demo-block">
            <el-space :size="24" align="center">
              <div style="text-align: center;">
                <DIcon icon="UserFilled" :size="16" />
                <div style="margin-top: 4px; font-size: 12px;">16px</div>
              </div>
              <div style="text-align: center;">
                <DIcon icon="mdi:account" :size="24" />
                <div style="margin-top: 4px; font-size: 12px;">24px</div>
              </div>
              <div style="text-align: center;">
                <DIcon icon="carbon:user" :size="32" />
                <div style="margin-top: 4px; font-size: 12px;">32px</div>
              </div>
              <div style="text-align: center;">
                <DIcon icon="lucide:user" :size="48" />
                <div style="margin-top: 4px; font-size: 12px;">48px</div>
              </div>
            </el-space>
          </div>
        </div>

        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="dIconProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="140"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>

        <div class="demo-section">
          <h4>特性</h4>
          <el-alert type="info" :closable="false">
            <ul style="margin: 0; padding-left: 20px;">
              <li>自动识别 Element Plus 和 Iconify 图标格式</li>
              <li>Element Plus 格式：直接使用组件名（如 UserFilled）</li>
              <li>Iconify 格式：使用 "前缀:名称" 格式（如 mdi:account）</li>
              <li>支持自定义尺寸</li>
              <li>统一的 API，无需关心底层实现</li>
            </ul>
          </el-alert>
        </div>

        <div class="demo-section">
          <h4>使用场景</h4>
          <el-alert type="success" :closable="false">
            <ul style="margin: 0; padding-left: 20px;">
              <li>菜单图标：左侧导航菜单</li>
              <li>按钮图标：操作按钮前缀图标</li>
              <li>列表图标：表格列中的图标展示</li>
              <li>状态图标：各种状态指示图标</li>
            </ul>
          </el-alert>
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
  .demo-block { padding: 16px; }
  .demo-section :deep(.el-table) { font-size: 12px; }
}
</style>
