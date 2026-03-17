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
      <el-option
        v-for="item in options"
        :key="String(getValue(item))"
        :label="getLabel(item)"
        :value="getValue(item)"
      />
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
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RemoteListFetchMethod, RequestPayload } from '@/types/common'

defineOptions({ inheritAttrs: false })

const { t } = useI18n()

type RemoteSelectValue = string | number
type SelectableValue = RemoteSelectValue | RemoteSelectValue[]
type OptionItem = object
type LabelResolver<Item extends object = OptionItem> = {
  bivarianceHack(item: Item): string
}['bivarianceHack']

interface Props {
  modelValue?: SelectableValue
  fetchMethod: RemoteListFetchMethod<OptionItem>
  labelField?: string | LabelResolver
  valueField?: string
  keywordField?: string
  pageField?: string
  pageSizeField?: string
  pageSize?: number
  loadOnOpen?: boolean
  extraParams?: RequestPayload
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
  width: '200px',
})

const emit = defineEmits<{
  'update:modelValue': [value: SelectableValue | undefined]
  change: [value: SelectableValue | undefined, item: OptionItem | undefined]
}>()

const selectRef = ref<unknown>(null)
const containerRef = ref<HTMLElement | null>(null)
const options = ref<OptionItem[]>([])
const selected = ref<SelectableValue | undefined>(props.modelValue)
const loading = ref(false)
const loadingMore = ref(false)
const loaded = ref(false)
const page = ref(1)
const total = ref(0)
const lastFetchCount = ref(0)

let keyword = ''
let scrollWrapper: HTMLElement | null = null

const hasMore = computed(() => {
  if (total.value > 0) {
    return options.value.length < total.value
  }

  return lastFetchCount.value === props.pageSize
})

const statusText = computed(() => {
  if (!options.value.length) {
    return ''
  }
  if (loadingMore.value) {
    return t('common.loading')
  }
  if (hasMore.value) {
    return t('common.scrollLoadMore')
  }
  return t('common.noMore')
})

const getLabel = (item: OptionItem) => {
  if (typeof props.labelField === 'function') {
    return props.labelField(item)
  }

  const value = (item as Record<string, unknown>)[props.labelField]
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

const getValue = (item: OptionItem): RemoteSelectValue => {
  const value = (item as Record<string, unknown>)[props.valueField]
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  return String(value ?? '')
}

const handleSearch = (query: string) => {
  keyword = query
  page.value = 1
  void fetchData(false)
}

const fetchData = async (append = false) => {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const response = await props.fetchMethod({
      [props.keywordField]: keyword,
      [props.pageField]: page.value,
      [props.pageSizeField]: props.pageSize,
      ...props.extraParams,
    })

    const list = response.list ?? []
    lastFetchCount.value = list.length
    options.value = append ? [...options.value, ...list] : list
    total.value = response.page?.total ?? response.total ?? 0
    loaded.value = true
  } catch {
    if (!append) {
      options.value = []
    }
    lastFetchCount.value = 0
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  if (loading.value || loadingMore.value || !hasMore.value) {
    return
  }

  page.value += 1
  void fetchData(true)
}

const onScroll = (event: Event) => {
  const element = event.target as HTMLElement
  if (element.scrollHeight - element.scrollTop - element.clientHeight < 50) {
    loadMore()
  }
}

const handleVisibleChange = (visible: boolean) => {
  if (!visible) {
    scrollWrapper?.removeEventListener('scroll', onScroll)
    scrollWrapper = null
    return
  }

  if (props.loadOnOpen && !loaded.value) {
    void fetchData(false)
  }

  nextTick(() => {
    window.setTimeout(() => {
      scrollWrapper = containerRef.value?.querySelector('.el-select-dropdown__wrap') as HTMLElement | null
      scrollWrapper?.addEventListener('scroll', onScroll)
    }, 50)
  })
}

const handleChange = (value: SelectableValue | undefined) => {
  emit('update:modelValue', value)
  emit('change', value, options.value.find((item) => getValue(item) === value))
}

const reset = () => {
  options.value = []
  loaded.value = false
  page.value = 1
  total.value = 0
  lastFetchCount.value = 0
  keyword = ''
}

watch(
  () => props.modelValue,
  (value) => {
    selected.value = value
  },
  { immediate: true }
)

onUnmounted(() => {
  scrollWrapper?.removeEventListener('scroll', onScroll)
})

defineExpose({
  refresh: () => {
    page.value = 1
    return fetchData(false)
  },
  reset,
  loadMore,
  selectRef,
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
