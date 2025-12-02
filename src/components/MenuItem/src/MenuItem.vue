<!-- MenuItem.vue -->
<template>
  <template v-if="!hasChildren">
    <el-menu-item :index="item.index" @click="handleClick(item)" :style="menuStyle">
      <el-icon><component :is="item.icon" /></el-icon>
      <span>{{ displayLabel }}</span>
    </el-menu-item>
  </template>
  <template v-else>
    <el-sub-menu :index="item.index">
      <template #title>
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ displayLabel }}</span>
      </template>
      <MenuItem v-for="child in item.children" :key="child.index" :item="child" />
    </el-sub-menu>
  </template>
  </template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMenuStore } from '@/store/menu';
import { useI18n } from 'vue-i18n'

const props = defineProps({ item: { type: Object, required: true } })
const router = useRouter();
const menuStore = useMenuStore();
const { t } = useI18n()

const MENU_I18N_BY_PATH = { '/home': 'menu.home', '/userManager': 'menu.userManager', '/role': 'menu.role', '/permission': 'menu.permission', '/logs': 'menu.systemLog', '/test': 'menu.test' }
const MENU_I18N_BY_LABEL = { '用户': 'menu.user', '系统管理': 'menu.system' }
const MENU_GROUP_I18N_BY_INDEX = { '1': 'menu.user', '13': 'menu.system' }

const displayLabel = computed(() => {
  if (props.item.i18nKey) return t(props.item.i18nKey)
  const pathKey = props.item.path && (MENU_I18N_BY_PATH as any)[props.item.path]
  if (pathKey) return t(pathKey)
  const idxKey = (MENU_GROUP_I18N_BY_INDEX as any)[props.item.index]
  if (idxKey) return t(idxKey)
  const normLabel = (props.item.label || '').trim()
  const labelKey = (MENU_I18N_BY_LABEL as any)[normLabel]
  return labelKey ? t(labelKey) : props.item.label
})

const hasChildren = computed(() => props.item.children && props.item.children.length > 0)

function handleClick(item: any) {
  router.push(item.path);
  menuStore.selectMenu(item);
  menuStore.closeDrawer();
}

const menuStyle = computed(() => ({ backgroundColor: menuStore.selectedMenu === props.item.index ? menuStore.systemColor : '' }))
</script>
