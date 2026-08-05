<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ContextDocumentPanel from './components/ContextDocumentPanel.vue'
import ContextEvaluationPanel from './components/ContextEvaluationPanel.vue'
import ContextProfilePanel from './components/ContextProfilePanel.vue'
import ContextSpacePanel from './components/ContextSpacePanel.vue'
import { useContextWorkspace } from './use-context-workspace'

const { t } = useI18n()
const workspace = useContextWorkspace()
</script>

<template>
  <main class="context-workspace">
    <header class="context-workspace__header">
      <div>
        <h2>{{ t('aiContext.title') }}</h2>
        <p>{{ t('aiContext.subtitle') }}</p>
      </div>
      <el-tag
        effect="plain"
        type="info"
      >
        {{ t('aiContext.contractMode') }}
      </el-tag>
    </header>

    <el-tabs
      v-model="workspace.activeTab.value"
      class="context-workspace__tabs"
    >
      <el-tab-pane
        :label="t('aiContext.tabs.spaces')"
        name="spaces"
      >
        <ContextSpacePanel
          :profiles="workspace.profiles.value"
          :spaces="workspace.spaces.value"
          :selected-profile-id="workspace.selectedProfileID.value"
          :selected-space-id="workspace.selectedSpaceID.value"
          :loading="workspace.profilesLoading.value || workspace.spacesLoading.value"
          @select-profile="workspace.selectedProfileID.value = $event"
          @select-space="workspace.selectedSpaceID.value = $event"
          @changed="workspace.refreshSpaces"
        />
      </el-tab-pane>
      <el-tab-pane
        :label="t('aiContext.tabs.documents')"
        name="documents"
      >
        <ContextDocumentPanel
          :space="workspace.selectedSpace.value"
          :documents="workspace.documents.value"
          :versions="workspace.versions.value"
          :selected-document-id="workspace.selectedDocumentID.value"
          :loading="workspace.documentsLoading.value"
          :versions-loading="workspace.versionsLoading.value"
          @select="workspace.selectedDocumentID.value = $event"
          @changed="workspace.refreshDocuments"
          @version-created="workspace.refreshVersions"
        />
      </el-tab-pane>
      <el-tab-pane
        :label="t('aiContext.tabs.profiles')"
        name="profiles"
      >
        <ContextProfilePanel
          :profiles="workspace.profiles.value"
          :embedding-model-options="workspace.embeddingModelOptions.value"
          :memory-model-options="workspace.memoryModelOptions.value"
          :reranker-model-options="workspace.rerankerModelOptions.value"
          :selected-id="workspace.selectedProfileID.value"
          :loading="workspace.profilesLoading.value"
          @select="workspace.selectedProfileID.value = $event"
          @changed="workspace.refreshProfiles"
        />
      </el-tab-pane>
      <el-tab-pane
        :label="t('aiContext.tabs.evaluation')"
        name="evaluation"
      >
        <ContextEvaluationPanel
          :result="workspace.evaluation.value"
          :loading="workspace.evaluationLoading.value"
          @run="workspace.runEvaluation($event.agentID, $event.query)"
        />
      </el-tab-pane>
    </el-tabs>
  </main>
</template>

<style scoped>
.context-workspace {
  height: 100%;
  min-height: 0;
  overflow: auto;
  padding: 20px 24px;
  background: var(--el-bg-color-page);
}

.context-workspace__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.context-workspace__header h2 {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: 0;
}

.context-workspace__header p {
  margin: 3px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.context-workspace__tabs {
  margin-top: 8px;
}

@media (max-width: 760px) {
  .context-workspace { padding: 14px; }
  .context-workspace__header { align-items: center; }
  .context-workspace__header p { display: none; }
}
</style>
