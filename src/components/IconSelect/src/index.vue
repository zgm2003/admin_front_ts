<script setup lang="ts">
import { ref, computed } from 'vue'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Icon } from '@iconify/vue'

const iconBoxShow = ref(false)
const selectedIcon = ref('')
const searchTerm = ref('')
const iconType = ref<'all' | 'element' | 'iconify'>('all')
const emit = defineEmits(['select-icon'])

// Element Plus 图标
const elementIcons = ref(ElementPlusIconsVue)

// Iconify 图标分类
const iconifyCategories = [
  { label: 'Material Design', prefix: 'mdi', color: '#2196F3' },
  { label: 'Carbon', prefix: 'carbon', color: '#161616' },
  { label: 'Lucide', prefix: 'lucide', color: '#F56565' },
  { label: 'Heroicons', prefix: 'heroicons', color: '#8B5CF6' },
  { label: 'Tabler', prefix: 'tabler', color: '#0EA5E9' },
]

// Iconify 常用图标列表（扩展版，按分类）
const iconifyIcons = ref([
  // Material Design Icons (mdi)
  'mdi:account', 'mdi:account-circle', 'mdi:account-group', 'mdi:home', 'mdi:home-outline',
  'mdi:settings', 'mdi:cog', 'mdi:bell', 'mdi:bell-outline', 'mdi:email', 'mdi:email-outline',
  'mdi:calendar', 'mdi:calendar-month', 'mdi:chart-line', 'mdi:chart-bar', 'mdi:file-document',
  'mdi:folder', 'mdi:folder-open', 'mdi:image', 'mdi:image-outline', 'mdi:lock', 'mdi:lock-open',
  'mdi:logout', 'mdi:login', 'mdi:menu', 'mdi:menu-open', 'mdi:search', 'mdi:magnify',
  'mdi:star', 'mdi:star-outline', 'mdi:trash-can', 'mdi:delete', 'mdi:upload', 'mdi:download',
  'mdi:pencil', 'mdi:pen', 'mdi:check', 'mdi:check-circle', 'mdi:close', 'mdi:close-circle',
  'mdi:plus', 'mdi:plus-circle', 'mdi:minus', 'mdi:minus-circle', 'mdi:arrow-left', 'mdi:arrow-right',
  'mdi:arrow-up', 'mdi:arrow-down', 'mdi:refresh', 'mdi:reload', 'mdi:heart', 'mdi:heart-outline',
  'mdi:eye', 'mdi:eye-off', 'mdi:information', 'mdi:alert', 'mdi:help-circle', 'mdi:shield',
  'mdi:database', 'mdi:server', 'mdi:cloud', 'mdi:code-tags', 'mdi:bug', 'mdi:wrench',
  
  // Carbon
  'carbon:user', 'carbon:user-avatar', 'carbon:home', 'carbon:settings', 'carbon:notification',
  'carbon:email', 'carbon:calendar', 'carbon:chart-line', 'carbon:chart-bar', 'carbon:document',
  'carbon:folder', 'carbon:image', 'carbon:locked', 'carbon:unlocked', 'carbon:logout', 'carbon:login',
  'carbon:search', 'carbon:star', 'carbon:trash-can', 'carbon:upload', 'carbon:download',
  'carbon:edit', 'carbon:checkmark', 'carbon:close', 'carbon:add', 'carbon:subtract',
  'carbon:arrow-left', 'carbon:arrow-right', 'carbon:arrow-up', 'carbon:arrow-down',
  'carbon:renew', 'carbon:favorite', 'carbon:view', 'carbon:view-off', 'carbon:information',
  'carbon:warning', 'carbon:help', 'carbon:security', 'carbon:data-base', 'carbon:server',
  
  // Lucide
  'lucide:user', 'lucide:user-circle', 'lucide:home', 'lucide:settings', 'lucide:bell',
  'lucide:mail', 'lucide:calendar', 'lucide:trending-up', 'lucide:bar-chart', 'lucide:file-text',
  'lucide:folder', 'lucide:image', 'lucide:lock', 'lucide:unlock', 'lucide:log-out', 'lucide:log-in',
  'lucide:search', 'lucide:star', 'lucide:trash', 'lucide:upload', 'lucide:download',
  'lucide:edit', 'lucide:check', 'lucide:x', 'lucide:plus', 'lucide:minus',
  'lucide:arrow-left', 'lucide:arrow-right', 'lucide:arrow-up', 'lucide:arrow-down',
  'lucide:refresh-cw', 'lucide:heart', 'lucide:eye', 'lucide:eye-off', 'lucide:info',
  
  // Heroicons
  'heroicons:user', 'heroicons:user-circle', 'heroicons:home', 'heroicons:cog-6-tooth',
  'heroicons:bell', 'heroicons:envelope', 'heroicons:calendar', 'heroicons:chart-bar',
  'heroicons:document-text', 'heroicons:folder', 'heroicons:photo', 'heroicons:lock-closed',
  'heroicons:arrow-right-on-rectangle', 'heroicons:magnifying-glass', 'heroicons:star',
  'heroicons:trash', 'heroicons:arrow-up-tray', 'heroicons:arrow-down-tray', 'heroicons:pencil',
  'heroicons:check', 'heroicons:x-mark', 'heroicons:plus', 'heroicons:minus',
  
  // Tabler
  'tabler:user', 'tabler:home', 'tabler:settings', 'tabler:bell', 'tabler:mail',
  'tabler:calendar', 'tabler:chart-line', 'tabler:file', 'tabler:folder', 'tabler:photo',
  'tabler:lock', 'tabler:logout', 'tabler:search', 'tabler:star', 'tabler:trash',
  'tabler:upload', 'tabler:download', 'tabler:edit', 'tabler:check', 'tabler:x',
])

const show = () => { 
  iconBoxShow.value = true
  searchTerm.value = ''
  iconType.value = 'all'
}
defineExpose({ show })

const handleSelectIcon = (name: string) => { 
  selectedIcon.value = name
  emit('select-icon', name)
  // 不立即关闭，让用户看到选中效果
}

const confirmSelection = () => {
  if (selectedIcon.value) {
    iconBoxShow.value = false
  }
}

const clearSelection = () => {
  selectedIcon.value = ''
}

// 判断是否为 Iconify 图标
const isIconifyIcon = (icon: string) => icon && icon.includes(':')

// 过滤后的 Element Plus 图标
const filteredElementIcons = computed(() => {
  if (iconType.value === 'iconify') return []
  
  const term = searchTerm.value.trim().toLowerCase()
  const entries = Object.entries(elementIcons.value as any)
  
  if (!term) return entries
  return entries.filter(([name]) => name.toLowerCase().includes(term))
})

// 过滤后的 Iconify 图标
const filteredIconifyIcons = computed(() => {
  if (iconType.value === 'element') return []
  
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return iconifyIcons.value
  return iconifyIcons.value.filter(icon => icon.toLowerCase().includes(term))
})

// 图标类型选项
const iconTypeOptions = [
  { label: '全部图标', value: 'all' },
  { label: 'Element Plus', value: 'element' },
  { label: 'Iconify', value: 'iconify' },
]

// 获取图标显示名称
const getIconDisplayName = (icon: string) => {
  if (isIconifyIcon(icon)) {
    return icon.split(':')[1] || icon
  }
  return icon
}

// 获取图标分类颜色
const getIconCategoryColor = (icon: string) => {
  if (!isIconifyIcon(icon)) return '#409EFF'
  const prefix = icon.split(':')[0]
  const category = iconifyCategories.find(c => c.prefix === prefix)
  return category?.color || '#909399'
}
</script>

<template>
  <el-dialog v-model="iconBoxShow" title="选择图标" width="70%" :close-on-click-modal="false">
    <!-- 搜索和筛选 -->
    <div class="icon-select-header">
      <el-input 
        v-model="searchTerm" 
        placeholder="搜索图标名称..." 
        clearable 
        class="search-input"
        prefix-icon="Search"
      />
      <el-select v-model="iconType" placeholder="图标类型" style="width: 160px;">
        <el-option 
          v-for="opt in iconTypeOptions" 
          :key="opt.value" 
          :label="opt.label" 
          :value="opt.value" 
        />
      </el-select>
    </div>

    <!-- 当前选中 -->
    <div v-if="selectedIcon" class="selected-preview">
      <span class="preview-label">当前选中：</span>
      <div class="preview-icon">
        <Icon v-if="isIconifyIcon(selectedIcon)" :icon="selectedIcon" :width="32" :height="32" />
        <el-icon v-else :size="32"><component :is="selectedIcon" /></el-icon>
      </div>
      <span class="preview-name">{{ selectedIcon }}</span>
      <el-button size="small" @click="clearSelection">清除</el-button>
    </div>

    <!-- 图标网格 -->
    <el-scrollbar height="500px" class="icon-grid-container">
      <div class="icon-grid">
        <!-- Element Plus 图标 -->
        <div 
          v-for="([name, IconComponent]) in filteredElementIcons" 
          :key="name" 
          class="icon-item"
          :class="{ 'is-selected': selectedIcon === name }"
          @click="handleSelectIcon(name as any)"
        >
          <div class="icon-wrapper">
            <el-icon :size="28">
              <component :is="IconComponent" />
            </el-icon>
          </div>
          <div class="icon-name">{{ name }}</div>
          <div class="icon-badge" style="background: #409EFF;">Element</div>
        </div>

        <!-- Iconify 图标 -->
        <div 
          v-for="iconName in filteredIconifyIcons" 
          :key="iconName" 
          class="icon-item"
          :class="{ 'is-selected': selectedIcon === iconName }"
          @click="handleSelectIcon(iconName)"
        >
          <div class="icon-wrapper">
            <Icon :icon="iconName" :width="28" :height="28" />
          </div>
          <div class="icon-name">{{ getIconDisplayName(iconName) }}</div>
          <div class="icon-badge" :style="{ background: getIconCategoryColor(iconName) }">
            {{ iconName.split(':')[0] }}
          </div>
        </div>
      </div>

      <!-- 无结果提示 -->
      <el-empty 
        v-if="filteredElementIcons.length === 0 && filteredIconifyIcons.length === 0" 
        description="未找到匹配的图标"
        :image-size="100"
      />
    </el-scrollbar>

    <!-- 底部操作 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="footer-info">
          <el-text type="info" size="small">
            共 {{ filteredElementIcons.length + filteredIconifyIcons.length }} 个图标
          </el-text>
        </div>
        <div class="footer-actions">
          <el-button @click="iconBoxShow = false">取消</el-button>
          <el-button type="primary" @click="confirmSelection" :disabled="!selectedIcon">
            确定
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>
<style scoped>
.icon-select-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
}

.selected-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.preview-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--el-bg-color);
  border-radius: 6px;
  border: 2px solid var(--el-color-primary);
}

.preview-name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.icon-grid-container {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
}

.icon-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--el-bg-color);
}

.icon-item:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.icon-item.is-selected {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.icon-item:hover .icon-wrapper {
  color: var(--el-color-primary);
  transform: scale(1.1);
}

.icon-name {
  font-size: 12px;
  color: var(--el-text-color-regular);
  text-align: center;
  word-break: break-all;
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.icon-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 2px 6px;
  font-size: 10px;
  color: white;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  flex: 1;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .icon-grid { grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
  .icon-item { padding: 12px 6px; }
  .icon-wrapper { width: 40px; height: 40px; }
  .selected-preview { flex-wrap: wrap; }
}
</style>
