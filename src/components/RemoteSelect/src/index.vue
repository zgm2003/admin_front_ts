<template>
  <div ref="containerRef" class="remote-select-container" :style="{ width }">
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
      v-bind="$attrs"
      @visible-change="handleVisibleChange"
      @change="handleChange"
      @clear="reset"
    >
      <el-option v-for="item in options" :key="item[valueField]" :label="getLabel(item)" :value="item[valueField]" />
      <el-option v-if="statusText" disabled value="__status__" class="load-status">
        <span>{{ statusText }}</span>
      </el-option>
      <template v-if="loaded && !options.length" #empty>
        <div class="empty-text">{{ t('common.noData') }}</div>
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
  fetchMethod: (params: Record<string, any>) => Promise<any>
  labelField?: string | ((item: any) => string)
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
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  labelField: 'label',
  valueField: 'value',
  keywordField: 'keyword',
  pageField: 'current_page',
  pageSizeField: 'page_size',
  pageSize: 20,
  loadOnOpen: true,
  extraParams: () => ({}),
  debounce: 300,
  placeholder: '',
  clearable: true,
  width: '200px'
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
const lastFetchCount = ref(0) // 最后一次请求返回的数量
let keyword = ''
let scrollWrapper: HTMLElement | null = null

// 判断是否还有更多数据
const hasMore = computed(() => {
  if (total.value > 0) {
    // 有 total 时，用 total 判断
    return options.value.length < total.value
  }
  // 没有 total 时，用最后一次返回数量判断
  return lastFetchCount.value === props.pageSize
})
const statusText = computed(() => {
  if (!options.value.length) return ''
  if (loadingMore.value) return t('common.loading')
  if (hasMore.value) return t('common.scrollLoadMore')
  return t('common.noMore')
})

// 获取 label（支持字符串或函数）
const getLabel = (item: any) => {
  if (typeof props.labelField === 'function') {
    return props.labelField(item)
  }
  return item[props.labelField]
}

// 搜索
const handleSearch = (query: string) => {
  keyword = query
  page.value = 1
  fetchData(false)
}

// 获取数据
const fetchData = async (append = false) => {
  append ? (loadingMore.value = true) : (loading.value = true)
  try {
    const res = await props.fetchMethod({
      [props.keywordField]: keyword,
      [props.pageField]: page.value,
      [props.pageSizeField]: props.pageSize,
      ...props.extraParams
    })
    // 统一解析：list 直接取，total 从 page.total 取
    const list = res?.list || []
    lastFetchCount.value = list.length
    options.value = append ? [...options.value, ...list] : list
    total.value = res?.page?.total || res?.total || 0
    loaded.value = true
  } catch {
    if (!append) options.value = []
    lastFetchCount.value = 0
  } finally {
    loading.value = loadingMore.value = false
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
    if (props.loadOnOpen && !loaded.value) fetchData(false)
    nextTick(() => setTimeout(() => {
      scrollWrapper = containerRef.value?.querySelector('.el-select-dropdown__wrap') as HTMLElement
      scrollWrapper?.addEventListener('scroll', onScroll)
    }, 50))
  } else {
    scrollWrapper?.removeEventListener('scroll', onScroll)
    scrollWrapper = null
  }
}

const onScroll = (e: Event) => {
  const el = e.target as HTMLElement
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 50) loadMore()
}

// 值变化
const handleChange = (val: any) => {
  emit('update:modelValue', val)
  emit('change', val, options.value.find(o => o[props.valueField] === val))
}

// 重置
const reset = () => {
  options.value = []
  loaded.value = false
  page.value = 1
  total.value = 0
  lastFetchCount.value = 0
  keyword = ''
}

watch(() => props.modelValue, val => selected.value = val, { immediate: true })
onUnmounted(() => scrollWrapper?.removeEventListener('scroll', onScroll))

defineExpose({ refresh: () => { page.value = 1; fetchData(false) }, reset, loadMore, selectRef })
</script>

<style scoped>
.remote-select-container { display: inline-block; position: relative; }
.empty-text { padding: 10px 0; text-align: center; color: #909399; font-size: 14px; }
.load-status { display: flex; justify-content: center; color: #909399; font-size: 12px; cursor: default; }
</style>
