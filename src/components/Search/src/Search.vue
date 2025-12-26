<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useResizeObserver } from '@vueuse/core'
import { useIsMobile } from '@/utils/responsive'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'

interface Field {
  key: string
  type: 'input' | 'select-v2' | 'cascader' | 'date-range'
  label?: string
  placeholder?: string
  width?: number | string
  options?: any[]
  props?: Record<string, any>
}

const { locale, t } = useI18n()
const props = withDefaults(defineProps<{ modelValue: Record<string, any>, fields: Field[], inline?: boolean, collapseCount?: number, size?: 'large' | 'default' | 'small' }>(), { inline: true, collapseCount: 1, size: 'default' })
const emit = defineEmits(['update:modelValue', 'query', 'reset'])

const formRef = ref<FormInstance>()
const form = ref<Record<string, any>>({ ...(props.modelValue || {}) })
watch(() => props.modelValue, (v) => { form.value = { ...(v || {}) } }, { deep: true })

const resetText = computed(() => locale.value === 'en-US' ? 'Reset' : '重置')

const onQuery = () => { emit('update:modelValue', { ...form.value }); emit('query', { ...form.value }) }
const onReset = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', { ...form.value })
  emit('reset', { ...form.value })
}

const isMobile = useIsMobile()
const collapsed = ref<boolean>(false)
const userOverride = ref(false)
const autoInitialized = ref(false)
const wrapRef = ref<HTMLElement | null>(null)
const wrapped = ref(false)
const detectWrapped = () => {
  const el = wrapRef.value as HTMLElement | null
  if (!el) return
  const items = Array.from(el.querySelectorAll('.el-form-item')) as HTMLElement[]
  if (items.length === 0) return
  const firstTop = items[0].offsetTop
  const hasWrap = items.some(it => it.offsetTop > firstTop)
  wrapped.value = hasWrap
  if (!userOverride.value && hasWrap && !collapsed.value) {
    collapsed.value = true
    autoInitialized.value = true
  }
}
useResizeObserver(wrapRef, () => { detectWrapped() })
const minCount = computed(() => Math.max(1, Number(props.collapseCount || 1)))
const visibleFields = computed(() => collapsed.value ? props.fields.slice(0, minCount.value) : props.fields)
const hiddenCount = computed(() => props.fields.length - visibleFields.value.length)
const showToggle = computed(() => wrapped.value || collapsed.value)
const toggleCollapsed = () => { if (showToggle.value) { userOverride.value = true; collapsed.value = !collapsed.value } }
</script>

<template>
  <div ref="wrapRef">
  <el-form ref="formRef" :inline="isMobile ? false : props.inline" :model="form" :size="props.size">
    <el-form-item v-for="f in visibleFields" :key="f.key" :label="isMobile ? undefined : f.label" :prop="f.key">
      <template v-if="f.type==='input'">
        <el-input v-model="form[f.key]" :placeholder="f.placeholder" clearable :style="{ width: isMobile ? '100%' : (f.width ?? 150)+'px' }" />
      </template>
      <template v-else-if="f.type==='select-v2'">
        <el-select-v2 v-model="form[f.key]" :options="f.options" filterable clearable :placeholder="f.placeholder" :style="{ width: isMobile ? '100%' : (f.width ?? 150)+'px' }" v-bind="f.props" />
      </template>
      <template v-else-if="f.type==='cascader'">
        <el-cascader v-model="form[f.key]" :options="f.options" clearable filterable :placeholder="f.placeholder" :style="{ width: isMobile ? '100%' : (f.width ?? 150)+'px' }" :props="f.props" />
      </template>
      <template v-else-if="f.type==='date-range'">
        <el-date-picker v-model="form[f.key]" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" clearable :style="{ width: isMobile ? '100%' : (f.width ?? 300)+'px' }" v-bind="f.props" />
      </template>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="onQuery">{{ t('common.actions.query') }}</el-button>
      <el-button @click="onReset">{{ resetText }}</el-button>
      <el-button v-if="showToggle" text @click="toggleCollapsed">
        <el-icon style="margin-right:4px"><component :is="collapsed ? ArrowDown : ArrowUp" /></el-icon>
        {{ collapsed ? '展开' : '收起' }}
      </el-button>
    </el-form-item>
  </el-form>
  </div>
</template>

<style scoped>
</style>

