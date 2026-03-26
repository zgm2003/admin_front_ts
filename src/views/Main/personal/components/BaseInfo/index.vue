<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { UpMedia } from '@/components/UpMedia'
import { UsersApi } from '@/api/user/users.ts'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type { UserPersonalEditParams, UserPersonalInfo } from '@/types/user'

const props = defineProps<{
  userinfo: UserPersonalInfo
  addressTree: any[]
  sexArr: Array<DictOption<number>>
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const loading = ref(false)
const editableFieldKeys = ['avatar', 'username', 'sex', 'birthday', 'address', 'detail_address', 'bio'] as const

type EditableFieldKey = (typeof editableFieldKeys)[number]
type DirtyFieldMap = Record<EditableFieldKey, boolean>

const createSnapshot = (source: UserPersonalInfo | UserPersonalEditParams): UserPersonalEditParams => ({
  avatar: source.avatar,
  username: source.username?.trim?.() || source.username,
  sex: source.sex,
  birthday: source.birthday || null,
  address: source.address,
  detail_address: source.detail_address,
  bio: source.bio,
})

// 仅快照可编辑字段，并以规范化后的值作为重置基准
const original = ref<UserPersonalEditParams>(createSnapshot(props.userinfo))
const currentSnapshot = computed(() => createSnapshot(props.userinfo))
const dirtyFields = computed<DirtyFieldMap>(() => {
  const current = currentSnapshot.value
  const baseline = original.value

  return editableFieldKeys.reduce(
    (acc, key) => {
      acc[key] = current[key] !== baseline[key]
      return acc
    },
    {} as DirtyFieldMap,
  )
})

watch(
  () => props.userinfo,
  (userinfo) => {
    original.value = createSnapshot(userinfo)
  },
)

const confirmEdit = async () => {
  const params = currentSnapshot.value

  loading.value = true
  try {
    await UsersApi.editPersonal(params)
    Object.assign(props.userinfo, params)
    original.value = { ...params }
    ElNotification.success(t('common.success.operation'))
    emit('refresh')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(props.userinfo, { ...original.value })
}
</script>

<template>
  <div class="base-info" v-loading="loading">
    <div class="base-info-card">
      <el-form label-width="auto" label-position="top" class="base-form">
        <el-form-item :label="t('personal.form.avatar')" :class="{ 'is-dirty-item': dirtyFields.avatar }">
          <div class="upload-shell" :class="{ 'is-dirty-upload': dirtyFields.avatar }">
            <UpMedia v-model="userinfo.avatar" folder-name="avatars" :isClearable="false" />
          </div>
        </el-form-item>

        <!-- xs/sm 均占满行：避免 768~991px 仍按 sm=12 双列导致「用户名/性别」远窄于下方整行字段 -->
        <el-row :gutter="isMobile ? 0 : 20" class="form-row">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item :label="t('personal.form.username')" :class="{ 'is-dirty-item': dirtyFields.username }">
              <el-input
                v-model="userinfo.username"
                :placeholder="t('personal.form.usernamePlaceholder')"
                class="custom-input"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item :label="t('personal.form.sex')" :class="{ 'is-dirty-item': dirtyFields.sex }">
              <el-select-v2
                v-model="userinfo.sex"
                :options="sexArr"
                :placeholder="t('personal.form.sexPlaceholder')"
                class="custom-select"
                style="width: 100%"
                clearable
                filterable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="isMobile ? 0 : 20" class="form-row">
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item :label="t('personal.form.birthday')" :class="{ 'is-dirty-item': dirtyFields.birthday }">
              <el-date-picker
                v-model="userinfo.birthday"
                type="date"
                :placeholder="t('personal.form.birthdayPlaceholder')"
                class="custom-date"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12">
            <el-form-item :label="t('personal.form.address')" :class="{ 'is-dirty-item': dirtyFields.address }">
              <el-cascader
                v-model="userinfo.address"
                :options="addressTree"
                :props="{ emitPath: false }"
                :placeholder="t('personal.form.addressPlaceholder')"
                class="custom-cascader"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item :label="t('personal.form.detailAddress')" :class="{ 'is-dirty-item': dirtyFields.detail_address }">
          <el-input
            v-model="userinfo.detail_address"
            :placeholder="t('personal.form.detailAddress')"
            class="custom-input"
            clearable
          />
        </el-form-item>

        <el-form-item :label="t('personal.form.bio')" :class="{ 'is-dirty-item': dirtyFields.bio }">
          <el-input
            type="textarea"
            :rows="isMobile ? 4 : 5"
            v-model="userinfo.bio"
            :placeholder="t('personal.form.bioPlaceholder')"
            class="custom-textarea"
          />
        </el-form-item>

        <el-form-item label-width="0" class="btn-item">
          <el-button type="primary" class="submit-btn" @click="confirmEdit">
            {{ t('personal.form.saveBasic') }}
          </el-button>
          <el-button class="reset-btn" @click="resetForm">
            {{ t('personal.form.resetBasic') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ==================== 统一输入控件外观 ====================
@mixin login-input-base {
  border-radius: 16px;
  padding: 10px 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  box-shadow: none;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  height: 46px;
  min-height: 46px;
  overflow: hidden;
  box-sizing: border-box;
}

@mixin login-input-focus {
  background: #fff;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.12);
}

@mixin dirty-input-state {
  background: var(--dirty-bg);
  border-color: var(--dirty-border);
  box-shadow: 0 0 0 3px var(--dirty-ring);
}

.base-info {
  padding-bottom: 4px;
}

.base-info-card {
  --dirty-accent: #d97706;
  --dirty-border: rgba(245, 158, 11, 0.55);
  --dirty-bg: #fffbeb;
  --dirty-ring: rgba(245, 158, 11, 0.18);

  max-width: 880px;
  margin: 0 auto;

  :deep(.el-form-item__label) {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    line-height: 1.4;
    padding-bottom: 6px;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.is-dirty-item .el-form-item__label) {
    display: flex;
    align-items: center;
    color: var(--dirty-accent);
  }

  :deep(.is-dirty-item .el-form-item__label::before) {
    content: '';
    width: 8px;
    height: 8px;
    margin-right: 8px;
    border-radius: 999px;
    flex-shrink: 0;
    background: var(--dirty-accent);
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14);
  }

  // label-top 下拉控件对齐
  :deep(.el-form-item--label-top .el-form-item__content) {
    align-items: stretch;
    line-height: normal;
  }

  .upload-shell {
    width: 100%;
    padding: 10px;
    border: 1px dashed transparent;
    border-radius: 18px;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
    box-sizing: border-box;
  }

  .upload-shell.is-dirty-upload {
    border-color: var(--dirty-border);
    background: linear-gradient(180deg, rgba(255, 251, 235, 0.9) 0%, rgba(255, 247, 237, 0.9) 100%);
    box-shadow: 0 0 0 3px var(--dirty-ring);
  }

  :deep(.custom-input .el-input__wrapper) {
    @include login-input-base;
  }

  :deep(.is-dirty-item .custom-input .el-input__wrapper) {
    @include dirty-input-state;
  }

  :deep(.custom-input .el-input__wrapper.is-focus),
  :deep(.custom-input .el-input__wrapper:focus-within) {
    @include login-input-focus;
  }

  :deep(.custom-textarea .el-textarea__inner) {
    @include login-input-base;
    border-radius: 16px;
    padding: 12px 14px;
    height: auto;
    min-height: unset;
    line-height: 1.5;
  }

  :deep(.is-dirty-item .custom-textarea .el-textarea__inner) {
    @include dirty-input-state;
  }

  :deep(.custom-textarea .el-textarea__inner:focus) {
    @include login-input-focus;
  }

  :deep(.custom-date .el-input__wrapper) {
    @include login-input-base;
  }

  :deep(.is-dirty-item .custom-date .el-input__wrapper) {
    @include dirty-input-state;
  }

  :deep(.custom-date .el-input__wrapper.is-focus),
  :deep(.custom-date .el-input__wrapper:focus-within) {
    @include login-input-focus;
  }

  /* el-select-v2 根为 .el-select，实际描边/背景在 .el-select__wrapper；勿给根节点套壳，否则会与内层双框 */
  :deep(.custom-select.el-select) {
    display: block;
    width: 100%;
  }

  :deep(.custom-select.el-select .el-select__wrapper) {
    @include login-input-base;
    width: 100%;

    &.is-hovering:not(.is-focused) {
      box-shadow: none;
      border-color: #e2e8f0;
      background: #f8fafc;
    }
  }

  :deep(.is-dirty-item .custom-select.el-select .el-select__wrapper) {
    @include dirty-input-state;
  }

  :deep(.custom-select.el-select .el-select__wrapper.is-focused) {
    @include login-input-focus;
  }

  :deep(.custom-cascader.el-cascader) {
    display: block;
    width: 100%;
  }

  :deep(.custom-cascader.el-cascader .el-input__wrapper) {
    @include login-input-base;
    line-height: normal;
  }

  :deep(.is-dirty-item .custom-cascader.el-cascader .el-input__wrapper) {
    @include dirty-input-state;
  }

  :deep(.custom-cascader.el-cascader .el-input__wrapper.is-focus),
  :deep(.custom-cascader.el-cascader .el-input__wrapper:focus-within) {
    @include login-input-focus;
  }
}

.btn-item {
  margin-top: 12px;
  margin-bottom: 0;

  :deep(.el-form-item__content) {
    display: flex;
    justify-content: flex-start;
    gap: 12px;
  }
}

%btn-base {
  height: 48px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 700;
  border: none;
}

.submit-btn {
  @extend %btn-base;
  padding: 0 28px;
  min-width: 140px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  box-shadow: 0 10px 22px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.28);

  &:hover {
    filter: brightness(1.03);
    box-shadow: 0 14px 28px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.35);
  }
}

.reset-btn {
  @extend %btn-base;
  padding: 0 24px;
  min-width: 100px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);

  &:hover {
    background: var(--el-fill-color);
    border-color: var(--el-border-color-hover);
    color: var(--el-text-color-primary);
  }
}

@media (max-width: 768px) {
  .base-info-card {
    .form-row .el-col + .el-col {
      margin-top: 24px;
    }

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    .form-row + .form-row {
      margin-top: 4px;
    }

    .base-form > .form-row + .el-form-item {
      margin-top: 16px;
    }
  }

  .btn-item {
    margin-top: 8px;

    :deep(.el-form-item__content) {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    :deep(.el-button + .el-button) {
      margin-left: 0;
    }
  }

  %btn-mobile {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: 46px;
    border-radius: 14px;
    box-sizing: border-box;
  }

  .submit-btn {
    @extend %btn-mobile;
    box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.22);
  }

  .reset-btn {
    @extend %btn-mobile;
  }
}
</style>
