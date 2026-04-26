<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Setting } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { CommonEnum, PermissionTypeEnum, PlatformEnum } from '@/enums'
import type { PermissionInitResponse, PermissionTreeNode } from '@/api/permission/permission'
import type { PermissionFormState } from '../composables/usePermissionDefinitionPage'

const visible = defineModel<boolean>('visible', { required: true })
const form = defineModel<PermissionFormState>('form', { required: true })

const props = defineProps<{
  mode: 'add' | 'edit'
  isMobile: boolean
  permissionTypes: PermissionInitResponse['dict']['permission_type_arr']
  parentTree: PermissionTreeNode[]
}>()

const emit = defineEmits<{
  submit: []
  openIconSelect: []
}>()

const { t } = useI18n()
const formRef = ref<FormInstance | null>(null)

const isMenuType = computed(() => form.value.type === PermissionTypeEnum.DIR || form.value.type === PermissionTypeEnum.PAGE)
const isAdminButton = computed(() => form.value.platform === PlatformEnum.ADMIN && form.value.type === PermissionTypeEnum.BUTTON)

const rules = computed<FormRules>(() => ({
  type: [{ required: true, message: t('permission.form.rule.type'), trigger: 'change' }],
  parent_id: isAdminButton.value
    ? [{
      validator: (_rule, value, callback) => {
        if (value === '' || Number(value) < 1) {
          callback(new Error(t('permission.form.rule.parent_id')))
          return
        }
        callback()
      },
      trigger: 'change',
    }]
    : [],
  name: [{ required: true, message: t('permission.form.rule.name'), trigger: 'blur' }],
  i18n_key: isMenuType.value ? [{ required: true, message: t('permission.form.rule.i18n_key'), trigger: 'blur' }] : [],
  show_menu: isMenuType.value ? [{ required: true, message: t('permission.form.rule.show_menu'), trigger: 'change' }] : [],
  code: form.value.type === PermissionTypeEnum.BUTTON ? [{ required: true, message: t('permission.form.rule.code'), trigger: 'blur' }] : [],
  path: form.value.type === PermissionTypeEnum.PAGE ? [{ required: true, message: t('permission.form.rule.path'), trigger: 'blur' }] : [],
  component: form.value.type === PermissionTypeEnum.PAGE ? [{ required: true, message: t('permission.form.rule.component'), trigger: 'blur' }] : [],
}))

async function confirmSubmit() {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  emit('submit')
}
</script>

<template>
  <AppDialog
    v-model="visible"
    class="add-box dialog-box"
    :width="isMobile ? '94vw' : '800px'"
    :title="props.mode === 'add' ? t('common.actions.add') : t('common.actions.edit')"
    draggable
    destroy-on-close
  >
    <div class="permission-dialog-content">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
        <el-form-item :label="t('permission.form.type')" prop="type" required>
          <el-radio-group v-model="form.type">
            <el-radio v-for="item in props.permissionTypes" :key="item.value" :value="item.value" border>
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('permission.form.parent_id')" prop="parent_id">
          <el-tree-select v-model="form.parent_id" :data="props.parentTree" clearable :check-strictly="true" :render-after-expand="false" />
        </el-form-item>
        <el-form-item :label="t('permission.form.name')" prop="name" required>
          <el-input v-model="form.name" style="width:100%" clearable :placeholder="t('permission.form.placeholder.name')" />
        </el-form-item>
        <el-form-item v-if="isMenuType" :label="t('permission.form.i18n_key')" prop="i18n_key" required>
          <el-input v-model="form.i18n_key" style="width:100%" clearable :placeholder="t('permission.form.placeholder.i18n_key')" />
          <div class="form-help-text">
            {{ t('permission.form.help.i18n_key') }}
          </div>
        </el-form-item>
        <el-form-item v-if="isMenuType" :label="t('permission.form.show_menu')" prop="show_menu" required>
          <el-radio-group v-model="form.show_menu">
            <el-radio :value="CommonEnum.YES" border>{{ t('common.status.show') }}</el-radio>
            <el-radio :value="CommonEnum.NO" border>{{ t('common.status.hide') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('permission.form.sort')" prop="sort" required>
          <el-input-number v-model="form.sort" :min="1" :max="1000" :step="1" />
        </el-form-item>
        <el-form-item v-if="isMenuType" :label="t('permission.form.icon')">
          <el-input v-model="form.icon" style="width:80%" clearable />
          <el-button :icon="Setting" @click="emit('openIconSelect')">{{ t('common.actions.edit') }}</el-button>
        </el-form-item>
        <el-form-item v-if="form.type === PermissionTypeEnum.PAGE" :label="t('permission.form.path')" prop="path" required>
          <el-input v-model="form.path" style="width:100%" clearable :placeholder="t('permission.form.placeholder.path')" />
          <div class="form-help-text">
            {{ t('permission.form.help.path') }}
          </div>
        </el-form-item>
        <el-form-item v-if="form.type === PermissionTypeEnum.PAGE" :label="t('permission.form.component')" prop="component" required>
          <el-input v-model="form.component" style="width:100%" clearable :rows="5" :placeholder="t('permission.form.placeholder.component')" />
          <div class="form-help-text">
            {{ t('permission.form.help.component') }}
          </div>
        </el-form-item>
        <el-form-item v-if="form.type === PermissionTypeEnum.BUTTON" :label="t('permission.form.code')" prop="code" required>
          <el-input v-model="form.code" style="width:100%" clearable :placeholder="t('permission.form.placeholder.code')" />
          <div class="form-help-text">
            {{ t('permission.form.codeHint') }}
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>
</template>

<style scoped>
.permission-dialog-content {
  width: 100%;
}

.form-help-text {
  width: 100%;
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
