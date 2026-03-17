<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { useResizeObserver } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { RemoteSelect } from '@/components/RemoteSelect'
import type { RemoteSelectSearchField, SearchField, SearchFormModel } from '@/components/Search/types'
import { useIsMobile } from '@/hooks/useResponsive'

const { locale, t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: SearchFormModel
    fields: SearchField[]
    inline?: boolean
    collapseCount?: number
    size?: 'large' | 'default' | 'small'
  }>(),
  {
    inline: true,
    collapseCount: 1,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: SearchFormModel]
  query: [value: SearchFormModel]
  reset: [value: SearchFormModel]
}>()

const formRef = ref<FormInstance>()
const form = reactive<Record<string, any>>({ ...props.modelValue })
const isMobile = useIsMobile()

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, value || {})
  },
  { deep: true }
)

const resetText = computed(() => (locale.value === 'en-US' ? 'Reset' : '重置'))

const onQuery = () => {
  const value = { ...form } as SearchFormModel
  emit('update:modelValue', value)
  emit('query', value)
}

const onReset = async () => {
  if (!formRef.value) {
    return
  }

  formRef.value.resetFields()
  await nextTick()

  const value = { ...form } as SearchFormModel
  emit('update:modelValue', value)
  emit('reset', value)
}

const collapsed = ref(false)
const userOverride = ref(false)
const wrapRef = ref<HTMLElement | null>(null)
const wrapped = ref(false)

const detectWrapped = () => {
  const element = wrapRef.value
  if (!element) {
    return
  }

  const items = Array.from(element.querySelectorAll('.el-form-item')) as HTMLElement[]
  const firstItem = items[0]
  if (!firstItem) {
    return
  }

  const firstTop = firstItem.offsetTop
  const hasWrap = items.some((item) => item.offsetTop > firstTop)
  wrapped.value = hasWrap

  if (!userOverride.value && hasWrap && !collapsed.value) {
    collapsed.value = true
  }
}

useResizeObserver(wrapRef, detectWrapped)

const minCount = computed(() => Math.max(1, Number(props.collapseCount || 1)))
const visibleFields = computed(() => (collapsed.value ? props.fields.slice(0, minCount.value) : props.fields))
const showToggle = computed(() => wrapped.value || collapsed.value)

const toggleCollapsed = () => {
  if (!showToggle.value) {
    return
  }

  userOverride.value = true
  collapsed.value = !collapsed.value
}

const isRemoteSelectField = (field: SearchField): field is RemoteSelectSearchField =>
  field.type === 'remote-select'

const getFieldBindings = (field: SearchField): Record<string, unknown> => {
  const {
    key,
    type,
    label,
    placeholder,
    width,
    options,
    cascaderProps,
    fetchMethod,
    labelField,
    valueField,
    keywordField,
    ...rest
  } = field

  return rest
}

const resolveWidth = (width: SearchField['width'], fallback: number) => {
  if (isMobile.value) {
    return '100%'
  }

  return typeof width === 'string' ? width : `${width ?? fallback}px`
}
</script>

<template>
  <div ref="wrapRef">
    <el-form
      ref="formRef"
      :inline="isMobile ? false : props.inline"
      :model="form"
      :size="props.size"
      @submit.prevent="onQuery"
    >
      <el-form-item
        v-for="field in visibleFields"
        :key="field.key"
        :label="isMobile ? undefined : field.label"
        :prop="field.key"
      >
        <template v-if="field.type === 'input'">
          <el-input
            v-model="form[field.key]"
            :placeholder="field.placeholder"
            clearable
            :style="{ width: resolveWidth(field.width, 150) }"
            v-bind="getFieldBindings(field)"
          />
        </template>

        <template v-else-if="field.type === 'select-v2'">
          <el-select-v2
            v-model="form[field.key]"
            :options="(field.options ?? []) as any[]"
            filterable
            clearable
            :placeholder="field.placeholder"
            :style="{ width: resolveWidth(field.width, 150) }"
            v-bind="getFieldBindings(field)"
          />
        </template>

        <template v-else-if="field.type === 'cascader'">
          <el-cascader
            v-model="form[field.key]"
            :options="(field.options ?? []) as any[]"
            :props="field.cascaderProps"
            clearable
            filterable
            :placeholder="field.placeholder"
            :style="{ width: resolveWidth(field.width, 150) }"
            v-bind="getFieldBindings(field)"
          />
        </template>

        <template v-else-if="field.type === 'date-range'">
          <el-date-picker
            v-model="form[field.key]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
            :style="{ width: resolveWidth(field.width, 300) }"
            v-bind="getFieldBindings(field)"
          />
        </template>

        <template v-else-if="field.type === 'date'">
          <el-date-picker
            v-model="form[field.key]"
            type="date"
            :placeholder="field.placeholder"
            value-format="YYYY-MM-DD"
            clearable
            :style="{ width: resolveWidth(field.width, 150) }"
            v-bind="getFieldBindings(field)"
          />
        </template>

        <template v-else-if="isRemoteSelectField(field)">
          <RemoteSelect
            v-model="form[field.key]"
            :fetch-method="field.fetchMethod"
            :label-field="field.labelField || 'label'"
            :value-field="field.valueField || 'value'"
            :keyword-field="field.keywordField || 'keyword'"
            :placeholder="field.placeholder"
            :width="resolveWidth(field.width, 200)"
            v-bind="getFieldBindings(field)"
          />
        </template>

        <template v-else-if="field.type === 'slot'">
          <slot :name="field.key" :form="form" :field="field" />
        </template>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" native-type="submit">{{ t('common.actions.query') }}</el-button>
        <el-button @click="onReset">{{ resetText }}</el-button>
        <el-button v-if="showToggle" text @click="toggleCollapsed">
          <el-icon style="margin-right: 4px"><component :is="collapsed ? ArrowDown : ArrowUp" /></el-icon>
          {{ collapsed ? '展开' : '收起' }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
</style>
