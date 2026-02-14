<script setup lang="ts">
import { computed, watch } from 'vue'
import { useChatStore } from '@/store/chat'
import { ContactStatus } from '@/api/chat'

interface Props {
  modelValue: number | number[]
  multiple?: boolean
  placeholder?: string
  excludeIds?: number[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
  placeholder: '请选择好友',
  excludeIds: () => [],
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number | number[]]
}>()

const chatStore = useChatStore()

// 已确认的好友列表（排除指定的用户）
const availableFriends = computed(() => {
  const excludeSet = new Set(props.excludeIds)
  return chatStore.contacts.filter(
    c => c.status === ContactStatus.Confirmed && !excludeSet.has(c.contact_user_id)
  )
})

// 判断用户是否在线
const isUserOnline = (userId: number) => {
  const contact = chatStore.contacts.find(c => c.contact_user_id === userId)
  return contact?.is_online || chatStore.onlineUsers.has(userId)
}

// 双向绑定
const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 监听组件显示，自动加载联系人列表
watch(() => props.modelValue, () => {
  if (chatStore.contacts.length === 0) {
    chatStore.loadContacts()
  }
}, { immediate: true })
</script>

<template>
  <el-select
    v-model="localValue"
    :placeholder="placeholder"
    :multiple="multiple"
    :disabled="disabled"
    filterable
    style="width: 100%"
  >
    <el-option
      v-for="contact in availableFriends"
      :key="contact.contact_user_id"
      :label="contact.username"
      :value="contact.contact_user_id"
    >
      <div style="display: flex; align-items: center; gap: 8px">
        <el-avatar :size="24" :src="contact.avatar || undefined">
          {{ contact.username?.charAt(0) || '?' }}
        </el-avatar>
        <span>{{ contact.username }}</span>
        <el-tag v-if="isUserOnline(contact.contact_user_id)" type="success" size="small">
          在线
        </el-tag>
      </div>
    </el-option>
  </el-select>
</template>
