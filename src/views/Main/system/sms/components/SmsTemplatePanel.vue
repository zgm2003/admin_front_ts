<script setup lang="ts">
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { useSmsTemplatePanel } from './use-sms-template-panel'

const userStore = useUserStore()
const {
  addSampleVariable, changeStatus, columns, deleteTemplate, dialogMode,
  dialogTitle, dialogVisible, dict, fillMissingSampleVariables, form,
  load, loading, openCreate, openEdit, removeSampleVariable,
  rules, sceneLabel, statusLabel, submit, submitting,
  t, templatePage, templates, setFormRef,
} = useSmsTemplatePanel()
</script>

<template>
  <div class="sms-template">
    <div class="sms-template__table">
      <AppTable
        :columns="columns"
        :data="templates"
        :loading="loading"
        :pagination="templatePage"
        row-key="id"
        @refresh="load"
      >
        <template #toolbar-left>
          <el-button
            v-if="userStore.can('system_sms_templateAdd')"
            type="success"
            @click="openCreate"
          >
            {{ t('common.actions.add') }}
          </el-button>
        </template>

        <template #cell-scene="{ row }">
          {{ sceneLabel(row.scene) }}
        </template>

        <template #cell-variables="{ row }">
          <el-space
            wrap
            class="sms-template__variables"
          >
            <el-tag
              v-for="item in row.variables"
              :key="item"
              size="small"
            >
              {{ item }}
            </el-tag>
          </el-space>
        </template>

        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('system_sms_templateEdit')"
            type="primary"
            text
            @click="openEdit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.NO && userStore.can('system_sms_templateStatus')"
            type="warning"
            text
            @click="changeStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.YES && userStore.can('system_sms_templateStatus')"
            type="warning"
            text
            @click="changeStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button
            v-if="userStore.can('system_sms_templateDel')"
            type="danger"
            text
            @click="deleteTemplate(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>

    <AppDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
    >
      <el-form
        :ref="setFormRef"
        :model="form"
        :rules="rules"
        label-width="160px"
      >
        <el-form-item
          :label="t('sms.template.scene')"
          prop="scene"
        >
          <el-select
            v-model="form.scene"
            class="sms-template__select"
            :disabled="dialogMode === 'edit'"
          >
            <el-option
              v-for="item in dict.sms_scene_arr"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          :label="t('sms.template.name')"
          prop="name"
        >
          <el-input
            v-model="form.name"
            clearable
          />
        </el-form-item>
        <el-form-item
          :label="t('sms.template.tencentTemplateId')"
          prop="tencent_template_id"
        >
          <el-input
            v-model="form.tencent_template_id"
            clearable
          />
        </el-form-item>
        <el-form-item
          :label="t('sms.template.variables')"
          prop="variables_text"
        >
          <el-input
            v-model="form.variables_text"
            type="textarea"
            :rows="4"
            :placeholder="t('sms.template.variablesPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('sms.template.sampleVariables')">
          <div class="sms-template__samples">
            <div
              v-for="(row, index) in form.sample_variables"
              :key="index"
              class="sms-template__sample-row"
            >
              <el-input
                v-model="row.key"
                :placeholder="t('sms.template.sampleVariableKey')"
              />
              <el-input
                v-model="row.value"
                :placeholder="t('sms.template.sampleVariableValue')"
              />
              <el-button
                type="danger"
                text
                @click="removeSampleVariable(index)"
              >
                {{ t('common.actions.del') }}
              </el-button>
            </div>
            <div class="sms-template__sample-actions">
              <el-button @click="fillMissingSampleVariables">
                {{ t('sms.template.fillSampleVariables') }}
              </el-button>
              <el-button
                type="primary"
                plain
                @click="addSampleVariable"
              >
                {{ t('sms.template.addSampleVariable') }}
              </el-button>
            </div>
            <div class="sms-template__sample-tip">
              {{ t('sms.template.sampleVariablesTip') }}
            </div>
          </div>
        </el-form-item>
        <el-form-item
          :label="t('sms.template.status')"
          prop="status"
        >
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="item in dict.common_status_arr"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submit"
        >
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped src="./SmsTemplatePanel.styles.css"></style>
