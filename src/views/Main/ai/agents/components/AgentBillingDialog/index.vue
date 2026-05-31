<script setup lang="ts">
import { computed, nextTick, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  AiBillingRuleApi,
  type AiBillingRuleItem,
  type AiBillingRuleMutationParams,
  type AiBillingRulePageInitResponse,
  type AiBillingScene,
  type AiBillingUnit,
} from '@/api/ai/billingRules'

interface Props {
  modelValue: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
}

interface BillingRuleForm {
  id?: number
  scene: AiBillingScene | ''
  unit: AiBillingUnit | ''
  unit_price_cents?: number
  status?: number
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const isMobile = useIsMobile()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const dict = shallowRef<AiBillingRulePageInitResponse['dict']>({
  scene_arr: [],
  unit_arr: [],
  common_status_arr: [],
})
const rows = ref<AiBillingRuleItem[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance | null>(null)
const form = reactive<BillingRuleForm>(defaultForm())

const columns = computed(() => [
  { key: 'scene_name', label: t('aiBilling.columns.scene'), minWidth: 180 },
  { key: 'unit_name', label: t('aiBilling.columns.unit'), width: 120 },
  { key: 'unit_price_cents', label: t('aiBilling.columns.unitPrice'), width: 120 },
  { key: 'status', label: t('aiBilling.columns.status'), width: 100 },
  { key: 'updated_at', label: t('aiBilling.columns.updatedAt'), width: 170 },
  { key: 'actions', label: t('common.actions.action'), width: 240 },
])

const rules = computed<FormRules>(() => ({
  scene: [{ required: true, message: t('aiBilling.validation.sceneRequired'), trigger: 'change' }],
  unit: [{ required: true, message: t('aiBilling.validation.unitRequired'), trigger: 'change' }],
  unit_price_cents: [
    { required: true, message: t('aiBilling.validation.unitPricePositive'), trigger: 'blur' },
    { type: 'integer', min: 1, message: t('aiBilling.validation.unitPricePositive'), trigger: 'blur' },
  ],
  status: [{ required: true, message: t('aiBilling.validation.statusRequired'), trigger: 'change' }],
}))

function defaultForm(): BillingRuleForm {
  return {
    scene: '',
    unit: '',
    unit_price_cents: undefined,
    status: CommonEnum.YES,
  }
}

function resetForm() {
  const next = defaultForm()
  form.id = next.id
  form.scene = next.scene
  form.unit = next.unit
  form.unit_price_cents = next.unit_price_cents
  form.status = next.status
  void nextTick(() => formRef.value?.clearValidate())
}

function resetToAdd() {
  dialogMode.value = 'add'
  resetForm()
}

async function loadList() {
  loading.value = true
  try {
    const data = await AiBillingRuleApi.list()
    rows.value = data.list
  } finally {
    loading.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [initData, listData] = await Promise.all([
      AiBillingRuleApi.pageInit(),
      AiBillingRuleApi.list(),
    ])
    dict.value = initData.dict
    rows.value = listData.list
  } finally {
    loading.value = false
  }
}

function openAdd() {
  resetToAdd()
}

function openEdit(row: AiBillingRuleItem) {
  dialogMode.value = 'edit'
  form.id = row.id
  form.scene = row.scene
  form.unit = row.unit
  form.unit_price_cents = row.unit_price_cents
  form.status = row.status
  void nextTick(() => formRef.value?.clearValidate())
}

function toPayload(): AiBillingRuleMutationParams | null {
  if (!form.scene || !form.unit || !form.unit_price_cents || !form.status) return null
  return {
    id: form.id,
    scene: form.scene,
    unit: form.unit,
    unit_price_cents: form.unit_price_cents,
    status: form.status,
  }
}

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const payload = toPayload()
  if (!payload) return
  saving.value = true
  try {
    if (dialogMode.value === 'add') {
      await AiBillingRuleApi.create(payload)
    } else {
      await AiBillingRuleApi.update(payload)
    }
    ElNotification.success({ message: t('common.success.operation') })
    resetToAdd()
    await loadList()
  } finally {
    saving.value = false
  }
}

async function changeStatus(row: AiBillingRuleItem) {
  const nextStatus = row.status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES
  await AiBillingRuleApi.changeStatus({ id: row.id, status: nextStatus })
  ElNotification.success({ message: t('common.success.operation') })
  await loadList()
}

async function confirmDelete(row: AiBillingRuleItem) {
  await ElMessageBox.confirm(t('aiBilling.messages.deleteConfirm'), t('common.confirmTitle'), { type: 'warning' })
  await AiBillingRuleApi.deleteOne({ id: row.id })
  ElNotification.success({ message: t('common.success.delete') })
  resetToAdd()
  await loadList()
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    resetToAdd()
    void loadData()
  }
)
</script>

<template>
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '900px'" height="72vh">
    <template #header>{{ t('aiBilling.dialog.title') }}</template>
    <div class="agent-billing-dialog">
      <AppTable
        :columns="columns"
        :data="rows"
        :fixed-footer="false"
        :loading="loading"
        row-key="id"
        :show-column-setting="false"
        @refresh="loadList"
      >
        <template #toolbar-left>
          <el-button type="success" @click="openAdd">{{ t('common.actions.add') }}</el-button>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
            {{ row.status_name || row.status }}
          </el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="openEdit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="warning" text @click="changeStatus(row)">
            {{ row.status === CommonEnum.YES ? t('common.actions.disable') : t('common.actions.enable') }}
          </el-button>
          <el-button type="danger" text @click="confirmDelete(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        class="agent-billing-dialog__form"
        label-width="auto"
        :validate-on-rule-change="false"
      >
        <el-row :gutter="12">
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiBilling.form.scene')" prop="scene" required>
              <el-select-v2
                v-model="form.scene"
                :disabled="dialogMode === 'edit'"
                :options="dict.scene_arr"
                :placeholder="t('aiBilling.form.scenePlaceholder')"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiBilling.form.unit')" prop="unit" required>
              <el-select-v2
                v-model="form.unit"
                :options="dict.unit_arr"
                :placeholder="t('aiBilling.form.unitPlaceholder')"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiBilling.form.unitPriceCents')" prop="unit_price_cents" required>
              <el-input-number v-model="form.unit_price_cents" :min="1" :precision="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiBilling.form.status')" prop="status" required>
              <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.actions.close') }}</el-button>
      <el-button type="primary" :loading="saving" @click="confirmSubmit">
        {{ dialogMode === 'add' ? t('common.actions.add') : t('common.actions.save') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.agent-billing-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.agent-billing-dialog__form {
  flex: 0 0 auto;
  padding: 14px 14px 2px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}
</style>
