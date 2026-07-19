<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElNotification } from 'element-plus'
import type { CascaderOption } from 'element-plus'
import { UpMedia } from '@/components/UpMedia'
import { UsersApi } from '@/api/user/users.ts'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type { AddressTreeNode, UserPersonalEditParams, UserPersonalInfo } from '@/types/user'

const props = defineProps<{
  userinfo: UserPersonalInfo
  addressTree: AddressTreeNode[]
  sexArr: Array<DictOption<number>>
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const loading = ref(false)
const editableFieldKeys = ['avatar', 'username', 'sex', 'birthday', 'address_id', 'detail_address', 'bio'] as const
const toCascaderOptions = (nodes: AddressTreeNode[]): CascaderOption[] =>
  nodes.map((node) => ({
    label: node.label,
    value: node.value,
    children: node.children ? toCascaderOptions(node.children) : undefined,
  }))

const addressOptions = computed<CascaderOption[]>(() => toCascaderOptions(props.addressTree))

type EditableFieldKey = (typeof editableFieldKeys)[number]
type DirtyFieldMap = Record<EditableFieldKey, boolean>

const createSnapshot = (source: UserPersonalInfo | UserPersonalEditParams): UserPersonalEditParams => ({
  avatar: source.avatar,
  username: source.username?.trim?.() || source.username,
  sex: source.sex,
  birthday: source.birthday || null,
  address_id: source.address_id,
  detail_address: source.detail_address,
  bio: source.bio,
})

// 仅快照可编辑字段，并以规范化后的值作为重置基准
const original = ref<UserPersonalEditParams>(createSnapshot(props.userinfo))
const form = ref<UserPersonalEditParams>(createSnapshot(props.userinfo))
const currentSnapshot = computed(() => createSnapshot(form.value))
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
    const snapshot = createSnapshot(userinfo)
    original.value = snapshot
    form.value = { ...snapshot }
  },
  { deep: true },
)

const confirmEdit = async () => {
  const params = currentSnapshot.value

  loading.value = true
  try {
    await UsersApi.editPersonal(params)
    original.value = { ...params }
    ElNotification.success(t('common.success.operation'))
    emit('refresh')
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = { ...original.value }
}
</script>

<template>
  <div
    v-loading="loading"
    class="base-info"
  >
    <div class="base-info-card">
      <el-form
        label-width="auto"
        label-position="top"
        class="base-form"
      >
        <el-form-item
          :label="t('personal.form.avatar')"
          :class="{ 'is-dirty-item': dirtyFields.avatar }"
        >
          <div
            class="avatar-editor"
            :class="{ 'is-dirty-avatar': dirtyFields.avatar }"
          >
            <UpMedia
              v-model="form.avatar"
              folder-name="avatars"
              :is-clearable="false"
            />
            <div class="avatar-editor__meta">
              <div class="avatar-editor__title">
                <span>{{ t('personal.form.avatar') }}</span>
                <span
                  v-if="dirtyFields.avatar"
                  class="avatar-editor__badge"
                >
                  已修改
                </span>
              </div>
              <p class="avatar-editor__hint">
                点击头像更换，建议使用 JPG / PNG 正方形图片
              </p>
            </div>
          </div>
        </el-form-item>

        <!-- xs/sm 均占满行：避免 768~991px 仍按 sm=12 双列导致「用户名/性别」远窄于下方整行字段 -->
        <el-row
          :gutter="isMobile ? 0 : 20"
          class="form-row"
        >
          <el-col
            :xs="24"
            :sm="24"
            :md="12"
          >
            <el-form-item
              :label="t('personal.form.username')"
              :class="{ 'is-dirty-item': dirtyFields.username }"
            >
              <el-input
                v-model="form.username"
                :placeholder="t('personal.form.usernamePlaceholder')"
                class="custom-input"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col
            :xs="24"
            :sm="24"
            :md="12"
          >
            <el-form-item
              :label="t('personal.form.sex')"
              :class="{ 'is-dirty-item': dirtyFields.sex }"
            >
              <el-select-v2
                v-model="form.sex"
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

        <el-row
          :gutter="isMobile ? 0 : 20"
          class="form-row"
        >
          <el-col
            :xs="24"
            :sm="24"
            :md="12"
          >
            <el-form-item
              :label="t('personal.form.birthday')"
              :class="{ 'is-dirty-item': dirtyFields.birthday }"
            >
              <el-date-picker
                v-model="form.birthday"
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
          <el-col
            :xs="24"
            :sm="24"
            :md="12"
          >
            <el-form-item
              :label="t('personal.form.address')"
              :class="{ 'is-dirty-item': dirtyFields.address_id }"
            >
              <el-cascader
                v-model="form.address_id"
                :options="addressOptions"
                :props="{ emitPath: false }"
                :placeholder="t('personal.form.addressPlaceholder')"
                class="custom-cascader"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item
          :label="t('personal.form.detailAddress')"
          :class="{ 'is-dirty-item': dirtyFields.detail_address }"
        >
          <el-input
            v-model="form.detail_address"
            :placeholder="t('personal.form.detailAddress')"
            class="custom-input"
            clearable
          />
        </el-form-item>

        <el-form-item
          :label="t('personal.form.bio')"
          :class="{ 'is-dirty-item': dirtyFields.bio }"
        >
          <el-input
            v-model="form.bio"
            type="textarea"
            :rows="isMobile ? 4 : 3"
            :placeholder="t('personal.form.bioPlaceholder')"
            class="custom-textarea"
          />
        </el-form-item>

        <el-form-item
          label-width="0"
          class="btn-item"
        >
          <el-button
            type="primary"
            class="submit-btn"
            @click="confirmEdit"
          >
            {{ t('personal.form.saveBasic') }}
          </el-button>
          <el-button
            class="reset-btn"
            @click="resetForm"
          >
            {{ t('personal.form.resetBasic') }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss" src="./styles.scss"></style>
