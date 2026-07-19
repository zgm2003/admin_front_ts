<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

const Editor = defineAsyncComponent(() => import('./components/Editor.vue'))
// Editor 演示
const editorContent = ref('<p>这是一段示例内容</p>')
const editorProps = [
  {name: 'v-model / modelValue', type: 'String', default: "''", desc: 'HTML 内容，支持双向绑定'},
  {name: 'editorId', type: 'String', default: "'wangeditor-1'", desc: '编辑器唯一 ID（多编辑器时需不同）'},
  {name: 'height', type: 'String/Number', default: "'500px'", desc: '编辑器高度'},
  {name: 'uploadFolder', type: 'String', default: "'article'", desc: '图片/视频上传文件夹'},
  {name: 'useCosUpload', type: 'Boolean', default: 'true', desc: '是否使用云存储上传'},
  {name: 'editorConfig', type: 'Object', default: 'undefined', desc: 'wangEditor 配置项'}
]
</script>

<template>
  <el-tab-pane
    label="Editor 富文本"
    name="Editor"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div class="demo-block">
        <Editor
          v-model="editorContent"
          height="300px"
        />
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;Editor v-model="content" height="300px" /&gt;
        </el-text>
      </div>
    </div>
    <div class="demo-section">
      <h4>Attributes</h4>
      <el-table
        :data="editorProps"
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
          width="140"
        />
        <el-table-column
          prop="default"
          label="默认值"
          width="140"
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
