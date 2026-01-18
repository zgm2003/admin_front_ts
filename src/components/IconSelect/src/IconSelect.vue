<script setup lang="ts">
import { ref, computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'

const iconBoxShow = ref(false)
const selectedIcon = ref('')
const searchTerm = ref('')
const activeTab = ref<'element' | 'iconify'>('element')
const emit = defineEmits(['select-icon'])

// Element Plus 图标
const elementIcons = ref(ElementPlusIconsVue)

// Iconify 常用图标集（可扩展）
const iconifyCollections = ref([
  { prefix: 'mdi', name: 'Material Design Icons' },
  { prefix: 'carbon', name: 'Carbon' },
  { prefix: 'lucide', name: 'Lucide' },
  { prefix: 'heroicons', name: 'Heroicons' },
  { prefix: 'tabler', name: 'Tabler' },
])

// Iconify 常用图标列表（示例，可根据需要扩展）
const iconifyIcons = ref([
  'mdi:account', 'mdi:home', 'mdi:settings', 'mdi:bell', 'mdi:email',
  'mdi:calendar', 'mdi:chart-line', 'mdi:file-document', 'mdi:folder',
  'mdi:image', 'mdi:lock', 'mdi:logout', 'mdi:menu', 'mdi:search',
  'mdi:star', 'mdi:trash-can', 'mdi:upload', 'mdi:download', 'mdi:pencil',
  'mdi:check', 'mdi:close', 'mdi:plus', 'mdi:minus', 'mdi:arrow-left',
  'mdi:arrow-right', 'mdi:arrow-up', 'mdi:arrow-down', 'mdi:refresh',
  'mdi:cog', 'mdi:heart', 'mdi:eye', 'mdi:eye-off', 'mdi:information',
  'carbon:user', 'carbon:home', 'carbon:settings', 'carbon:notification',
  'carbon:email', 'carbon:calendar', 'carbon:chart-line', 'carbon:document',
  'carbon:folder', 'carbon:image', 'carbon:locked', 'carbon:logout',
  'lucide:user', 'lucide:home', 'lucide:settings', 'lucide:bell',
  'heroicons:user', 'heroicons:home', 'heroicons:cog-6-tooth',
  'tabler:user', 'tabler:home', 'tabler:settings', 'tabler:bell',
])

const show = () => { 
  iconBoxShow.value = true
  activeTab.value = 'element' // 默认显示 Element Plus
}
defineExpose({ show })

const handleSelectIcon = (name: string) => { 
  selectedIcon.value = name
  iconBoxShow.value = false
  emit('select-icon', name)
}

const filteredElementIcons = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return Object.entries(elementIcons.value as any)
  return Object.entries(elementIcons.value as any).filter(([name]) => 
    name.toLowerCase().includes(term)
  )
})

const filteredIconifyIcons = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return iconifyIcons.value
  return iconifyIcons.value.filter(icon => 
    icon.toLowerCase().includes(term)
  )
})
</script>

<template>
  <el-dialog v-model="iconBoxShow" title="选择图标" width="60%">
    <el-tabs v-model="activeTab" class="icon-tabs">
      <el-tab-pane label="Element Plus Icons" name="element">
        <el-input 
          v-model="searchTerm" 
          placeholder="搜索 Element Plus 图标" 
          clearable 
          class="search-input" 
          style="margin-bottom:12px" 
        />
        <el-scrollbar height="400px">
          <el-space wrap style="width:100%">
            <el-card 
              v-for="([name, IconComponent]) in filteredElementIcons" 
              :key="name" 
              shadow="hover" 
              class="card" 
              @click="handleSelectIcon(name as any)"
            >
              <div class="icon-wrapper">
                <el-icon :size="24">
                  <component :is="IconComponent" />
                </el-icon>
              </div>
              <div class="name-wrapper">
                <el-text class="icon-name">{{ name }}</el-text>
              </div>
            </el-card>
          </el-space>
        </el-scrollbar>
      </el-tab-pane>
      
      <el-tab-pane label="Iconify Icons" name="iconify">
        <el-input 
          v-model="searchTerm" 
          placeholder="搜索 Iconify 图标（如 mdi:account）" 
          clearable 
          class="search-input" 
          style="margin-bottom:12px" 
        />
        <el-alert 
          type="info" 
          :closable="false" 
          style="margin-bottom:12px"
        >
          提示：Iconify 图标格式为 "前缀:名称"，如 mdi:account、carbon:user
        </el-alert>
        <el-scrollbar height="400px">
          <el-space wrap style="width:100%">
            <el-card 
              v-for="iconName in filteredIconifyIcons" 
              :key="iconName" 
              shadow="hover" 
              class="card" 
              @click="handleSelectIcon(iconName)"
            >
              <div class="icon-wrapper">
                <Icon :icon="iconName" :width="24" :height="24" />
              </div>
              <div class="name-wrapper">
                <el-text class="icon-name">{{ iconName }}</el-text>
              </div>
            </el-card>
          </el-space>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>
<style scoped>
.search-input{width:100%}
.icon-tabs{margin-top:-12px}
.card{width:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:border-color .2s,color .2s;cursor:pointer}
.card:hover{border:1px solid #409EFF;color:#409EFF}
.icon-wrapper{display:flex;justify-content:center;align-items:center;margin-bottom:8px;height:32px}
.name-wrapper{text-align:center;width:100%}
.icon-name{font-size:12px;word-break:break-all;line-height:1.4}
</style>
