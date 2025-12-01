<!-- MenuItem.vue -->
<template>
  <template v-if="!hasChildren">
    <el-menu-item
        :index="item.index"
        @click="handleClick(item)"
        :style="menuStyle"
    >
      <el-icon>
        <component :is="item.icon" />
      </el-icon>
      <span>{{ displayLabel }}</span>
    </el-menu-item>
  </template>
  <template v-else>
    <el-sub-menu :index="item.index">
      <template #title>
        <el-icon>
          <component :is="item.icon" />
        </el-icon>
        <span>{{ displayLabel }}</span>
      </template>
      <MenuItem
          v-for="child in item.children"
          :key="child.index"
          :item="child"
      />
    </el-sub-menu>
  </template>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMenuStore } from '@/store/menu.js';
import { useI18n } from 'vue-i18n'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  }
});

const router = useRouter();
const menuStore = useMenuStore();
const { t, locale } = useI18n()

const MENU_I18N_BY_PATH = {
  '/home': 'menu.home',
  '/userManager': 'menu.userManager',
  '/role': 'menu.role',
  '/permission': 'menu.permission',
  '/logs': 'menu.systemLog',
  '/test': 'menu.test'
}

const MENU_I18N_BY_LABEL = {
  '用户': 'menu.user',
  '系统管理': 'menu.system'
}

const MENU_GROUP_I18N_BY_INDEX = {
  '1': 'menu.user',
  '13': 'menu.system'
}

const displayLabel = computed(() => {
  const _lang = locale.value
  const pathKey = props.item.path && MENU_I18N_BY_PATH[props.item.path]
  if (pathKey) return t(pathKey)
  const idxKey = MENU_GROUP_I18N_BY_INDEX[props.item.index]
  if (idxKey) return t(idxKey)
  const normLabel = (props.item.label || '').trim()
  const labelKey = MENU_I18N_BY_LABEL[normLabel]
  return labelKey ? t(labelKey) : props.item.label
})

// 判断当前节点是否有子菜单
const hasChildren = computed(() => {
  return props.item.children && props.item.children.length > 0;
});

// 点击处理逻辑：路由跳转及菜单选中状态调整
function handleClick(item) {
  router.push(item.path);
  menuStore.selectMenu(item);
  menuStore.closeDrawer();
}

// 动态样式（根据当前选中状态）
const menuStyle = computed(() => {
  return {
    backgroundColor: menuStore.selectedMenu === props.item.index ? menuStore.systemColor : ''
  };
});
</script>
