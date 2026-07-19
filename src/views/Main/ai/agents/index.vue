<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { UpMedia } from '@/components/UpMedia'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import AgentToolDialog from './components/AgentToolDialog/index.vue'
import AgentKnowledgeDialog from './components/AgentKnowledgeDialog/index.vue'
import { useAgentAdminPage } from './use-agent-admin-page'

const userStore = useUserStore()
const formRef = ref<FormInstance | null>(null)
const {
  t, isMobile, dict, searchForm, searchFields, columns,
  listLoading, listData, page, onSearch, onPageChange, refresh, getList,
  confirmDel, toggleStatus, dialogVisible, dialogMode, form, rules,
  modelLoading, modelOptions, toolDialogVisible, toolAgent,
  knowledgeDialogVisible, knowledgeAgent, loadModelOptions,
  add, edit, openTools, openKnowledge, testConnection, confirmSubmit, sceneText,
} = useAgentAdminPage(formRef)
</script>

<template>
  <div class="ai-agent-page">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
    <div class="ai-agent-page__table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #toolbar-left>
          <el-button
            type="success"
            @click="add"
          >
            {{ t('common.actions.add') }}
          </el-button>
        </template>
        <template #cell-avatar="{ row }">
          <el-avatar
            :src="row.avatar || undefined"
            :size="36"
          >
            {{ row.name?.charAt(0) || '?' }}
          </el-avatar>
        </template>
        <template #cell-model_id="{ row }">
          <el-text>{{ row.model_display_name || row.model_id }}</el-text>
        </template>
        <template #cell-scenes="{ row }">
          <el-tag type="info">
            {{ sceneText(row) }}
          </el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
            {{ row.status_name || row.status }}
          </el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('ai_agent_test') && row.status === CommonEnum.YES"
            type="success"
            text
            @click="testConnection(row)"
          >
            {{ t('aiAgents.actions.test') }}
          </el-button>
          <el-button
            type="primary"
            text
            @click="openTools(row)"
          >
            {{ t('aiAgents.actions.tools') }}
          </el-button>
          <el-button
            type="success"
            text
            @click="openKnowledge(row)"
          >
            {{ t('aiAgents.actions.knowledge') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.NO"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.YES"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
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
    </div>
  </div>

  <AppDialog
    v-model="dialogVisible"
    :width="isMobile ? '94vw' : '760px'"
    height="70vh"
  >
    <template #header>
      {{ dialogMode === 'add' ? t('aiAgents.addTitle') : t('aiAgents.editTitle') }}
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :validate-on-rule-change="false"
    >
      <el-row :gutter="12">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiAgents.form.name')"
            prop="name"
            required
          >
            <el-input
              v-model="form.name"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiAgents.form.status')"
            prop="status"
            required
          >
            <el-select-v2
              v-model="form.status"
              :options="dict.common_status_arr"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiAgents.form.model')"
            prop="model_path"
            required
          >
            <el-cascader
              v-model="form.model_path"
              :options="modelOptions"
              :props="{ emitPath: true }"
              :loading="modelLoading"
              filterable
              clearable
              style="width: 100%"
              @change="loadModelOptions"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiAgents.form.scenes')"
            prop="scenes"
            required
          >
            <el-select-v2
              v-model="form.scenes"
              :options="dict.scene_arr"
              multiple
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiAgents.form.avatar')"
            prop="avatar"
          >
            <UpMedia
              v-model="form.avatar"
              type="image"
              folder-name="ai-agents"
              width="72px"
              show-input
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiAgents.form.systemPrompt')"
            prop="system_prompt"
          >
            <el-input
              v-model="form.system_prompt"
              type="textarea"
              :rows="8"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
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

  <AgentToolDialog
    v-model="toolDialogVisible"
    :agent="toolAgent"
    @saved="getList"
  />

  <AgentKnowledgeDialog
    v-model="knowledgeDialogVisible"
    :agent="knowledgeAgent"
    @saved="getList"
  />
</template>

<style scoped src="./styles.css"></style>
