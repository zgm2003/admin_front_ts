<template>
  <template v-if="isVisible">
    <el-menu-item v-if="!hasChildren" :index="item.index" @click="handleClick(item)">
      <DIcon :icon="item.icon" :size="18" />
      <span class="menu-label">{{ displayLabel }}</span>
    </el-menu-item>
    <el-sub-menu v-else :index="item.index">
      <template #title>
        <DIcon :icon="item.icon" :size="18" />
        <span class="menu-label">{{ displayLabel }}</span>
      </template>
      <MenuItem v-for="child in item.children" :key="child.index" :item="child" />
    </el-sub-menu>
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMenuStore } from '@/store/menu'
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'
import { DIcon } from '@/components/DIcon'

interface MenuNode {
  index: string
  path?: string
  icon?: string
  show_menu?: number | boolean
  children?: MenuNode[]
  label?: string
  i18n_key?: string
}

const props = defineProps<{ item: MenuNode }>()

const router = useRouter()
const menuStore = useMenuStore()
const { t } = useI18n()

const displayLabel = computed(() => resolveMenuLabel(t, props.item))
const hasChildren = computed(() => (props.item.children?.length ?? 0) > 0)
const isVisible = computed(() => !props.item.show_menu || props.item.show_menu === 1)

function handleClick(item: MenuNode) {
  if (item.path) router.push(item.path)
  menuStore.closeDrawer()
}
</script>

<style scoped lang="scss">
.menu-label {
  min-width: 0;
}
</style>
