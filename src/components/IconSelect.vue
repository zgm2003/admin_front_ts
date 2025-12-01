<script setup lang="ts">
import { ref, computed, defineEmits, defineExpose } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const icons = ref(ElementPlusIconsVue)
const iconBoxShow = ref(false)
const selectedIcon = ref('')
const searchTerm = ref('')
const emit = defineEmits(['select-icon'])
const show = () => { iconBoxShow.value = true }
defineExpose({ show })
const handleSelectIcon = (name: string) => { selectedIcon.value = name; iconBoxShow.value = false; emit('select-icon', name) }
const filteredIcons = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return Object.entries(icons.value as any)
  return Object.entries(icons.value as any).filter(([name]) => name.toLowerCase().includes(term))
})
</script>

<template>
  <el-dialog v-model="iconBoxShow" title="选择图标" width="50%">
    <el-input v-model="searchTerm" placeholder="搜索图标" clearable class="search-input" style="margin-bottom:12px" />
    <el-scrollbar height="400px">
      <el-space wrap style="width:100%">
        <el-card v-for="([name, Icon]) in filteredIcons" :key="name" shadow="hover" class="card" @click="handleSelectIcon(name as any)">
          <div class="icon-wrapper"><el-icon :size="24"><component :is="Icon" /></el-icon></div>
          <div class="name-wrapper"><el-text>{{ name }}</el-text></div>
        </el-card>
      </el-space>
    </el-scrollbar>
  </el-dialog>
  </template>
<style scoped>
.search-input{width:100%}
.card{width:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:border-color .2s,color .2s}
.card:hover{border:1px solid #409EFF;cursor:pointer;color:#409EFF}
.icon-wrapper{display:flex;justify-content:center;margin-bottom:8px}
.name-wrapper{text-align:center}
</style>
