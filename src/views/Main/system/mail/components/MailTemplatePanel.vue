<script setup lang="ts">
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { useMailTemplatePanel } from './use-mail-template-panel'

const userStore = useUserStore()
const {
  addSampleVariable, changeStatus, columns, deleteTemplate, dialogMode,
  dialogTitle, dialogVisible, dict, fillMissingSampleVariables, form,
  load, loading, openCreate, openEdit, removeSampleVariable,
  rules, sceneLabel, statusLabel, submit, submitting,
  t, templatePage, templates, setFormRef,
} = useMailTemplatePanel()
</script>

<template>
  <div class="mail-template">
    <div class="mail-template__table">
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
            v-if="userStore.can('system_mail_templateAdd')"
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
            class="mail-template__variables"
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
            v-if="userStore.can('system_mail_templateEdit')"
            type="primary"
            text
            @click="openEdit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.NO && userStore.can('system_mail_templateStatus')"
            type="warning"
            text
            @click="changeStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.YES && userStore.can('system_mail_templateStatus')"
            type="warning"
            text
            @click="changeStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button
            v-if="userStore.can('system_mail_templateDel')"
            type="danger"
            text
            @click="deleteTemplate(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
      destroy-on-close
    >
      <el-form
        :ref="setFormRef"
        :model="form"
        :rules="rules"
        label-width="160px"
      >
        <el-form-item
          :label="t('mail.template.scene')"
          prop="scene"
        >
          <el-select
            v-model="form.scene"
            class="mail-template__select"
            :disabled="dialogMode === 'edit'"
          >
            <el-option
              v-for="item in dict.mail_scene_arr"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          :label="t('mail.template.name')"
          prop="name"
        >
          <el-input
            v-model="form.name"
            clearable
          />
        </el-form-item>
        <el-form-item
          :label="t('mail.template.subject')"
          prop="subject"
        >
          <el-input
            v-model="form.subject"
            clearable
          />
        </el-form-item>
        <el-form-item
          :label="t('mail.template.tencentTemplateId')"
          prop="tencent_template_id"
        >
          <el-input-number
            v-model="form.tencent_template_id"
            :min="1"
            :precision="0"
            class="mail-template__number"
            :controls="false"
          />
        </el-form-item>
        <el-form-item
          :label="t('mail.template.variables')"
          prop="variables_text"
        >
          <el-input
            v-model="form.variables_text"
            type="textarea"
            :rows="4"
            :placeholder="t('mail.template.variablesPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('mail.template.sampleVariables')">
          <div class="mail-template__samples">
            <div
              v-for="(row, index) in form.sample_variables"
              :key="index"
              class="mail-template__sample-row"
            >
              <el-input
                v-model="row.key"
                :placeholder="t('mail.template.sampleVariableKey')"
              />
              <el-input
                v-model="row.value"
                :placeholder="t('mail.template.sampleVariableValue')"
              />
              <el-button
                type="danger"
                text
                @click="removeSampleVariable(index)"
              >
                {{ t('common.actions.del') }}
              </el-button>
            </div>
            <div class="mail-template__sample-actions">
              <el-button @click="fillMissingSampleVariables">
                {{ t('mail.template.fillSampleVariables') }}
              </el-button>
              <el-button
                type="primary"
                plain
                @click="addSampleVariable"
              >
                {{ t('mail.template.addSampleVariable') }}
              </el-button>
            </div>
            <div class="mail-template__sample-tip">
              {{ t('mail.template.sampleVariablesTip') }}
            </div>
          </div>
        </el-form-item>
        <el-form-item
          :label="t('mail.template.status')"
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
    </el-dialog>
  </div>
</template>

<style scoped src="./MailTemplatePanel.styles.css"></style>
