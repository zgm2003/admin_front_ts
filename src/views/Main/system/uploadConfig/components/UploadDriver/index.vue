<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { useUserStore } from '@/store/user'
import { useUploadDriverPage } from './use-upload-driver-page'

const userStore = useUserStore()
const {
  add, batchDel, columns, confirmDel, confirmSubmit,
  dialogMode, dialogVisible, dict, edit, form,
  isMobile, listData, listLoading, onPageChange, onSearch,
  onSelectionChange, page, refresh, rules, searchFields,
  searchForm, t, setFormRef,
} = useUploadDriverPage()
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
            v-if="userStore.can('system_uploadConfig_driverAdd')"
            type="success"
            @click="add"
          >
            {{ t('common.actions.add') }}
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
                  v-if="userStore.can('system_uploadConfig_driverDel')"
                  @click="batchDel"
                >
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('system_uploadConfig_driverEdit')"
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('system_uploadConfig_driverDel')"
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
    :width="isMobile ? '94vw' : '900px'"
  >
    <template #header>
      {{ dialogMode === 'add' ? t('upload.driver.addTitle') : t('upload.driver.editTitle') }}
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
            :label="t('upload.driver.form.driver')"
            prop="driver"
            required
          >
            <el-select-v2
              v-model="form.driver"
              :options="dict.upload_driver_arr"
              style="width:100%"
              filterable
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('upload.driver.form.secret_id')"
            prop="secret_id"
            :required="dialogMode === 'add'"
          >
            <el-input
              v-model="form.secret_id"
              type="password"
              show-password
              clearable
              :placeholder="dialogMode === 'edit' ? t('common.placeholder.leaveEmpty') : ''"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('upload.driver.form.secret_key')"
            prop="secret_key"
            :required="dialogMode === 'add'"
          >
            <el-input
              v-model="form.secret_key"
              type="password"
              show-password
              clearable
              :placeholder="dialogMode === 'edit' ? t('common.placeholder.leaveEmpty') : ''"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('upload.driver.form.bucket')"
            prop="bucket"
            required
          >
            <el-input
              v-model="form.bucket"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('upload.driver.form.region')"
            prop="region"
            required
          >
            <el-input
              v-model="form.region"
              clearable
            />
          </el-form-item>
        </el-col>
        <template v-if="form.driver==='cos'">
          <el-col :span="24">
            <el-form-item
              :label="t('upload.driver.form.appid')"
              prop="appid"
              required
            >
              <el-input
                v-model="form.appid"
                clearable
              />
            </el-form-item>
          </el-col>
        </template>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.endpoint')">
            <el-input
              v-model="form.endpoint"
              :placeholder="t('upload.driver.form.endpoint_placeholder')"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.bucket_domain')">
            <el-input
              v-model="form.bucket_domain"
              :placeholder="t('upload.driver.form.bucket_domain_placeholder')"
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

  <!-- 已合并为单一弹窗 -->
</template>

<style scoped src="./styles.css"></style>
