<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMenuStore } from '@/store/menu';
import { useI18n } from 'vue-i18n'
import { resolveMenuLabel } from '@/utils/menuI18n'

const menuStore = useMenuStore();

const router = useRouter();
const { t, locale } = useI18n()

const tags = computed(() => menuStore.tabList);

function getTagLabel(tag) { return resolveMenuLabel(t, tag) }

const handleClose = (tag) => {
  menuStore.closeTag(tag);
  const lastTag = menuStore.tabList.filter(t => t !== tag).pop();
  if (lastTag) {
    router.push({ path: lastTag.path });
  }
};
const handleClick = (tag) => {
  router.push(tag.path);
};
const handleClear = () =>{
  menuStore.clearTabList()
  router.push('/home')
}

</script>


<template>
  <div class="tag">
    <el-tag
        v-for="(tag, index) in tags"
        :key="index"
        :closable="index !== 0"
        :type="$route.path === tag.path ? 'primary' : 'info'"
        @close="handleClose(tag)"
        @click="handleClick(tag)"
        size="large"
    >
      {{ getTagLabel(tag) }}
    </el-tag>
    <el-tag size="large" type="danger" @click="handleClear">清空</el-tag>

  </div>
</template>

<style lang="less" scoped>
.el-tag {
  cursor: pointer;
  margin-right: 20px;
  margin-bottom: 20px;

}
</style>
