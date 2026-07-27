import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import {
  AiModelPriceApi,
  type AiModelPriceFamily,
  type AiModelPriceItem,
  type AiModelPricePageInitResponse,
  type AiModelPriceUpdateParams,
} from '@/api/ai/model-prices'
import type { SearchField } from '@/components/Search/types'
import { isApiError } from '@/modules/http/error'
import { useUserStore } from '@/store/user'

export interface ModelPricingSearchForm {
  family: AiModelPriceFamily | ''
  model_id: string
}

export type ModelPriceOverrideForm = Omit<AiModelPriceUpdateParams, 'model_id'>

export function useModelPricingPage() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const loading = ref(false)
  const drawerLoading = ref(false)
  const saving = ref(false)
  const restoringModelID = ref('')
  const drawerVisible = ref(false)
  const listData = shallowRef<AiModelPriceItem[]>([])
  const selectedPrice = shallowRef<AiModelPriceItem | null>(null)
  const familyOptions = shallowRef<AiModelPricePageInitResponse['dict']['family_options']>([])
  const searchForm = ref<ModelPricingSearchForm>({ family: '', model_id: '' })
  const canEdit = computed(() => userStore.can('ai_model_pricing_edit'))
  const searchFields = computed<SearchField[]>(() => [
    {
      key: 'family',
      type: 'select-v2',
      label: t('aiModelPricing.filters.family'),
      placeholder: t('aiModelPricing.filters.family'),
      width: 150,
      options: familyOptions.value,
    },
    {
      key: 'model_id',
      type: 'input',
      label: t('aiModelPricing.filters.model'),
      placeholder: t('aiModelPricing.filters.modelPlaceholder'),
      width: 240,
    },
  ])

  async function getList() {
    loading.value = true
    try {
      const response = await AiModelPriceApi.list(searchForm.value)
      listData.value = response.list
    } finally {
      loading.value = false
    }
  }

  async function init() {
    loading.value = true
    try {
      const [pageInit, list] = await Promise.all([
        AiModelPriceApi.pageInit(),
        AiModelPriceApi.list(searchForm.value),
      ])
      familyOptions.value = pageInit.dict.family_options
      listData.value = list.list
    } finally {
      loading.value = false
    }
  }

  function onSearch() {
    void getList()
  }

  async function openEdit(row: AiModelPriceItem) {
    if (!canEdit.value) return
    selectedPrice.value = row
    drawerVisible.value = true
    drawerLoading.value = true
    try {
      selectedPrice.value = await AiModelPriceApi.detail({ model_id: row.model_id })
    } finally {
      drawerLoading.value = false
    }
  }

  async function saveOverride(form: ModelPriceOverrideForm) {
    const current = selectedPrice.value
    if (!canEdit.value || !current || saving.value) return
    saving.value = true
    try {
      await AiModelPriceApi.update({ model_id: current.model_id, ...form })
      ElNotification.success({ message: t('aiModelPricing.messages.saved') })
      drawerVisible.value = false
      await getList()
    } catch (error) {
      if (!isVersionConflict(error)) throw error
      selectedPrice.value = await AiModelPriceApi.detail({ model_id: current.model_id })
      ElNotification.warning({ message: t('aiModelPricing.messages.versionConflict') })
    } finally {
      saving.value = false
    }
  }

  async function restoreOfficial(row: AiModelPriceItem) {
    if (
      !canEdit.value
      || restoringModelID.value
      || row.effective.source !== 'override'
      || row.effective.override_version <= 0
    ) return

    await ElMessageBox.confirm(
      t('aiModelPricing.messages.restoreConfirm', { model: row.model_id }),
      t('common.confirmTitle'),
      { type: 'warning' },
    )
    restoringModelID.value = row.model_id
    try {
      await AiModelPriceApi.restore({
        model_id: row.model_id,
        expected_version: row.effective.override_version,
      })
      ElNotification.success({ message: t('aiModelPricing.messages.restored') })
      await getList()
    } catch (error) {
      if (!isVersionConflict(error)) throw error
      ElNotification.warning({ message: t('aiModelPricing.messages.versionConflict') })
      await getList()
    } finally {
      restoringModelID.value = ''
    }
  }

  onMounted(() => {
    void init()
  })

  return {
    t,
    loading,
    drawerLoading,
    saving,
    restoringModelID,
    drawerVisible,
    listData,
    selectedPrice,
    familyOptions,
    searchForm,
    searchFields,
    canEdit,
    init,
    getList,
    onSearch,
    openEdit,
    saveOverride,
    restoreOfficial,
  }
}

function isVersionConflict(error: unknown): boolean {
  return isApiError(error)
    && (error.status === 409 || error.code === 'ai.model_pricing.version_conflict')
}
