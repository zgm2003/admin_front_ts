<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { useUploadSettingPage } from './use-upload-setting-page'

const userStore = useUserStore()
const {
  add, batchDel, columns, confirmDel, confirmSubmit,
  dialogMode, dialogVisible, dict, edit, form,
  isMobile, listData, listLoading, onPageChange, onSearch,
  onSelectionChange, page, refresh, rules, searchFields,
  searchForm, t, toggleStatus, setFormRef,
} = useUploadSettingPage()
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
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
          <el-button
            v-if="userStore.can('system_uploadConfig_settingAdd')"
            type="success"
            @click="add"
          >
            {{
              t('common.actions.add')
            }}
          </el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="userStore.can('system_uploadConfig_settingDel')"
                  @click="batchDel"
                >
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
            {{ row.status_name }}
          </el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('system_uploadConfig_settingEdit')"
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.NO && userStore.can('system_uploadConfig_settingStatus')"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.YES && userStore.can('system_uploadConfig_settingStatus')"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button
            v-if="userStore.can('system_uploadConfig_settingDel')"
            type="danger"
            text
            @click="confirmDel(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog
    v-model="dialogVisible"
    :width="isMobile ? '94vw' : '600px'"
  >
    <template #header>
      {{
        dialogMode === 'add' ? t('upload.setting.addTitle') : t('upload.setting.editTitle')
      }}
    </template>
    <el-form
      :ref="setFormRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :validate-on-rule-change="false"
    >
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item
            :label="t('upload.setting.form.driver')"
            prop="driver_id"
            required
          >
            <el-select-v2
              v-model="form.driver_id"
              :options="dict.upload_driver_list"
              style="width:100%"
              filterable
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('upload.setting.form.rule')"
            prop="rule_id"
            required
          >
            <el-select-v2
              v-model="form.rule_id"
              :options="dict.upload_rule_list"
              style="width:100%"
              filterable
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('upload.setting.form.status')"
            prop="status"
            required
          >
            <el-radio-group v-model="form.status">
              <el-radio :value="CommonEnum.YES">
                {{ t('common.status.enabled') }}
              </el-radio>
              <el-radio :value="CommonEnum.NO">
                {{ t('common.status.disabled') }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('upload.setting.form.remark')"
            prop="remark"
          >
            <el-input
              v-model="form.remark"
              type="textarea"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible=false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="confirmSubmit"
        >{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>
</template>

<style scoped src="./styles.css"></style>
