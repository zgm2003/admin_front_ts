<script setup lang="ts">
import {ref} from 'vue'
import { UpMedia } from '@/components/UpMedia'
import { UpMediaList } from '@/components/UpMediaList'
import { UpFile } from '@/components/UpFile'

const activeTab = ref('UpMedia')

// UpMedia 图片演示
const imgUrl = ref('')
const imgUrl2 = ref('')
const imgUrlWithInput = ref('')

// UpMedia 视频演示
const videoUrl = ref('')
const videoUrlWithInput = ref('')

// UpMediaList 演示
const imgList = ref<any[]>([])

// UpFile 演示
const fileUrl = ref('')
const fileUrl2 = ref('')

const upMediaProps = [
  {name: 'v-model / modelValue', type: 'String', default: "''", desc: '媒体URL，支持双向绑定'},
  {name: 'type', type: "'image' | 'video'", default: "'image'", desc: '媒体类型：图片或视频'},
  {name: 'folderName', type: 'String', default: "'avatars'/'videos'", desc: '上传到云存储的文件夹名称'},
  {name: 'width', type: 'String', default: "'100px'", desc: '上传框宽高（正方形）'},
  {name: 'isClearable', type: 'Boolean', default: 'true', desc: '是否显示清除按钮'},
  {name: 'showInput', type: 'Boolean', default: 'false', desc: '是否显示手动输入URL的输入框'}
]

const upMediaListProps = [
  {name: 'v-model / modelValue', type: 'Array', default: '[]', desc: '媒体列表，每项包含 { name, url, uid }'},
  {name: 'folderName', type: 'String', default: "'images'", desc: '上传到云存储的文件夹名称'},
  {name: 'type', type: "'image' | 'video'", default: "'image'", desc: '媒体类型：图片或视频'}
]

const upFileProps = [
  {name: 'v-model / modelValue', type: 'String', default: "''", desc: '文件URL，支持双向绑定'},
  {name: 'folderName', type: 'String', default: '-', desc: '上传到云存储的文件夹名称（必填）'},
  {name: 'accept', type: 'String', default: "'*'", desc: '接受的文件类型，如 .zip,.exe'},
  {name: 'disabled', type: 'Boolean', default: 'false', desc: '是否禁用'},
  {name: 'tip', type: 'String', default: "''", desc: '提示文字'}
]

const upFileEvents = [
  {name: 'success', params: '{ url, size, name }', desc: '上传成功回调，返回文件URL、大小、文件名'}
]
</script>

<template>
  <div class="upload-demo">
    <el-tabs v-model="activeTab">
      <!-- UpMedia 图片 -->
      <el-tab-pane label="UpMedia 图片上传" name="UpMedia">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <UpMedia v-model="imgUrl"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpMedia v-model="imgUrl" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>自定义尺寸</h4>
          <div class="demo-block">
            <el-space>
              <UpMedia v-model="imgUrl2" width="80px"/>
              <UpMedia v-model="imgUrl2" width="120px"/>
              <UpMedia v-model="imgUrl2" width="150px"/>
            </el-space>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpMedia v-model="imgUrl" width="150px" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>带输入框</h4>
          <div class="demo-block">
            <UpMedia v-model="imgUrlWithInput" show-input width="80px"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpMedia v-model="imgUrl" show-input /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="upMediaProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="150"/>
            <el-table-column prop="default" label="默认值" width="150"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- UpMedia 视频 -->
      <el-tab-pane label="UpMedia 视频上传" name="UpMediaVideo">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <UpMedia v-model="videoUrl" type="video"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpMedia v-model="videoUrl" type="video" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>带输入框</h4>
          <div class="demo-block">
            <UpMedia v-model="videoUrlWithInput" type="video" show-input width="80px"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpMedia v-model="videoUrl" type="video" show-input /&gt;</el-text>
          </div>
        </div>
      </el-tab-pane>

      <!-- UpMediaList -->
      <el-tab-pane label="UpMediaList 多媒体列表" name="UpMediaList">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <UpMediaList v-model="imgList"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpMediaList v-model="imgList" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="upMediaListProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="100"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- UpFile -->
      <el-tab-pane label="UpFile 文件上传" name="UpFile">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <UpFile v-model="fileUrl" folder-name="releases" />
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpFile v-model="fileUrl" folder-name="releases" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>带提示和文件类型限制</h4>
          <div class="demo-block">
            <UpFile v-model="fileUrl2" folder-name="releases" accept=".zip,.exe" tip="支持 .zip/.exe 文件" />
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpFile v-model="fileUrl" folder-name="releases" accept=".zip,.exe" tip="支持 .zip/.exe 文件" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="upFileProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="100"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
        <div class="demo-section">
          <h4>Events</h4>
          <el-table :data="upFileEvents" border>
            <el-table-column prop="name" label="事件名" width="120"/>
            <el-table-column prop="params" label="参数" width="200"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.upload-demo {
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
  .demo-section :deep(.el-table-column) { min-width: 80px; }
}
</style>