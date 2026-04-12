<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import type { PayChannelListItem } from '@/api/pay/channel'
import { CommonEnum } from '@/enums'
import { ArrowDown, Lock, Key, Bell } from '@element-plus/icons-vue'
import { usePayChannelPage } from './composables/usePayChannelPage'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()
const {
  channelArr,
  statusArr,
  searchForm,
  listLoading,
  listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel,
  toggleStatus,
  dialogVisible,
  dialogMode,
  formRef,
  form,
  rules,
  sectionBasic,
  sectionCert,
  sectionCallback,
  availablePayMethodOptions,
  init,
  onChannelChange,
  openAddDialog,
  openEditDialog,
  confirmSubmit,
} = usePayChannelPage({ t })

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('pay_channel.table.name'), placeholder: t('pay_channel.filter.name'), width: 150 },
  { key: 'channel', type: 'select-v2', label: t('pay_channel.table.channel'), options: channelArr.value, width: 150 },
  { key: 'status', type: 'select-v2', label: t('pay_channel.table.status'), options: statusArr.value, width: 120 },
])

const columns = computed(() => [
  { key: 'name', label: t('pay_channel.table.name') },
  { key: 'channel_name', label: t('pay_channel.table.channel') },
  { key: 'supported_methods_text', label: t('pay_channel.table.supported_methods'), minWidth: 220 },
  { key: 'mch_id', label: t('pay_channel.table.mch_id') },
  { key: 'app_id', label: t('pay_channel.table.app_id') },
  { key: 'is_sandbox_text', label: t('pay_channel.table.is_sandbox'), width: 100 },
  {
    key: 'app_private_key_hint',
    label: t('pay_channel.table.app_private_key_hint'),
    formatter: (row: PayChannelListItem) => row.app_private_key_hint || '—',
  },
  { key: 'status_name', label: t('pay_channel.table.status') },
  { key: 'created_at', label: t('pay_channel.table.created_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 250 },
])

void formRef.value

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        selectable
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button v-if="userStore.can('pay_channel_add')" type="success" @click="openAddDialog">
            {{ t('common.actions.add') }}
          </el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="userStore.can('pay_channel_del')" @click="batchDel">
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-status_name="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text v-if="userStore.can('pay_channel_edit')" @click="openEditDialog(row)">
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button type="danger" text v-if="userStore.can('pay_channel_del')" @click="confirmDel(row)">
            {{ t('common.actions.del') }}
          </el-button>
          <el-button
            type="warning"
            text
            v-if="userStore.can('pay_channel_status')"
            @click="toggleStatus(row, row.status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES)"
          >
            {{ row.status === CommonEnum.YES ? t('pay_channel.actions.disable') : t('pay_channel.actions.enable') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- ==================== 新增/编辑弹窗 ==================== -->
  <el-dialog
    v-model="dialogVisible"
    :width="isMobile ? '94vw' : '820px'"
    :close-on-click-modal="false"
    draggable
  >
    <template #header>
      {{ dialogMode === 'edit' ? t('common.actions.edit') : t('common.actions.add') }}
    </template>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :disabled="false">

      <!-- ====== 区块一：基础配置 ====== -->
      <div class="form-section">
        <div class="section-header" @click="sectionBasic = !sectionBasic">
          <el-icon><Key /></el-icon>
          <span>{{ t('pay_channel.section.basic') }}</span>
          <el-icon class="arrow" :class="{ collapsed: !sectionBasic }"><ArrowDown /></el-icon>
        </div>
        <div v-show="sectionBasic" class="section-body">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.name')" prop="name">
                <el-input v-model="form.name" clearable style="width:100%"
                  :maxlength="50"
                  show-word-limit
                  :placeholder="t('pay_channel.form.namePlaceholder')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.channel')" prop="channel">
                <el-select-v2 v-model="form.channel" :options="channelArr" style="width:100%" @change="onChannelChange" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.mch_id')" prop="mch_id">
                <el-input v-model="form.mch_id" clearable style="width:100%"
                  :maxlength="64"
                  show-word-limit
                  :placeholder="t('pay_channel.form.mch_idPlaceholder')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.supported_methods')" prop="supported_methods">
                <el-select-v2
                  v-model="form.supported_methods"
                  :options="availablePayMethodOptions"
                  multiple
                  collapse-tags
                  clearable
                  style="width:100%"
                  :placeholder="t('pay_channel.form.supported_methodsPlaceholder')"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.app_id')">
                <el-input v-model="form.app_id" clearable style="width:100%"
                  :maxlength="64"
                  show-word-limit
                  :placeholder="t('pay_channel.form.app_idPlaceholder')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.sort')">
                <el-input-number v-model="form.sort" :min="0" :max="9999" controls-position="right" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.is_sandbox')">
                <el-radio-group v-model="form.is_sandbox">
                  <el-radio :value="CommonEnum.NO">否</el-radio>
                  <el-radio :value="CommonEnum.YES">是</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.status')">
                <el-radio-group v-model="form.status">
                  <el-radio :value="CommonEnum.YES">启用</el-radio>
                  <el-radio :value="CommonEnum.NO">禁用</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item :label="t('pay_channel.form.remark')">
            <el-input v-model="form.remark" type="textarea" :rows="2" clearable style="width:100%"
              :maxlength="255"
              show-word-limit
              :placeholder="t('pay_channel.form.remarkPlaceholder')" />
          </el-form-item>
        </div>
      </div>

      <!-- ====== 区块二：证书配置 ====== -->
      <div class="form-section">
        <div class="section-header" @click="sectionCert = !sectionCert">
          <el-icon><Lock /></el-icon>
          <span>{{ t('pay_channel.section.secret') }}</span>
          <el-icon class="arrow" :class="{ collapsed: !sectionCert }"><ArrowDown /></el-icon>
        </div>
        <div v-show="sectionCert" class="section-body">

          <!-- 商户私钥 -->
              <el-form-item :label="t('pay_channel.form.app_private_key')">
              <el-input
                  v-model="form.app_private_key"
              type="textarea"
              :rows="3"
              :maxlength="20000"
              show-word-limit
              clearable
              style="width:100%"
              :placeholder="t('pay_channel.form.appPrivateKeyPlaceholder')" />
            <div class="field-hint">
              <el-icon><Bell /></el-icon>
              {{ t('pay_channel.form.hint.app_private_key') }}
            </div>
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="t('pay_channel.form.appPrivateKey_hint')" prop="app_private_key_hint">
                <el-input v-model="form.app_private_key_hint" clearable style="width:100%"
                  :maxlength="20"
                  show-word-limit
                  :placeholder="t('pay_channel.form.appPrivateKeyHintPlaceholder')" />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 证书路径 -->
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item :label="t('pay_channel.form.public_cert_path')" prop="public_cert_path">
                <el-input v-model="form.public_cert_path" clearable style="width:100%"
                  :maxlength="512"
                  show-word-limit
                  :placeholder="t('pay_channel.form.certPathPlaceholder')" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item :label="t('pay_channel.form.platform_cert_path')" prop="platform_cert_path">
                <el-input v-model="form.platform_cert_path" clearable style="width:100%"
                  :maxlength="512"
                  show-word-limit
                  :placeholder="t('pay_channel.form.certPathPlaceholder')" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item :label="t('pay_channel.form.root_cert_path')" prop="root_cert_path">
                <el-input v-model="form.root_cert_path" clearable style="width:100%"
                  :maxlength="512"
                  show-word-limit
                  :placeholder="t('pay_channel.form.certPathPlaceholder')" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- ====== 区块三：回调 & 高级 ====== -->
      <div class="form-section">
        <div class="section-header" @click="sectionCallback = !sectionCallback">
          <el-icon><Bell /></el-icon>
          <span>{{ t('pay_channel.section.callback') }}</span>
          <el-icon class="arrow" :class="{ collapsed: !sectionCallback }"><ArrowDown /></el-icon>
        </div>
        <div v-show="sectionCallback" class="section-body">
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item :label="t('pay_channel.form.notify_url')">
                <el-input v-model="form.notify_url" clearable style="width:100%"
                  :maxlength="512"
                  show-word-limit
                  :placeholder="t('pay_channel.form.notify_urlPlaceholder')" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.form-section {
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.section-header:hover {
  background: var(--el-fill-color);
}

.section-header .arrow {
  margin-left: auto;
  transition: transform 0.2s;
}

.section-header .arrow.collapsed {
  transform: rotate(-90deg);
}

.section-body {
  padding: 14px;
}

.field-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

:deep(.el-input-number) .el-input__inner {
  text-align: left !important;
}
</style>
