import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import {
  AiOfficialModelApi,
  type AiOfficialModelItem,
  type AiOfficialModelLifecycle,
  type AiOfficialModelPageInitResponse,
  type AiOfficialModelPriceSyncParams,
} from '@/api/ai/official-models'
import type { SearchField } from '@/components/Search/types'
import { isApiError } from '@/modules/http/error'
import { useUserStore } from '@/store/user'

export interface OfficialModelSearchForm {
  vendor: string
  family: string
  lifecycle: AiOfficialModelLifecycle | ''
  input_modality: string
  model_id: string
}

export type OfficialModelPriceSyncForm = Omit<AiOfficialModelPriceSyncParams, 'model_id'>

const emptyDict = (): AiOfficialModelPageInitResponse['dict'] => ({
  vendor_options: [],
  family_options: [],
  lifecycle_options: [],
  input_modality_options: [],
})

type CurrentPermissionCode = Parameters<ReturnType<typeof useUserStore>['can']>[0]
const officialModelPriceSyncPermission = 'ai_official_model_price_sync' as CurrentPermissionCode

export function useOfficialModelPage() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const loading = ref(false)
  const drawerLoading = ref(false)
  const saving = ref(false)
  const restoringModelID = ref('')
  const drawerVisible = ref(false)
  const listData = shallowRef<AiOfficialModelItem[]>([])
  const selectedModel = shallowRef<AiOfficialModelItem | null>(null)
  const dict = shallowRef(emptyDict())
  const searchForm = ref<OfficialModelSearchForm>({
    vendor: '', family: '', lifecycle: '', input_modality: '', model_id: '',
  })
  const canSyncPrice = computed(() => userStore.can(officialModelPriceSyncPermission))
  const searchFields = computed<SearchField[]>(() => [
    { key: 'vendor', type: 'select-v2', label: t('aiOfficialModel.filters.vendor'), placeholder: t('aiOfficialModel.filters.vendor'), options: dict.value.vendor_options, width: 140 },
    { key: 'family', type: 'select-v2', label: t('aiOfficialModel.filters.family'), placeholder: t('aiOfficialModel.filters.family'), options: dict.value.family_options, width: 140 },
    { key: 'lifecycle', type: 'select-v2', label: t('aiOfficialModel.filters.lifecycle'), placeholder: t('aiOfficialModel.filters.lifecycle'), options: dict.value.lifecycle_options, width: 140 },
    { key: 'input_modality', type: 'select-v2', label: t('aiOfficialModel.filters.inputModality'), placeholder: t('aiOfficialModel.filters.inputModality'), options: dict.value.input_modality_options, width: 150 },
    { key: 'model_id', type: 'input', label: t('aiOfficialModel.filters.model'), placeholder: t('aiOfficialModel.filters.modelPlaceholder'), width: 240 },
  ])

  async function getList() {
    loading.value = true
    try {
      const response = await AiOfficialModelApi.list(searchForm.value)
      listData.value = response.list
    } finally {
      loading.value = false
    }
  }

  async function init() {
    loading.value = true
    try {
      const [pageInit, list] = await Promise.all([
        AiOfficialModelApi.pageInit(),
        AiOfficialModelApi.list(searchForm.value),
      ])
      dict.value = pageInit.dict
      listData.value = list.list
    } finally {
      loading.value = false
    }
  }

  function onSearch() {
    void getList()
  }

  async function openDetail(row: AiOfficialModelItem) {
    selectedModel.value = row
    drawerVisible.value = true
    drawerLoading.value = true
    try {
      selectedModel.value = await AiOfficialModelApi.detail({ model_id: row.model_id })
    } finally {
      drawerLoading.value = false
    }
  }

  async function syncPrice(form: OfficialModelPriceSyncForm) {
    const current = selectedModel.value
    if (!canSyncPrice.value || !current || saving.value) return
    saving.value = true
    try {
      await AiOfficialModelApi.syncPrice({ model_id: current.model_id, ...form })
      ElNotification.success({ message: t('aiOfficialModel.messages.saved') })
      selectedModel.value = await AiOfficialModelApi.detail({ model_id: current.model_id })
      await getList()
    } catch (error) {
      if (!isVersionConflict(error)) throw error
      selectedModel.value = await AiOfficialModelApi.detail({ model_id: current.model_id })
      ElNotification.warning({ message: t('aiOfficialModel.messages.versionConflict') })
    } finally {
      saving.value = false
    }
  }

  async function restoreOfficialPrice(row: AiOfficialModelItem) {
    if (!canSyncPrice.value || restoringModelID.value || row.effective.source !== 'override' || row.effective.override_version <= 0) return
    await ElMessageBox.confirm(
      t('aiOfficialModel.messages.restoreConfirm', { model: row.model_id }),
      t('common.confirmTitle'),
      { type: 'warning' },
    )
    restoringModelID.value = row.model_id
    try {
      await AiOfficialModelApi.restoreOfficialPrice({
        model_id: row.model_id,
        expected_version: row.effective.override_version,
      })
      ElNotification.success({ message: t('aiOfficialModel.messages.restored') })
      if (selectedModel.value?.model_id === row.model_id) {
        selectedModel.value = await AiOfficialModelApi.detail({ model_id: row.model_id })
      }
      await getList()
    } catch (error) {
      if (!isVersionConflict(error)) throw error
      ElNotification.warning({ message: t('aiOfficialModel.messages.versionConflict') })
      await getList()
    } finally {
      restoringModelID.value = ''
    }
  }

  onMounted(() => { void init() })

  return {
    t, loading, drawerLoading, saving, restoringModelID, drawerVisible,
    listData, selectedModel, dict, searchForm, searchFields, canSyncPrice,
    init, getList, onSearch, openDetail, syncPrice, restoreOfficialPrice,
  }
}

function isVersionConflict(error: unknown): boolean {
  return isApiError(error)
    && (error.status === 409 || error.code === 'ai.official_model.version_conflict')
}
