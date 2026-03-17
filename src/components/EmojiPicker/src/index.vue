<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  select: [emoji: string]
}>()

const activeTab = ref(0)

// 常用 emoji 分类
const emojiCategories = [
  {
    name: '笑脸',
    icon: '😀',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔']
  },
  {
    name: '手势',
    icon: '👋',
    emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏']
  },
  {
    name: '表情',
    icon: '😐',
    emojis: ['😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞']
  },
  {
    name: '爱心',
    icon: '❤️',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️']
  },
  {
    name: '动物',
    icon: '🐶',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋']
  },
  {
    name: '食物',
    icon: '🍎',
    emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠']
  },
  {
    name: '活动',
    icon: '⚽️',
    emojis: ['⚽️', '🏀', '🏈', '⚾️', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳️', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷']
  },
  {
    name: '符号',
    icon: '💯',
    emojis: ['❤️', '💔', '💯', '💢', '💬', '👁️‍🗨️', '🗨', '🗯', '💭', '💤', '💮', '♨️', '💈', '🛑', '🕛', '⏰', '⏱', '⏲', '🕰', '🌡', '⛱', '🧭', '🎃', '🎄', '🧨', '🎈', '🎉', '🎊', '🎋', '🎍']
  }
]

const defaultCategory = emojiCategories[0]!
const activeCategory = computed(() => emojiCategories[activeTab.value] ?? defaultCategory)

function handleSelect(emoji: string) {
  emit('select', emoji)
}
</script>

<template>
  <div class="emoji-picker">
    <!-- 分类标签 -->
    <div class="tabs">
      <div
        v-for="(cat, idx) in emojiCategories"
        :key="idx"
        class="tab"
        :class="{ active: activeTab === idx }"
        @click="activeTab = idx"
      >
        {{ cat.icon }}
      </div>
    </div>

    <!-- emoji 列表 -->
    <div class="emoji-list">
      <div
        v-for="emoji in activeCategory.emojis"
        :key="emoji"
        class="emoji-item"
        @click="handleSelect(emoji)"
      >
        {{ emoji }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  width: 320px;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}

.tab {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  user-select: none;
}

.tab:hover {
  background: var(--el-fill-color);
}

.tab.active {
  border-bottom-color: var(--el-color-primary);
  background: var(--el-bg-color);
}

.emoji-list {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  padding: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.emoji-item {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  user-select: none;
}

.emoji-item:hover {
  background: var(--el-fill-color-light);
  transform: scale(1.2);
}

.emoji-item:active {
  transform: scale(1.1);
}

/* 滚动条样式 */
.emoji-list::-webkit-scrollbar {
  width: 6px;
}

.emoji-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.emoji-list::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-dark);
}
</style>
