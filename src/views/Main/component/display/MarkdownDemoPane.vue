<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

const MarkdownRenderer = defineAsyncComponent(() => import('@/components/MarkdownRenderer').then(m => m.MarkdownRenderer))
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
</script>

<template>
  <el-tab-pane
    label="MarkdownRenderer"
    name="MarkdownRenderer"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div class="demo-block">
        <MarkdownRenderer :content="markdownContent" />
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;MarkdownRenderer :content="markdownText" /&gt;
        </el-text>
      </div>
    </div>
    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table
        :data="markdownProps"
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
      <h4>特性</h4>
      <el-alert
        type="info"
        :closable="false"
      >
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
</template>

<style scoped src="./pane.styles.css"></style>
