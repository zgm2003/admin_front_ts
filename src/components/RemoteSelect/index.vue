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
      @clear="reset"
    >
      <el-option v-for="item in options" :key="item[valueField]" :label="item[labelField]" :value="item[valueField]" />
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
let keyword = ''
let scrollWrapper: HTMLElement | null = null

const hasMore = computed(() => options.value.length < total.value)
const statusText = computed(() => {
  if (!options.value.length) return ''
  if (loadingMore.value) return t('common.loading')
  if (hasMore.value) return t('common.scrollLoadMore')
  return t('common.noMore')
})

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
    options.value = append ? [...options.value, ...(res?.list || [])] : (res?.list || [])
    total.value = res?.total || 0
    loaded.value = true
  } catch {
    if (!append) options.value = []
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
