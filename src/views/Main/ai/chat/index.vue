<script setup lang="ts">
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import AgentList from './components/AgentList/index.vue'
import ConversationDrawer from './components/ConversationDrawer/index.vue'
import ConversationList from './components/ConversationList/index.vue'
import MessageList from './components/MessageList/index.vue'
import MessageInput from './components/MessageInput/index.vue'
import { useChatPage } from './use-chat-page'

const {
  t, isMobile, agents, agentsLoading, selectedAgentId, selectedAgent,
  currentConversation, currentConversationId, messages, messagesLoading,
  messagesLoadingMore, messagesHasMore, sending, isStreaming, switchingAgent,
  setMessageInputRef, showConversationDrawer, conversations, conversationsLoading,
  conversationsLoadingMore, conversationsHasMore, showRenameDialog, renameTitle,
  setMessageScrollRef, handleMessageScroll, handleSelectAgent, handleCopyMessage,
  handleSendMessage, handleStopGeneration, handleOpenDrawer, selectConversation,
  handleCreateConversation, handleRenameConversation, handleDeleteConversation,
  loadMoreConversations, searchConversations, confirmRenameConversation,
  handleBackToAgentList,
} = useChatPage()
</script>

<template>
  <div class="chat-container">
    <aside
      v-if="!isMobile"
      class="consumer-sidebar"
    >
      <AgentList
        compact
        :agents="agents"
        :loading="agentsLoading"
        :selected-id="selectedAgentId"
        @select="handleSelectAgent"
      />
      <ConversationList
        :conversations="conversations"
        :loading="conversationsLoading"
        :loading-more="conversationsLoadingMore"
        :has-more="conversationsHasMore"
        :current-id="currentConversationId"
        @select="selectConversation"
        @create="handleCreateConversation"
        @rename="handleRenameConversation"
        @delete="handleDeleteConversation"
        @load-more="loadMoreConversations"
        @search="searchConversations"
      />
    </aside>

    <AgentList
      v-else
      v-show="!selectedAgentId"
      :agents="agents"
      :loading="agentsLoading"
      :selected-id="selectedAgentId"
      @select="handleSelectAgent"
    />

    <section
      v-show="!isMobile || selectedAgentId"
      class="main-area"
      aria-labelledby="ai-chat-title"
    >
      <header
        v-if="isMobile"
        class="main-header"
      >
        <el-button
          text
          class="back-btn"
          :aria-label="t('accessibility.backToAgents')"
          @click="handleBackToAgentList"
        >
          <el-icon :size="20">
            <ArrowLeft />
          </el-icon>
        </el-button>
        <div class="header-content">
          <h1
            id="ai-chat-title"
            class="header-title"
          >
            {{ currentConversation?.title || selectedAgent?.name || t('aiChat.welcome') }}
          </h1>
          <span
            v-if="selectedAgent"
            class="header-agent"
          >{{ selectedAgent.name }}</span>
        </div>
      </header>

      <el-scrollbar
        :ref="setMessageScrollRef"
        class="message-area"
        role="region"
        :aria-label="t('accessibility.chatMessages')"
        @scroll="handleMessageScroll"
      >
        <div
          v-if="switchingAgent"
          class="welcome-area"
          role="status"
        >
          <el-icon
            class="is-loading"
            :size="32"
            color="var(--el-color-primary)"
          >
            <Loading />
          </el-icon>
        </div>

        <div
          v-else-if="selectedAgentId && messages.length === 0 && !messagesLoading"
          class="welcome-area"
        >
          <div class="welcome-content">
            <el-avatar
              :size="64"
              class="welcome-avatar"
            >
              <img
                v-if="selectedAgent?.avatar"
                :src="selectedAgent.avatar"
                :alt="selectedAgent.name"
              >
              {{ selectedAgent?.name?.charAt(0) || '?' }}
            </el-avatar>
            <h1 class="welcome-title">
              {{ selectedAgent?.name }}
            </h1>
            <p class="welcome-tip">
              {{ selectedAgent?.description || t('aiChat.welcomeTip') }}
            </p>
          </div>
        </div>

        <div
          v-else-if="!selectedAgentId && agents.length > 0"
          class="welcome-area"
        >
          <div class="welcome-content">
            <h1 class="welcome-title">
              {{ t('aiChat.welcome') }}
            </h1>
            <p class="welcome-tip">
              {{ t('aiChat.selectAgentFirst') }}
            </p>
          </div>
        </div>

        <div
          v-else-if="!agentsLoading && agents.length === 0"
          class="welcome-area"
        >
          <p class="welcome-tip">
            {{ t('aiChat.noAgentTip') }}
          </p>
        </div>

        <div
          v-if="messagesLoadingMore"
          class="history-tip"
        >
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>{{ t('aiChat.loading') }}</span>
        </div>
        <div
          v-else-if="!messagesHasMore && messages.length > 0"
          class="history-tip"
        >
          {{ t('aiChat.noMoreHistory') }}
        </div>

        <MessageList
          v-if="messages.length > 0 || messagesLoading"
          :messages="messages"
          :loading="messagesLoading"
          :sending="sending"
          @copy="handleCopyMessage"
        />
      </el-scrollbar>

      <MessageInput
        :ref="setMessageInputRef"
        :sending="sending"
        :disabled="!selectedAgentId"
        :is-streaming="isStreaming"
        :show-history-btn="isMobile"
        @send="handleSendMessage"
        @stop="handleStopGeneration"
        @open-history="handleOpenDrawer"
      />
    </section>

    <ConversationDrawer
      v-if="isMobile"
      v-model:visible="showConversationDrawer"
      :conversations="conversations"
      :loading="conversationsLoading"
      :loading-more="conversationsLoadingMore"
      :has-more="conversationsHasMore"
      :current-id="currentConversationId"
      :agent-name="selectedAgent?.name"
      @select="selectConversation"
      @create="handleCreateConversation"
      @rename="handleRenameConversation"
      @delete="handleDeleteConversation"
      @load-more="loadMoreConversations"
      @search="searchConversations"
    />

    <AppDialog
      v-model="showRenameDialog"
      :title="t('aiChat.renameTitle')"
      width="400px"
      mobile-width="94vw"
      body-padding="24px"
      class="rename-dialog"
    >
      <el-input
        v-model="renameTitle"
        :aria-label="t('aiChat.newTitle')"
        :placeholder="t('aiChat.newTitle')"
        maxlength="50"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showRenameDialog = false">
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          type="primary"
          @click="confirmRenameConversation"
        >
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped src="./styles.css"></style>
