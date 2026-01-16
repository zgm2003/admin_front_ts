<template>
  <div ref="containerRef" class="remote-select-container">
    <el-select
      ref="selectRef"
      v-model="selected"
      filterable
      remote
      :remote-method="handleSearch"
      :remote-show-suffix="true"
      :loading="loading"
      :clearable="clearable"
      :placeholder="placeholder"
      :debounce="debounce"
      :teleported="false"
      :style="{ width }"
      v-bind="$attrs"
      @visible-change="handleVisibleChange"
      @change="handleChange"
      @clear="handleClear"
    >
    <el-option
      v-for="item in options"
      :key="item[valueField]"
      :label="item[labelField]"
      :value="item[valueField]"
    />
    <!-- 加载更多 -->
    <el-option v-if="loadingMore" disabled value="__loading__" class="load-status">
      <span>{{ t('common.loading') }}</span>
    </el-option>
    <el-option v-else-if="hasMore && options.length > 0" disabled value="__loadmore__" class="load-status">
      <span>{{ t('common.scrollLoadMore') }}</span>
    </el-option>
    <el-option v-else-if="!hasMore && options.length > 0" disabled value="__nomore__" class="load-status">
      <span>{{ t('common.noMore') }}</span>
    </el-option>
    <template v-if="loaded && options.length === 0" #empty>
      <div class="empty-text">{{ noDataText }}</div>
    </template>
  </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ inheritAttrs: false })

const { t } = useI18n()

interface Props {
  modelValue?: string | number | (string | number)[]
  fetchMethod: (params: Record<string, any>) => Promise<{ list: any[]; total: number }>
  labelField?: string
  valueField?: string
  keywordField?: string
  pageField?: string
  pageSizeField?: string
  pageSize?: number
  loadOnOpen?: boolean
  extraParams?: Record<string, any>
  debounce?: number
  placeholder?: string
  clearable?: boolean
  width?: string
  noDataText?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  labelField: 'label',
  valueField: 'value',
  keywordField: 'keyword',
  pageField: 'pageNo',
  pageSizeField: 'pageSize',
  pageSize: 20,
  loadOnOpen: true,
  extraParams: () => ({}),
  debounce: 300,
  placeholder: '请输入关键词搜索',
  clearable: true,
  width: '200px',
  noDataText: '暂无数据'
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any, item: any]
}>()

const selectRef = ref()
const containerRef = ref<HTMLElement>()
const options = ref<any[]>([])
const selected = ref(props.modelValue)
const loading = ref(false)
const loadingMore = ref(false)
const loaded = ref(false)
const page = ref(1)
const total = ref(0)
const hasMore = computed(() => options.value.length < total.value)
let keyword = ''

// 搜索（直接调用，防抖由 el-select 的 debounce 属性处理）
const handleSearch = (query: string) => {
  keyword = query
  page.value = 1
  fetchData(false)
}

// 获取数据
const fetchData = async (append = false) => {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const params = {
      [props.keywordField]: keyword,
      [props.pageField]: page.value,
      [props.pageSizeField]: props.pageSize,
      ...props.extraParams
    }
    const res = await props.fetchMethod(params)
    const list = res?.list || []
    if (append) {
      options.value = [...options.value, ...list]
    } else {
      options.value = list
    }
    total.value = res?.total || 0
    loaded.value = true
  } catch (e) {
    if (!append) options.value = []
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  page.value++
  fetchData(true)
}

// 下拉框展开/关闭
const handleVisibleChange = (visible: boolean) => {
  if (visible) {
    if (props.loadOnOpen && !loaded.value) {
      fetchData(false)
    }
    // 绑定滚动事件
    bindScrollEvent()
  } else {
    unbindScrollEvent()
  }
}

// 滚动加载
let scrollWrapper: HTMLElement | null = null
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const { scrollTop, scrollHeight, clientHeight } = target
  if (scrollHeight - scrollTop - clientHeight < 50) {
    loadMore()
  }
}
const bindScrollEvent = () => {
  nextTick(() => {
    setTimeout(() => {
      // teleported=false 后下拉框在组件内部
      scrollWrapper = containerRef.value?.querySelector('.el-select-dropdown__wrap') as HTMLElement
      scrollWrapper?.addEventListener('scroll', handleScroll)
    }, 50)
  })
}
const unbindScrollEvent = () => {
  scrollWrapper?.removeEventListener('scroll', handleScroll)
  scrollWrapper = null
}

// 值变化
const handleChange = (val: any) => {
  emit('update:modelValue', val)
  const item = options.value.find(o => o[props.valueField] === val)
  emit('change', val, item)
}

// 清空
const handleClear = () => {
  options.value = []
  loaded.value = false
  page.value = 1
  total.value = 0
  keyword = ''
}

// 监听 modelValue
watch(() => props.modelValue, (val) => {
  selected.value = val
}, { immediate: true })

onUnmounted(() => {
  unbindScrollEvent()
})

defineExpose({
  refresh: () => { page.value = 1; fetchData(false) },
  clear: handleClear,
  loadMore,
  selectRef
})
</script>

<style scoped>
.remote-select-container {
  display: inline-block;
  position: relative;
}

.empty-text {
  padding: 10px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.load-status {
  display: flex;
  justify-content: center;
  color: #909399;
  font-size: 12px;
  cursor: default;
}
</style>
