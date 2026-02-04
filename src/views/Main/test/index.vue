<template>
  <el-card shadow="never">
    <template #header>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:16px;font-weight:700;">主题切换</span>
      </div>
    </template>
    <el-switch v-model="isDark" active-text="暗黑" inactive-text="明亮" @change="toggleDarkMode"/>
  </el-card>
  <el-card shadow="never" style="margin-top:16px;">
    <template #header>
      <div style="display:flex;align-items:center;gap:6px;">
        <span style="font-size:16px;font-weight:700;">富文本编辑器</span>
      </div>
    </template>
    <RichEditor v-model="content" :height="350" @change="onEditorChange"/>
  </el-card>
</template>
<script setup lang="ts">
import {ref, onMounted, defineAsyncComponent} from 'vue'
import {toggleDarkMode as _toggleDarkMode} from '@/utils/theme'
const RichEditor = defineAsyncComponent(() => import('@/components/Editor').then(m => m.Editor))

const isDark = ref(false)
const content = ref('<p>欢迎使用富文本编辑器</p>')

const toggleDarkMode = (val: string | number | boolean) => {
  _toggleDarkMode(Boolean(val))
}

const onEditorChange = () => {
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  _toggleDarkMode(isDark.value)
})
</script>
