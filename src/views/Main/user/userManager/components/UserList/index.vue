<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { Search } from '@/components/Search'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { UpMedia } from '@/components/UpMedia'
import { useUserStore } from '@/store/user'
import { CommonEnum } from '@/enums'
import { useUserList } from './use-user-list'

const userStore = useUserStore()
const {
  t, isMobile, searchForm, searchFields, listLoading, listData, page,
  onSearch, onPageChange, refresh, onSelectionChange,
  confirmDel, batchDel, toggleStatus, edit, exportExcel, batchEdit,
  editBoxShow, editForm, roleArr, sexArr, addressTree, confirmEdit,
  batchEditBoxShow, batchFieldOptions, batchEditForm, confirmBatchEdit,
  goToPersonal,
} = useUserList()
</script>

<template>
  <div class="user-list">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="2"
      @query="onSearch"
      @reset="onSearch"
    />
    <div class="table">
      <AppTable
        :columns="[
          { key: 'username', label: t('user.table.username'), width: 150 },
          { key: 'avatar', label: t('user.table.avatar') },
          { key: 'phone', label: t('user.table.phone') },
          { key: 'sex_show', label: t('user.table.sex') },
          { key: 'email', label: t('user.table.email') },
          { key: 'role_name', label: t('user.table.role'), width: 150 },
          { key: 'address_show', label: t('user.table.address'), width: 180, overflowTooltip: true },
          { key: 'bio', label: t('user.table.desc'), width: 180, overflowTooltip: true },
          { key: 'status', label: t('user.table.status'), width: 110 },
          { key: 'actions', label: t('common.actions.action'), width: 180 },
        ]"
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
                  v-if="userStore.can('user_userManager_del')"
                  @click="batchDel"
                >
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
                <el-dropdown-item
                  v-if="userStore.can('user_userManager_batchEdit')"
                  @click="batchEdit"
                >
                  {{ t('common.actions.batchEdit') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button
            v-if="userStore.can('user_userManager_export')"
            type="success"
            @click="exportExcel"
          >
            {{ t('common.actions.export') }}
          </el-button>
        </template>
        <template #cell-username="{ row }">
          <el-link
            type="primary"
            @click="goToPersonal(row)"
          >
            {{ row.username }}
          </el-link>
        </template>
        <template #cell-avatar="{ row }">
          <el-avatar :src="row.avatar || undefined" />
        </template>
        <template #cell-role_name="{ row }">
          <el-tag :type="row.role_id === 1 ? 'success' : 'danger'">
            {{ row.role_name }}
          </el-tag>
        </template>
        <template #cell-bio="{ row }">
          <el-text>{{ row.bio }}</el-text>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
            {{ row.status === CommonEnum.YES ? t('common.status.enabled') : t('common.status.disabled') }}
          </el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('user_userManager_edit')"
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('user_userManager_edit') && row.status === CommonEnum.NO"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="userStore.can('user_userManager_edit') && row.status === CommonEnum.YES"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button
            v-if="userStore.can('user_userManager_del')"
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
    v-model="editBoxShow"
    class="add-box"
    :width="isMobile ? '94vw' : '950px'"
    :title="t('common.actions.edit')"
  >
    <div class="add-box">
      <el-form
        label-width="auto"
        :model="editForm"
        inline
      >
        <el-form-item :label="t('user.table.username')">
          <el-input
            v-model="editForm.username"
            :placeholder="t('user.table.username')"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item :label="t('user.table.email')">
          <el-input
            v-model="editForm.email"
            :placeholder="t('user.table.email')"
            clearable
            style="width: 200px"
            disabled
          />
        </el-form-item>
        <el-form-item :label="t('user.table.phone')">
          <el-input
            v-model="editForm.phone"
            :placeholder="t('user.table.phone')"
            clearable
            style="width: 200px"
            disabled
          />
        </el-form-item>
        <el-form-item :label="t('user.table.sex')">
          <el-select-v2
            v-model="editForm.sex"
            :options="sexArr"
            style="width: 200px"
            filterable
            clearable
          />
        </el-form-item>
        <el-form-item :label="t('user.table.role')">
          <el-select-v2
            v-model="editForm.role_id"
            :options="roleArr"
            style="width: 200px"
            filterable
            clearable
          />
        </el-form-item>
        <el-form-item :label="t('user.table.avatar')">
          <UpMedia
            v-model="editForm.avatar"
            folder-name="avatars"
            :is-clearable="false"
          />
        </el-form-item>
        <el-form-item :label="t('user.table.address')">
          <el-cascader
            v-model="editForm.address_id"
            :options="addressTree"
            :props="{ emitPath: false }"
            :placeholder="t('user.filter.address')"
            style="width: 200px; margin-right: 5px"
            clearable
            filterable
          />
          <el-input
            v-model="editForm.detail_address"
            :placeholder="t('user.filter.detail_address')"
            clearable
            style="width: 300px"
          />
        </el-form-item>
      </el-form>
      <el-row>
        <el-col :span="22">
          <el-form>
            <el-form-item
              :label="t('user.table.desc')"
              style="width: 100%"
            >
              <el-input
                v-model="editForm.bio"
                type="textarea"
                :rows="5"
              />
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editBoxShow = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="confirmEdit"
        >{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>

  <AppDialog
    v-model="batchEditBoxShow"
    class="add-box"
    :width="isMobile ? '94vw' : '650px'"
    :title="t('common.actions.batchEdit')"
  >
    <div class="add-box">
      <el-form label-width="80">
        <el-form-item
          :label="t('user.batchEdit.field')"
          required
        >
          <el-select-v2
            v-model="batchEditForm.field"
            :options="batchFieldOptions"
          />
        </el-form-item>
        <el-form-item
          v-if="batchEditForm.field === 'sex'"
          :label="t('user.table.sex')"
        >
          <el-select-v2
            v-model="batchEditForm.sex"
            :options="sexArr"
            style="width: 300px"
            :placeholder="t('user.filter.sex')"
            clearable
          />
        </el-form-item>
        <el-form-item
          v-if="batchEditForm.field === 'address_id'"
          :label="t('user.table.address')"
        >
          <el-cascader
            v-model="batchEditForm.address_id"
            :options="addressTree"
            :props="{ emitPath: false }"
            :placeholder="t('user.filter.address')"
            style="width: 300px"
            clearable
            filterable
          />
        </el-form-item>
        <el-form-item
          v-if="batchEditForm.field === 'detail_address'"
          :label="t('user.filter.detail_address')"
        >
          <el-input
            v-model="batchEditForm.detail_address"
            :placeholder="t('user.filter.detail_address')"
            clearable
            style="width: 300px"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="batchEditBoxShow = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="confirmBatchEdit"
        >{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>
</template>

<style scoped src="./styles.css"></style>
