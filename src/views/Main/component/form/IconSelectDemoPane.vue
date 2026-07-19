<script setup lang="ts">
import { ref } from 'vue'
import IconSelect from '@/views/Main/permission/permission/components/IconSelect.vue'

interface IconSelectExpose {
  show(): void
}
// IconSelect 演示
const iconSelectRef = ref<IconSelectExpose | null>(null)
const selectedIcon = ref('')
const handleIconSelect = (name: string) => {
  selectedIcon.value = name
}
const iconSelectProps = [
  {name: '@select-icon', type: 'Event', default: '-', desc: '选中图标时触发，参数为图标名称'}
]

const iconSelectExpose = [
  {name: 'show()', type: 'Method', default: '-', desc: '打开图标选择弹窗'}
]
</script>

<template>
  <el-tab-pane
    label="IconSelect 图标选择"
    name="IconSelect"
  >
    <div class="demo-section">
      <h4>基础用法</h4>
      <div class="demo-block">
        <el-space>
          <el-button @click="iconSelectRef?.show()">
            选择图标
          </el-button>
          <el-tag v-if="selectedIcon">
            <el-icon>
              <component :is="selectedIcon" />
            </el-icon>
            {{ selectedIcon }}
          </el-tag>
        </el-space>
        <IconSelect
          ref="iconSelectRef"
          @select-icon="handleIconSelect"
        />
      </div>
      <div class="demo-code">
        <el-text type="info">
          &lt;IconSelect ref="iconSelectRef" @select-icon="handleIconSelect" /&gt;
        </el-text>
      </div>
    </div>
    <div class="demo-section">
      <h4>Events</h4>
      <el-table
        :data="iconSelectProps"
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
      <h4>Exposes</h4>
      <el-table
        :data="iconSelectExpose"
        border
      >
        <el-table-column
          prop="name"
          label="方法名"
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
  </el-tab-pane>
</template>

<style scoped src="./pane.styles.css"></style>
