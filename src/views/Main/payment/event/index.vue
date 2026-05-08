<script setup lang="ts">
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { usePaymentEventPage } from './composables/usePaymentEventPage'

const { columns, data, loading, page, refresh, onPageChange, searchForm, searchFields, onSearch } = usePaymentEventPage()
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
    />
  </div>
</template>
