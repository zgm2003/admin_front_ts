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
import { resolveMenuLabel } from '@/utils/menuI18n'

const props = defineProps({ item: { type: Object, required: true } })
const router = useRouter();
const menuStore = useMenuStore();
const { t } = useI18n()

const displayLabel = computed(() => resolveMenuLabel(t, props.item))

const hasChildren = computed(() => props.item.children && props.item.children.length > 0)

function handleClick(item: any) {
  router.push(item.path);
  menuStore.selectMenu(item);
  menuStore.closeDrawer();
}

const menuStyle = computed(() => ({ backgroundColor: menuStore.selectedMenu === props.item.index ? menuStore.systemColor : '' }))
</script>
