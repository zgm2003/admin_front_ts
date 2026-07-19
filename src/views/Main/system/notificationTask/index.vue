<script setup lang="ts">
import { DocumentCopy } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { RemoteSelect } from '@/components/RemoteSelect'
import { UsersListApi } from '@/api/user/users'
import { RoleApi } from '@/api/permission/role'
import type { UserListItem } from '@/types/user'
import { useNotificationTaskPage } from './use-notification-task-page'
const {
  columns, confirmDel, copy, dialogVisible, form,
  getStatusType, getTypeColor, handleCancel, handleChangeStatus, handleRefresh,
  handleSearch, handleSubmit, isMobile, levelArr, listData,
  listLoading, onPageChange, page, platformArr, searchFields,
  searchForm, showAdd, statusArr, submitLoading, t,
  targetTypeArr, typeArr, setFormRef,
} = useNotificationTaskPage()
</script>

<template>
  <div class="box">
    <el-tabs
      v-model="searchForm.status"
      @tab-change="handleChangeStatus"
    >
      <el-tab-pane
        v-for="item in statusArr"
        :key="item.value"
        :name="item.value"
      >
        <template #label>
          {{ item.label }} ({{ item.num }})
        </template>
      </el-tab-pane>
    </el-tabs>

    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="handleSearch"
      @reset="handleSearch"
    />
    
    <AppTable
      :columns="columns"
      :data="listData"
      :loading="listLoading"
      :pagination="page"
      @update:pagination="onPageChange"
      @refresh="handleRefresh"
    >
      <template #toolbar-left>
        <el-button
          type="primary"
          @click="showAdd"
        >
          {{ t('notificationTask.publish') }}
        </el-button>
      </template>
      
      <template #cell-title="{row}">
        <span>{{ row.title }}</span>
      </template>
      
      <template #cell-type="{row}">
        <el-tag
          :type="getTypeColor(row.type)"
          size="small"
        >
          {{ row.type_text }}
        </el-tag>
      </template>
      
      <template #cell-level="{row}">
        <el-tag
          :type="row.level === 2 ? 'danger' : 'info'"
          size="small"
        >
          {{ row.level_text }}
        </el-tag>
      </template>
      
      <template #cell-platform="{row}">
        <el-tag size="small">
          {{ row.platform_text }}
        </el-tag>
      </template>
      
      <template #cell-target_type="{row}">
        <span>{{ row.target_type_text }}</span>
      </template>
      
      <template #cell-progress="{row}">
        <span>{{ row.sent_count }} / {{ row.total_count }}</span>
      </template>
      
      <template #cell-status="{row}">
        <el-tag
          :type="getStatusType(row.status)"
          size="small"
        >
          {{ row.status_text }}
        </el-tag>
      </template>
      
      <template #cell-error_msg="{row}">
        <div
          v-if="row.error_msg"
          class="cell-error"
        >
          <span class="error-text">{{ row.error_msg }}</span>
          <el-button
            :icon="DocumentCopy"
            link
            size="small"
            @click="copy(row.error_msg)"
          />
        </div>
        <span
          v-else
          class="text-secondary"
        >-</span>
      </template>
      
      <template #cell-send_at="{row}">
        <span v-if="row.send_at">{{ row.send_at }}</span>
        <span
          v-else
          class="text-secondary"
        >{{ t('notificationTask.immediate') }}</span>
      </template>
      
      <template #cell-actions="{row}">
        <el-button
          v-if="row.status === 1"
          type="warning"
          text
          @click="handleCancel(row)"
        >
          {{ t('notificationTask.cancel') }}
        </el-button>
        <el-button
          type="danger"
          text
          @click="confirmDel(row)"
        >
          {{ t('common.actions.del') }}
        </el-button>
      </template>
    </AppTable>
    
    <!-- 发布弹窗 -->
    <AppDialog
      v-model="dialogVisible"
      :width="isMobile ? '94vw' : '600px'"
    >
      <template #header>
        {{ t('notificationTask.publish') }}
      </template>
      <el-form
        :ref="setFormRef"
        :model="form"
        label-width="100px"
      >
        <el-form-item
          :label="t('notificationTask.title')"
          prop="title"
          :rules="[{required: true, message: t('notificationTask.title') + t('common.required')}]"
        >
          <el-input
            v-model="form.title"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item :label="t('notificationTask.content')">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item :label="t('notificationTask.type')">
          <el-radio-group v-model="form.type">
            <el-radio
              v-for="item in typeArr"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('notificationTask.level')">
          <el-radio-group v-model="form.level">
            <el-radio
              v-for="item in levelArr"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-alert
            :title="t('notificationTask.levelHelp')"
            type="primary"
            :closable="false"
            show-icon
          />
        </el-form-item>
        <el-form-item :label="t('notificationTask.link')">
          <el-input
            v-model="form.link"
            placeholder="/path/to/page"
          />
        </el-form-item>
        <el-form-item :label="t('notificationTask.platform')">
          <el-radio-group v-model="form.platform">
            <el-radio
              v-for="item in platformArr"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          :label="t('notificationTask.targetType')"
          prop="target_type"
          :rules="[{required: true, message: t('notificationTask.targetType') + t('common.required')}]"
        >
          <el-radio-group
            v-model="form.target_type"
            @change="form.target_ids = []"
          >
            <el-radio
              v-for="item in targetTypeArr"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="form.target_type === 2"
          :label="t('notificationTask.selectUsers')"
        >
          <RemoteSelect
            v-model="form.target_ids"
            multiple
            :fetch-method="UsersListApi.list"
            :label-field="(item: UserListItem) => item.username"
            value-field="id"
            :placeholder="t('notificationTask.searchUsers')"
            width="100%"
          />
        </el-form-item>
        <el-form-item
          v-if="form.target_type === 3"
          :label="t('notificationTask.selectRoles')"
        >
          <RemoteSelect
            v-model="form.target_ids"
            multiple
            :fetch-method="RoleApi.list"
            label-field="name"
            value-field="id"
            keyword-field="name"
            :placeholder="t('notificationTask.searchRoles')"
            width="100%"
          />
        </el-form-item>
        <el-form-item :label="t('notificationTask.sendAt')">
          <el-date-picker
            v-model="form.send_at"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            :placeholder="t('notificationTask.sendAtPlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped src="./styles.css"></style>
