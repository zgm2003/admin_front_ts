<script setup lang="ts">
import { h } from 'vue'
import { useWebSocket, onWsMessage } from '@/hooks/useWebSocket'
import { ElNotification } from 'element-plus'

// WebSocket 连接（登录后自动连接和绑定）
useWebSocket()

// 监听服务器推送的通知
onWsMessage('notification', (msg) => {
  ElNotification({
    title: msg.data?.title || '通知',
    message: msg.data?.content || '',
    type: msg.data?.type || 'info',
  })
})

// 监听导出完成通知
onWsMessage('export_complete', (msg) => {
  ElNotification({
    title: msg.data?.title || '导出完成',
    message: h('div', [
      h('span', msg.data?.message || '点击下载'),
      h('a', {
        href: msg.data?.url,
        target: '_blank',
        style: 'color: var(--el-color-primary); margin-left: 8px;'
      }, '下载文件')
    ]),
    type: 'success',
    duration: 10000,
  })
})
</script>

<template>
  <slot />
</template>
