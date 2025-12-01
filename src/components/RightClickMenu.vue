<template>
  <div v-if="visible" class="context-menu" :style="{ top: y+'px', left: x+'px' }">
    <ul>
      <li @click.stop="onClick('markAsRead')">标为已读</li>
      <li @click.stop="onClick('pin')">置顶</li>
      <li @click.stop="onClick('exit')">退出</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const visible = ref(false)
const x = ref(0), y = ref(0)
const currentItem = ref(null)
const emit = defineEmits(['action'])

function handleContextMenu(e, item) {
  currentItem.value = item
  x.value = e.clientX; y.value = e.clientY
  visible.value = true
}

function onClick(action) {
  emit('action', action, currentItem.value)
  visible.value = false
}

document.addEventListener('click', () => { visible.value = false })
defineExpose({ handleContextMenu })
</script>


<style scoped>
.context-menu {
  position: fixed;
  z-index: 1000;

  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  min-width: 120px;
}

.context-menu ul {
  list-style: none;
  padding: 8px 0;
  margin: 0;
}

.context-menu li {
  padding: 8px 16px;
  cursor: pointer;
}

.context-menu li:hover {
  background-color: #f5f5f5;
}
</style>
