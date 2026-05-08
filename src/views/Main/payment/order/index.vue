<script setup lang="ts">
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { usePaymentOrderPage } from './composables/usePaymentOrderPage'

const { columns, data, loading, page, refresh, onPageChange, searchForm, searchFields, onSearch, close } = usePaymentOrderPage()
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
      <template #cell-actions="{ row }">
        <el-button type="danger" text @click="close(row)">关闭</el-button>
      </template>
    </AppTable>
  </div>
</template>
