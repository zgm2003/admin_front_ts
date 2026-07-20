<template>
  <AppDialog
    v-model="show"
    :aria-label="t('search.placeholder')"
    :width="dialogLayout.width"
    class="search-dialog"
    :show-close="false"
    body-padding="0"
    destroy-on-close
    append-to-body
  >
    <div
      class="search-container"
      :style="{ height: dialogLayout.bodyHeight }"
    >
      <el-button
        v-if="isMobile"
        class="close-btn"
        circle
        :aria-label="t('common.actions.close')"
        @click="show = false"
      >
        <el-icon>
          <Close />
        </el-icon>
      </el-button>
      <div class="search-header">
        <img
          src="/logo.png"
          class="logo"
          alt=""
          aria-hidden="true"
        >
        <el-input
          v-model="keyword"
          :aria-label="t('search.placeholder')"
          :placeholder="t('search.placeholder')"
          clearable
          :prefix-icon="Search"
          class="search-input"
          size="large"
        />
      </div>
      <div
        v-if="!isMobile"
        class="search-hints"
      >
        <div class="hint-item">
          <kbd>Ctrl</kbd> + <kbd>K</kbd> {{ t('search.wake') }}
        </div>
        <div class="hint-item">
          <el-icon>
            <Top />
          </el-icon>
          <el-icon>
            <Bottom />
          </el-icon>
          {{ t('search.navigate') }}
        </div>
        <div class="hint-item">
          <kbd>Enter</kbd> {{ t('search.enter') }}
        </div>
        <div class="hint-item">
          <kbd>Esc</kbd> {{ t('search.esc') }}
        </div>
      </div>
      <el-scrollbar
        :height="dialogLayout.resultHeight"
        class="result-scroll"
      >
        <el-empty
          v-if="filtered.length===0"
          :description="t('search.empty')"
        />
        <div
          v-for="(it, index) in filtered"
          :key="it.path"
          :class="['result-item', { active: index === activeIndex }]"
          @click="go(it)"
          @mouseenter="activeIndex = index"
        >
          <div class="row">
            <DIcon
              :icon="it.icon"
              :size="20"
              class="left-icon"
            />
            <div class="content">
              <div class="title">
                {{ resolveMenuLabel(t, it) }}
              </div>
              <div class="sub">
                {{ it.path }}
              </div>
            </div>
            <div
              v-if="index === activeIndex"
              class="enter-icon"
            >
              <el-icon>
                <Right />
              </el-icon>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
import {computed, onMounted, onBeforeUnmount, shallowRef, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useUserStore} from '@/store/user'
import {Top, Bottom, Right, Close, Search} from '@element-plus/icons-vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import {resolveMenuLabel} from '@/views/Layout/utils/menuLabel'
import {DIcon} from '@/components/DIcon'
import { resolveSearchDialogLayout } from './search-dialog'
import type { PermissionMenuItem } from '@/types/user'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
const show = computed({get: () => props.modelValue, set: (v: boolean) => emit('update:modelValue', v)})
const router = useRouter()
const userStore = useUserStore()
const keyword = shallowRef('')
const activeIndex = shallowRef(0)
const isMobile = useIsMobile()
const {t} = useI18n()
const dialogLayout = computed(() => resolveSearchDialogLayout(isMobile.value))

const SEARCH_RESULT_DEFAULT_ICON = 'Menu'

type SearchMenuNode = PermissionMenuItem & { name?: string }
type SearchResultItem = Pick<SearchMenuNode, 'label' | 'path' | 'icon' | 'i18n_key' | 'name'>

const toSearchResultItem = (node: SearchMenuNode): SearchResultItem => ({
  label: node.label,
  path: node.path,
  icon: node.icon ? node.icon : SEARCH_RESULT_DEFAULT_ICON,
  i18n_key: node.i18n_key,
  name: node.name,
})

const collectSearchItems = (nodes: SearchMenuNode[], result: SearchResultItem[]) => {
  nodes.forEach(node => {
    if (node.path) {
      result.push(toSearchResultItem(node))
    }
    if (node.children.length > 0) {
      collectSearchItems(node.children, result)
    }
  })
}

const list = computed<SearchResultItem[]>(() => {
  const result: SearchResultItem[] = []
  collectSearchItems(userStore.permissions, result)
  return result
})

const filtered = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) {
    return list.value
  }

  return list.value.filter(item =>
    item.label.toLowerCase().includes(query) || item.path.toLowerCase().includes(query)
  )
})

watch(keyword, () => {
  activeIndex.value = 0
})
watch(show, (v) => {
  if (v) {
    keyword.value = '';
    activeIndex.value = 0
  }
})

const go = (it: SearchResultItem) => {
  show.value = false
  router.push(it.path)
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') show.value = false
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
    e.preventDefault()
    show.value = !show.value
  }

  if (!show.value) return

  if (e.key === 'Enter') {
    e.preventDefault()
    const it = filtered.value[activeIndex.value]
    if (it) go(it)
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
    scrollToActive()
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % filtered.value.length
    scrollToActive()
  }
}

const scrollToActive = () => {
  const el = document.querySelector('.result-item.active')
  if (el) el.scrollIntoView({block: 'nearest'})
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped lang="scss">
.search-dialog {
  :deep(.el-dialog__header) {
    display: none;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.search-container {
  position: relative;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.search-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.logo {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.search-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    padding: 8px 16px;
  }

  :deep(.el-input__inner) {
    font-size: 16px;
    height: 40px;
  }
}

.search-hints {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-wrap: wrap;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 6px;
}

kbd {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 2px 6px;
  font-family: inherit;
  font-size: 12px;
  box-shadow: 0 2px 0 var(--el-border-color);
}

.result-scroll {
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.result-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 1px solid var(--el-border-color-lighter);

  &:last-child {
    border-bottom: none;
  }

  &:hover, &.active {
    background-color: var(--el-color-primary-light-9);

    .title {
      color: var(--el-color-primary);
    }
  }
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.left-icon {
  font-size: 20px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
  padding: 8px;
  border-radius: 8px;
  box-sizing: content-box;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.enter-icon {
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .search-container { padding: 16px; gap: 12px; }
  .logo { width: 48px; height: 48px; border-radius: 10px; }
  .search-input :deep(.el-input__inner) { height: 36px; font-size: 14px; }
  .result-item { padding: 10px 12px; }
}
</style>
