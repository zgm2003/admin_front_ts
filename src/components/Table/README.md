# AppTable 统一表格组件

面向 Element Plus 的可复用表格组件，支持：列显隐设置、刷新按钮、选择列、分页、插槽定制、属性透传。

## 安装依赖

项目已包含以下依赖，无需额外安装：

```json
{
  "dependencies": {
    "vue": "^3.5.13",
    "element-plus": "^2.9.7",
    "vue-i18n": "^9.13.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

运行/构建/预览：

```bash
npm run dev
npm run build
npm run preview
```

## 引入方式

```ts
import { AppTable } from '@/components/Table'
```

## Props

- `columns: Array<{ key: string; label: string; width?: number; align?: 'left'|'center'|'right'; hidden?: boolean }>` 表头列定义
- `data: any[]` 表格数据
- `loading: boolean` 加载中
- `rowKey: string` 行唯一键（默认 `id`）
- `selectable: boolean` 是否显示选择列
- `rowClickSelect: boolean` 可选，支持勾选时点击整行切换选中（默认 `true`）
- `pagination: { current_page: number; page_size: number; total: number } | null` 分页对象，传入即显示分页
- `showRefresh: boolean` 是否显示刷新按钮（默认 `true`）
- `showColumnSetting: boolean` 是否显示列设置（默认 `true`）
- `tableProps: Record<string, any>` 透传给 `ElTable` 的属性（如 `border`、`defaultExpandAll`、`row-key` 等）

## Emits

- `refresh` 点击刷新按钮触发
- `selection-change` 选择项变化，参数为选中行数组
- `update:pagination` 分页变化，返回更新后的分页对象
- `column-change` 列显隐变化，返回当前选中列 `key[]`

## Slots

- `toolbar` 自定义工具栏区域（在刷新与列设置左侧）
- `cell-<key>` 指定列的单元格插槽（如 `cell-actions`、`cell-username`）

## 最小可复用示例

```vue
<script setup>
import { ref } from 'vue'
import { AppTable } from '@/components/Table'

const listLoading = ref(false)
const listData = ref([
  { id: 1, username: 'Tom' },
  { id: 2, username: 'Jerry' }
])
const page = ref({ current_page: 1, page_size: 10, total: 2 })

const columns = [
  { key: 'id', label: 'ID', width: 60 },
  { key: 'username', label: '用户名' },
  { key: 'actions', label: '操作', width: 180 }
]

function onPageChange(p) {
  page.value = p
}
function onRefresh() {
  // 触发数据刷新逻辑
}
</script>

<template>
  <AppTable
    :columns="columns"
    :data="listData"
    :loading="listLoading"
    row-key="id"
    :pagination="page"
    selectable
    :row-click-select="true"
    @refresh="onRefresh"
    @update:pagination="onPageChange"
  >
    <template #cell-actions="{ row }">
      <el-button type="primary" text @click="() => console.log('edit', row)">编辑</el-button>
      <el-button type="danger" text @click="() => console.log('del', row)">删除</el-button>
    </template>
  </AppTable>
  </template>
```

## 结合 i18n 的示例

```vue
<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
const { t } = useI18n()

const columns = [
  { key: 'id', label: t('user.table.id'), width: 60 },
  { key: 'username', label: t('user.table.username') },
  { key: 'actions', label: t('common.actions.action'), width: 180 }
]
</script>
```

## 传递 ElTable 属性（透传）

树形表格或展开行等场景，可通过 `tableProps` 透传：

```vue
<AppTable
  :columns="columns"
  :data="list"
  :pagination="page"
  :tableProps="{ rowKey: 'id', defaultExpandAll: true, border: true }"
/>
```

## 分页、选择、刷新

- 分页：监听 `@update:pagination`，服务端拉取新数据并回填 `page`
- 选择：监听 `@selection-change` 获取选中行数组，对应服务端批量操作
- 刷新：监听 `@refresh`，触发查询逻辑

## 列设置

右上角“列设置”支持勾选显示/隐藏列；被勾选的列以 `key` 保存并通过 `column-change` 事件抛出。

## 在业务页的实践参考

- 用户管理：`src/views/Main/user/userManager/index.vue`
- 角色管理：`src/views/Main/user/role/index.vue`
- 系统日志：`src/views/Main/system/log/index.vue`

这些页面均已使用 `AppTable` 替换原生 `el-table`，并通过插槽保留个性化渲染。

## 常见问题

- 列插槽不生效：确认 `columns` 中存在相同 `key`，且使用 `#cell-<key>` 命名的插槽。
- 未显示分页：仅当传入 `pagination` 对象时展示分页；确保包含 `current_page/page_size/total`。
- 需要 `ElTable` 的高级属性：通过 `tableProps` 统一透传（如 `row-key`、`default-expand-all`、`span-method` 等）。

