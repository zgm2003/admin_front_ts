<script setup lang="ts">
import { AppDialog } from '@/components/AppDialog'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { usePaymentChannelPage } from './composables/usePaymentChannelPage'

const userStore = useUserStore()
const {
  columns,
  data,
  loading,
  page,
  refresh,
  onPageChange,
  searchForm,
  searchFields,
  onSearch,
  dict,
  dialogVisible,
  dialogMode,
  formRef,
  form,
  rules,
  changeStatus,
  openAddDialog,
  openEditDialog,
  confirmSubmit,
  confirmDel,
} = usePaymentChannelPage()

void formRef.value
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <AppTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="page"
      row-key="id"
      @refresh="refresh"
      @update:pagination="onPageChange"
    >
      <template #toolbar-left>
        <el-button v-if="userStore.can('payment_channel_add')" type="success" @click="openAddDialog">新增</el-button>
      </template>
      <template #cell-is_sandbox="{ row }">
        <el-tag :type="row.is_sandbox === CommonEnum.YES ? 'warning' : 'info'">
          {{ row.is_sandbox === CommonEnum.YES ? '是' : '否' }}
        </el-tag>
      </template>
      <template #cell-status_text="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_text }}</el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button v-if="userStore.can('payment_channel_edit')" type="primary" text @click="openEditDialog(row)">编辑</el-button>
        <el-button
          v-if="userStore.can('payment_channel_status')"
          type="warning"
          text
          @click="changeStatus(row)"
        >
          {{ row.status === CommonEnum.YES ? '禁用' : '启用' }}
        </el-button>
        <el-button v-if="userStore.can('payment_channel_del')" type="danger" text @click="confirmDel(row)">删除</el-button>
      </template>
    </AppTable>
  </div>

  <AppDialog v-model="dialogVisible" :width="'820px'" draggable>
    <template #header>{{ dialogMode === 'edit' ? '编辑支付渠道' : '新增支付渠道' }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item label="渠道编码" prop="code" required>
            <el-input v-model="form.code" clearable placeholder="如 alipay_default" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="渠道名称" prop="name" required>
            <el-input v-model="form.name" clearable placeholder="如 支付宝默认渠道" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="服务商" prop="provider" required>
            <el-select-v2 v-model="form.provider" :options="dict.provider_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="支付方式" prop="supported_methods" required>
            <el-select-v2
              v-model="form.supported_methods"
              :options="dict.pay_method_arr"
              multiple
              clearable
              collapse-tags
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="AppID" prop="app_id" required>
            <el-input v-model="form.app_id" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="商户号" prop="merchant_id">
            <el-input v-model="form.merchant_id" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="应用私钥" prop="private_key" :required="dialogMode === 'add'">
            <el-input
              v-model="form.private_key"
              type="textarea"
              :rows="3"
              clearable
              :placeholder="dialogMode === 'edit' ? '不填则保留原私钥' : '请输入应用私钥'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="异步通知地址" prop="notify_url" required>
            <el-input v-model="form.notify_url" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="同步返回地址" prop="return_url">
            <el-input v-model="form.return_url" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="应用公钥证书" prop="app_cert_path" required>
            <el-input v-model="form.app_cert_path" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="支付宝公钥证书" prop="alipay_cert_path" required>
            <el-input v-model="form.alipay_cert_path" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="支付宝根证书" prop="alipay_root_cert_path" required>
            <el-input v-model="form.alipay_root_cert_path" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="沙箱环境" prop="is_sandbox" required>
            <el-select-v2 v-model="form.is_sandbox" :options="dict.yes_no_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="状态" prop="status" required>
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="2" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmSubmit">确认</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
