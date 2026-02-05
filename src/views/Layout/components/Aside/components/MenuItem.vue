<template>
  <template v-if="!item.show_menu || item.show_menu === 1">
    <el-menu-item v-if="!hasChildren" :index="item.index" @click="handleClick(item)">
      <DIcon :icon="item.icon" :size="18" />
      <span>{{ displayLabel }}</span>
    </el-menu-item>
    <el-sub-menu v-else :index="item.index">
      <template #title>
        <DIcon :icon="item.icon" :size="18" />
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
import { useI18n } from 'vue-i18n';
import { resolveMenuLabel } from '@/utils/menuI18n';
import { DIcon } from '@/components/DIcon';

const props = defineProps({ item: { type: Object, required: true } });
const router = useRouter();
const menuStore = useMenuStore();
const { t } = useI18n();

const displayLabel = computed(() => resolveMenuLabel(t, props.item));
const hasChildren = computed(() => props.item.children?.length > 0);

function handleClick(item: any) {
  router.push(item.path);
  menuStore.closeDrawer();
}
</script>

<style scoped>
.el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-right: 3px solid var(--el-color-primary);
}
.el-menu-item:hover {
  background-color: var(--el-fill-color-light);
}
.d-icon {
  margin-right: 8px;
}
</style>

