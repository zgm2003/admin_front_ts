<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@/components/Search'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import IconSelect from './components/IconSelect.vue'
import PermissionDefinitionDialog from './components/PermissionDefinitionDialog.vue'
import PermissionHealthPanel from './components/PermissionHealthPanel.vue'
import PermissionTreeTable from './components/PermissionTreeTable.vue'
import PlatformTabs from './components/PlatformTabs.vue'
import { usePermissionDefinitionPage } from './composables/usePermissionDefinitionPage'

interface IconSelectExposed {
  show: () => void
}

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

const {
  platformOptions,
  activePlatform,
  parentTree,
  filteredTypeArr,
  dialogVisible,
  dialogMode,
  form,
  listLoading,
  listData,
  searchForm,
  searchFields,
  isExpanded,
  healthWarnings,
  init,
  getList,
  onSearch,
  openAdd,
  openAddChild,
  openEdit,
  submitForm,
  setSelectedRows,
  batchDel,
  changeStatus,
  confirmIcon,
  switchPlatform,
  toggleExpand,
} = usePermissionDefinitionPage()

const iconSelectRef = ref<IconSelectExposed | null>(null)

const canAdd = computed(() => userStore.can('permission_permission_add'))
const canEdit = computed(() => userStore.can('permission_permission_edit'))
const canStatus = computed(() => userStore.can('permission_permission_status'))
const canDelete = computed(() => userStore.can('permission_permission_del'))

const tableLabels = computed(() => ({
  id: t('permission.table.id'),
  name: t('permission.table.name'),
  icon: t('permission.table.icon'),
  status: t('permission.table.status'),
  sort: t('permission.table.sort'),
  type: t('permission.table.type'),
  actions: t('permission.table.actions'),
  add: t('common.actions.add'),
  edit: t('common.actions.edit'),
}))

function openIconSelect() {
  iconSelectRef.value?.show()
}

onMounted(async () => {
  await init()
  await getList()
})
</script>

<template>
  <div class="permission-definition-page">
    <PlatformTabs v-model="activePlatform" :options="platformOptions" @change="switchPlatform" />

    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />

    <div class="permission-toolbar">
      <el-button v-if="canAdd" type="success" @click="openAdd">
        {{ t('common.actions.add') }}
      </el-button>
      <el-button v-if="canDelete" type="danger" @click="batchDel">
        {{ t('common.actions.batchDelete') }}
      </el-button>
      <el-button type="primary" :icon="isExpanded ? ArrowUp : ArrowDown" @click="toggleExpand">
        {{ isExpanded ? t('common.actions.collapseAll') : t('common.actions.expandAll') }}
      </el-button>
    </div>

    <PermissionHealthPanel
      :warnings="healthWarnings"
      :title="t('permission.health.title')"
    />

    <PermissionTreeTable
      :rows="listData"
      :loading="listLoading"
      :expanded="isExpanded"
      :can-add="canAdd"
      :can-edit="canEdit"
      :can-status="canStatus"
      :labels="tableLabels"
      @add-child="openAddChild"
      @edit="openEdit"
      @status-change="changeStatus"
      @selection-change="setSelectedRows"
    />
  </div>

  <PermissionDefinitionDialog
    v-model:visible="dialogVisible"
    v-model:form="form"
    :mode="dialogMode"
    :is-mobile="isMobile"
    :permission-types="filteredTypeArr"
    :parent-tree="parentTree"
    @submit="submitForm"
    @open-icon-select="openIconSelect"
  />

  <IconSelect ref="iconSelectRef" @select-icon="confirmIcon" />
</template>

<style scoped>
.permission-definition-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-weight: 600;
}

.permission-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
</style>
