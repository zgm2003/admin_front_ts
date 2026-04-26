<script setup lang="ts">
import { computed } from 'vue'
import { AppDialog } from '@/components/AppDialog'

const visible = defineModel<boolean>({ required: true })

const props = defineProps<{
  title: string
  addedTitle: string
  removedTitle: string
  addedLabels: string[]
  removedLabels: string[]
  emptyText: string
  cancelText: string
  confirmText: string
}>()

const hasAdded = computed(() => props.addedLabels.length > 0)
const hasRemoved = computed(() => props.removedLabels.length > 0)

const emit = defineEmits<{
  confirm: []
}>()
</script>

<template>
  <AppDialog v-model="visible" class="dialog-box" width="560px">
    <template #header>{{ title }}</template>
    <div class="role-permission-diff">
      <div class="role-permission-diff__section">
        <div class="role-permission-diff__title">{{ addedTitle }}</div>
        <el-empty v-if="!hasAdded" :description="emptyText" :image-size="60" />
        <el-tag v-for="label in addedLabels" v-else :key="label" type="success" class="role-permission-diff__tag">
          {{ label }}
        </el-tag>
      </div>
      <div class="role-permission-diff__section">
        <div class="role-permission-diff__title">{{ removedTitle }}</div>
        <el-empty v-if="!hasRemoved" :description="emptyText" :image-size="60" />
        <el-tag v-for="label in removedLabels" v-else :key="label" type="danger" class="role-permission-diff__tag">
          {{ label }}
        </el-tag>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ cancelText }}</el-button>
      <el-button type="primary" @click="emit('confirm')">{{ confirmText }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.role-permission-diff {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.role-permission-diff__section {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.role-permission-diff__title {
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.role-permission-diff__tag {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>
