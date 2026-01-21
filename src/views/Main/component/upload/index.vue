<script setup lang="ts">
import {ref} from 'vue'
import { UpImg } from '@/components/UpImg'
import { UpImgList } from '@/components/UpImgList'
import { UpVideo } from '@/components/UpVideo'

const activeTab = ref('UpImg')

// UpImg 演示
const imgUrl = ref('')
const imgUrl2 = ref('')
const imgUrlWithInput = ref('')

// UpImgList 演示
const imgList = ref<any[]>([])

// UpVideo 演示
const videoUrl = ref('')
const videoUrlWithInput = ref('')

const upImgProps = [
  {name: 'v-model / modelValue', type: 'String', default: "''", desc: '图片URL，支持双向绑定'},
  {name: 'folderName', type: 'String', default: "'avatars'", desc: '上传到云存储的文件夹名称'},
  {name: 'width', type: 'String', default: "'100px'", desc: '上传框宽高（正方形）'},
  {name: 'isClearable', type: 'Boolean', default: 'true', desc: '是否显示清除按钮'},
  {name: 'showInput', type: 'Boolean', default: 'false', desc: '是否显示手动输入URL的输入框'}
]

const upImgListProps = [
  {name: 'v-model / modelValue', type: 'Array', default: '[]', desc: '图片列表，每项包含 { name, url, uid }'},
  {name: 'folderName', type: 'String', default: "'avatars'", desc: '上传到云存储的文件夹名称'}
]

const upVideoProps = [
  {name: 'v-model / modelValue', type: 'String', default: "''", desc: '视频URL，支持双向绑定'},
  {name: 'folderName', type: 'String', default: "'videos'", desc: '上传到云存储的文件夹名称'},
  {name: 'width', type: 'String', default: "'100px'", desc: '上传框宽高（正方形）'},
  {name: 'isClearable', type: 'Boolean', default: 'true', desc: '是否显示清除按钮'},
  {name: 'showInput', type: 'Boolean', default: 'false', desc: '是否显示手动输入URL的输入框'}
]
</script>

<template>
  <div class="upload-demo">
    <el-tabs v-model="activeTab">
      <!-- UpImg -->
      <el-tab-pane label="UpImg 单图上传" name="UpImg">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <UpImg v-model="imgUrl"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpImg v-model="imgUrl" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>自定义尺寸</h4>
          <div class="demo-block">
            <el-space>
              <UpImg v-model="imgUrl2" width="80px"/>
              <UpImg v-model="imgUrl2" width="120px"/>
              <UpImg v-model="imgUrl2" width="150px"/>
            </el-space>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpImg v-model="imgUrl" width="150px" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>带输入框</h4>
          <div class="demo-block">
            <UpImg v-model="imgUrlWithInput" show-input width="80px"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpImg v-model="imgUrl" show-input /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="upImgProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="100"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- UpImgList -->
      <el-tab-pane label="UpImgList 多图上传" name="UpImgList">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <UpImgList v-model="imgList"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpImgList v-model="imgList" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="upImgListProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="100"/>
            <el-table-column prop="default" label="默认值" width="120"/>
            <el-table-column prop="desc" label="说明"/>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- UpVideo -->
      <el-tab-pane label="UpVideo 视频上传" name="UpVideo">
        <div class="demo-section">
          <h4>基础用法</h4>
          <div class="demo-block">
            <UpVideo v-model="videoUrl"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpVideo v-model="videoUrl" /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>带输入框</h4>
          <div class="demo-block">
            <UpVideo v-model="videoUrlWithInput" show-input width="80px"/>
          </div>
          <div class="demo-code">
            <el-text type="info">&lt;UpVideo v-model="videoUrl" show-input /&gt;</el-text>
          </div>
        </div>
        <div class="demo-section">
          <h4>Attributes</h4>
          <el-table :data="upVideoProps" border>
            <el-table-column prop="name" label="属性名" width="200"/>
            <el-table-column prop="type" label="类型" width="100"/>
            <el-table-column prop="default" label="默认值" width="120"/>
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
  .demo-block {
    padding: 16px;
  }

  .demo-section :deep(.el-table) {
    font-size: 12px;
  }

  .demo-section :deep(.el-table-column) {
    min-width: 80px;
  }
}
</style>