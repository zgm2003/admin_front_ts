<script setup lang="ts">
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { useCronTaskPage } from './use-cron-task-page'

const userStore = useUserStore()
const {
  columns, confirmDel, confirmSubmit, cronPresets, data,
  dialogMode, dialogVisible, displayTaskType, form, isMobile,
  loading, logColumns, logData, logLoading, logPage,
  logSearchFields, logSearchForm, logStatusType, logTaskTitle, logVisible,
  onLogPageChange, onLogSearch, onPageChange, onPresetChange, onSearch,
  openAdd, openEdit, page, refresh, refreshLogs,
  rules, searchFields, searchForm, showLogs, t,
  toggleStatus, setFormRef,
} = useCronTaskPage()
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
    <AppTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="page"
      @refresh="refresh"
      @update:pagination="onPageChange"
    >
      <template #toolbar-left>
        <el-button
          v-if="userStore.can('devTools_cronTask_add')"
          type="success"
          @click="openAdd"
        >
          {{ t('common.actions.add') }}
        </el-button>
      </template>
      <template #cell-title="{ row }">
        <div class="task-title">
          <span class="title">{{ row.title }}</span>
          <span class="name text-secondary">{{ row.name }}</span>
        </div>
      </template>
      <template #cell-cron="{ row }">
        <el-tooltip
          :content="row.cron"
          placement="top"
        >
          <el-tag
            size="small"
            type="info"
          >
            {{ row.cron_readable || row.cron }}
          </el-tag>
        </el-tooltip>
      </template>
      <template #cell-status="{ row }">
        <el-tag
          :type="row.status === CommonEnum.YES ? 'success' : 'danger'"
          size="small"
        >
          {{ row.status === CommonEnum.YES ? t('cronTask.statusEnabled') : t('cronTask.statusDisabled') }}
        </el-tag>
      </template>
      <template #cell-handler="{ row }">
        <div class="task-type-cell">
          <code class="handler-code">{{ displayTaskType(row) }}</code>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          v-if="userStore.can('devTools_cronTask_edit')"
          type="primary"
          text
          @click="openEdit(row)"
        >
          {{ t('common.actions.edit') }}
        </el-button>
        <el-button
          v-if="row.status === CommonEnum.NO && userStore.can('devTools_cronTask_status')"
          type="warning"
          text
          @click="toggleStatus(row, CommonEnum.YES)"
        >
          {{ t('common.actions.enable') }}
        </el-button>
        <el-button
          v-if="row.status === CommonEnum.YES && userStore.can('devTools_cronTask_status')"
          type="warning"
          text
          @click="toggleStatus(row, CommonEnum.NO)"
        >
          {{ t('common.actions.disable') }}
        </el-button>
        <el-button
          v-if="userStore.can('devTools_cronTask_logs')"
          type="primary"
          text
          @click="showLogs(row)"
        >
          {{ t('cronTask.viewLogs') }}
        </el-button>
        <el-button
          v-if="userStore.can('devTools_cronTask_del')"
          type="danger"
          text
          @click="confirmDel(row)"
        >
          {{ t('common.actions.del') }}
        </el-button>
      </template>
    </AppTable>
  </div>

  <!-- 新增/编辑弹窗 -->
  <AppDialog
    v-model="dialogVisible"
    :width="isMobile ? '94vw' : '600px'"
    draggable
  >
    <template #header>
      {{ dialogMode === 'edit' ? t('common.actions.edit') : t('common.actions.add') }}
    </template>
    <el-form
      :ref="setFormRef"
      :model="form"
      :rules="rules"
      label-width="auto"
    >
      <el-form-item
        :label="t('cronTask.form.name')"
        prop="name"
        required
      >
        <el-input
          v-model="form.name"
          :disabled="dialogMode === 'edit'"
          :placeholder="t('cronTask.form.namePlaceholder')"
        />
      </el-form-item>
      <el-form-item
        :label="t('cronTask.form.title')"
        prop="title"
        required
      >
        <el-input
          v-model="form.title"
          :placeholder="t('cronTask.form.titlePlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.description')">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          :placeholder="t('cronTask.form.descriptionPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.cronPreset')">
        <el-select-v2
          v-model="form.cron"
          :options="cronPresets"
          :placeholder="t('cronTask.form.cronPresetPlaceholder')"
          clearable
          style="width: 100%"
          @change="onPresetChange"
        />
      </el-form-item>
      <el-form-item
        :label="t('cronTask.form.cron')"
        prop="cron"
        required
      >
        <el-input
          v-model="form.cron"
          :placeholder="t('cronTask.form.cronPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.cronReadable')">
        <el-input
          v-model="form.cron_readable"
          :placeholder="t('cronTask.form.cronReadablePlaceholder')"
        />
      </el-form-item>
      <el-form-item
        :label="t('cronTask.form.handler')"
        prop="handler"
      >
        <el-input
          v-model="form.handler"
          :placeholder="t('cronTask.form.handlerPlaceholder')"
        />
      </el-form-item>
      <el-form-item :label="t('cronTask.status')">
        <el-radio-group v-model="form.status">
          <el-radio :value="CommonEnum.YES">
            {{ t('cronTask.statusEnabled') }}
          </el-radio>
          <el-radio :value="CommonEnum.NO">
            {{ t('cronTask.statusDisabled') }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <el-alert
      :title="t('cronTask.form.restartTip')"
      type="warning"
      show-icon
      :closable="false"
      style="margin-top: 8px"
    />
    <template #footer>
      <el-button @click="dialogVisible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        @click="confirmSubmit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </AppDialog>

  <!-- 日志弹窗 -->
  <AppDialog
    v-model="logVisible"
    :title="t('cronTask.logsTitle', { name: logTaskTitle })"
    :width="isMobile ? '94vw' : '1000px'"
  >
    <Search
      v-model="logSearchForm"
      :fields="logSearchFields"
      @query="onLogSearch"
      @reset="onLogSearch"
    />
    <AppTable
      :columns="logColumns"
      :data="logData"
      :loading="logLoading"
      :pagination="logPage"
      :table-props="{ height: 400 }"
      :fixed-footer="false"
      @refresh="refreshLogs"
      @update:pagination="onLogPageChange"
    >
      <template #cell-duration_ms="{ row }">
        {{ row.duration_ms != null ? `${row.duration_ms}ms` : '-' }}
      </template>
      <template #cell-status="{ row }">
        <el-tag
          :type="logStatusType(row.status)"
          size="small"
        >
          {{ row.status_name }}
        </el-tag>
      </template>
    </AppTable>
    <template #footer>
      <el-button @click="logVisible = false">
        {{ t('common.actions.close') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped src="./styles.css"></style>
