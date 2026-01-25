<script setup lang="ts">
import { h, onUnmounted } from 'vue'
import { useWebSocket, onWsMessage } from '@/hooks/useWebSocket'
import { ElNotification } from 'element-plus'
import { openUrl } from '@/utils/download'
import { notify, shouldUseNative } from '@/hooks/useNotify'

// WebSocket 连接（登录后自动连接和绑定）
useWebSocket()

// 监听服务器推送的通知
const unsubNotification = onWsMessage('notification', (msg) => {
  notify({
    title: msg.data?.title || '通知',
    body: msg.data?.content || '',
    type: msg.data?.type || 'info',
  })
})

// 监听导出完成通知
const unsubExport = onWsMessage('export_complete', async (msg) => {
  const url = msg.data?.url
  const useNative = await shouldUseNative()
  
  // 窗口不可见时，额外发送原生通知提醒用户
  if (useNative) {
    await notify({
      title: msg.data?.title || '导出完成',
      body: msg.data?.message || '点击托盘图标查看',
      type: 'success',
    })
  }
  
  // Web 通知始终发送，确保用户回来后能看到下载链接
  ElNotification({
    title: msg.data?.title || '导出完成',
    message: h('span', [
      h('span', msg.data?.message || '点击下载'),
      h('a', {
        style: 'color: var(--el-color-primary); margin-left: 8px; cursor: pointer;',
        onClick: () => url && openUrl(url)
      }, '下载文件')
    ]),
    type: 'success',
    duration: 0, // 不自动关闭，确保用户能看到
  })
})

// 组件卸载时清理监听器
onUnmounted(() => {
  unsubNotification()
  unsubExport()
})
</script>

<template>
  <slot />
</template>
