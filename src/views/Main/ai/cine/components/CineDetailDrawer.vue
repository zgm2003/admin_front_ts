<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { CineProjectItem } from '@/api/ai/cine'

const props = defineProps<{
  visible: boolean
  project: CineProjectItem | null
  storyboardLoading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'generateStoryboard': [project: CineProjectItem]
}>()

const { t } = useI18n()

const shotlist = computed(() => props.project?.shotlist_json ?? [])
const videoPromptPacks = computed(() => props.project?.feed_pack_json ?? [])
const assets = computed(() => props.project?.assets ?? [])
const continuity = computed(() => props.project?.continuity_review ?? null)
const canGenerateStoryboard = computed(() => {
  const project = props.project
  if (!project) return false
  return [3, 5, 6].includes(project.status) && assets.value.length > 0
})

function formatJson(value: unknown) {
  if (!value) return '-'
  return JSON.stringify(value, null, 2)
}

async function copyText(text: string | null | undefined) {
  if (!text) return
  await navigator.clipboard.writeText(text)
  ElNotification.success({ message: t('cine.messages.copied') })
}
</script>

<template>
  <el-drawer
    :model-value="visible"
    :title="project?.title || t('cine.detail.title')"
    size="72%"
    destroy-on-close
    class="cine-detail-drawer"
    @update:model-value="emit('update:visible', $event)"
  >
    <div
      v-if="project"
      class="detail-shell"
    >
      <div class="detail-meta">
        <el-tag size="large">
          {{ project.status_name }}
        </el-tag>
        <el-tag
          size="large"
          type="warning"
          effect="plain"
        >
          {{ project.duration_seconds }}s / {{ project.aspect_ratio }}
        </el-tag>
        <span class="meta-time">{{ project.created_at }}</span>
      </div>

      <el-tabs class="detail-tabs">
        <el-tab-pane :label="t('cine.detail.deliverable')">
          <div class="panel-head">
            <span>{{ t('cine.detail.deliverableHint') }}</span>
            <el-button
              text
              type="primary"
              @click="copyText(project.deliverable_markdown)"
            >
              {{ t('cine.actions.copy') }}
            </el-button>
          </div>
          <pre class="markdown-block">{{ project.deliverable_markdown || '-' }}</pre>
        </el-tab-pane>

        <el-tab-pane :label="t('cine.detail.shotlist')">
          <div class="shot-grid">
            <article
              v-for="(shot, index) in shotlist"
              :key="String(shot.shot_id || index)"
              class="shot-card"
            >
              <div class="shot-id">
                {{ shot.shot_id || '-' }} · {{ shot.duration_seconds || '-' }}s
              </div>
              <h3>{{ shot.scene || '-' }}</h3>
              <p>{{ shot.action || '-' }}</p>
              <dl>
                <dt>{{ t('cine.detail.performance') }}</dt><dd>{{ shot.performance_detail || '-' }}</dd>
                <dt>{{ t('cine.detail.camera') }}</dt><dd>{{ shot.shot_size || '-' }} / {{ shot.camera_movement || '-' }}</dd>
                <dt>{{ t('cine.detail.continuity') }}</dt><dd>{{ shot.continuity_from_previous || '-' }}</dd>
              </dl>
              <el-button
                text
                type="primary"
                @click="copyText(String(shot.image_prompt || ''))"
              >
                {{ t('cine.actions.copyImagePrompt') }}
              </el-button>
            </article>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('cine.detail.videoPrompts')">
          <div class="feed-list">
            <article
              v-for="(pack, index) in videoPromptPacks"
              :key="String(pack.segment || index)"
              class="feed-card"
            >
              <div class="feed-title">
                {{ pack.segment || t('cine.detail.segment') }} · {{ pack.duration_seconds || '-' }}s
              </div>
              <div class="upload-line">
                {{ t('cine.detail.uploadImages') }}：{{ Array.isArray(pack.upload_images) ? pack.upload_images.join('、') : '-' }}
              </div>
              <pre>{{ pack.prompt || '-' }}</pre>
              <el-button
                type="primary"
                plain
                @click="copyText(String(pack.prompt || ''))"
              >
                {{ t('cine.actions.copyVideoPrompt') }}
              </el-button>
            </article>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('cine.detail.assets')">
          <div class="panel-head">
            <span>{{ t('cine.detail.assetsHint') }}</span>
            <el-button
              type="warning"
              plain
              :loading="storyboardLoading"
              :disabled="!canGenerateStoryboard"
              @click="emit('generateStoryboard', project)"
            >
              {{ t('cine.actions.generateStoryboard') }}
            </el-button>
          </div>
          <div class="asset-grid">
            <article
              v-for="asset in assets"
              :key="asset.id"
              class="asset-card"
            >
              <div class="asset-preview">
                <el-image
                  v-if="asset.file_url"
                  :src="asset.file_url"
                  fit="cover"
                  :preview-src-list="[asset.file_url]"
                  preview-teleported
                />
                <span v-else>{{ asset.shot_id }}</span>
              </div>
              <div class="asset-info">
                <strong>{{ asset.shot_id }} · {{ asset.status_name }}</strong>
                <p>{{ asset.prompt }}</p>
              </div>
            </article>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('cine.detail.raw')">
          <div class="raw-grid">
            <pre>{{ formatJson(project.draft_json) }}</pre>
            <pre>{{ formatJson(continuity) }}</pre>
            <pre class="raw-wide">{{ project.model_origin || '-' }}</pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </el-drawer>
</template>

<style scoped>
.detail-shell { display: flex; flex-direction: column; gap: 16px; }
.detail-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.meta-time { color: var(--el-text-color-secondary); font-size: 13px; }
.detail-tabs { --el-tabs-header-height: 44px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; color: var(--el-text-color-secondary); }
.markdown-block, .feed-card pre, .raw-grid pre { white-space: pre-wrap; word-break: break-word; margin: 0; padding: 16px; border-radius: 16px; background: #0f172a; color: #f8fafc; line-height: 1.7; font-size: 13px; }
.shot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.shot-card, .feed-card, .asset-card { border: 1px solid var(--el-border-color-light); border-radius: 18px; background: var(--el-bg-color); box-shadow: 0 10px 28px rgba(15, 23, 42, .06); }
.shot-card { padding: 16px; }
.shot-id { color: #b45309; font-size: 12px; font-weight: 800; letter-spacing: .06em; }
.shot-card h3 { margin: 8px 0; font-size: 17px; }
.shot-card p { min-height: 42px; color: var(--el-text-color-regular); line-height: 1.6; }
dl { display: grid; grid-template-columns: 72px 1fr; gap: 6px 10px; margin: 12px 0; font-size: 13px; }
dt { color: var(--el-text-color-secondary); }
dd { margin: 0; color: var(--el-text-color-primary); }
.feed-list { display: flex; flex-direction: column; gap: 14px; }
.feed-card { padding: 16px; }
.feed-title { font-weight: 800; margin-bottom: 8px; }
.upload-line { margin-bottom: 10px; color: var(--el-text-color-secondary); }
.feed-card pre { margin-bottom: 12px; background: #111827; }
.asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
.asset-card { display: grid; grid-template-columns: 110px 1fr; overflow: hidden; }
.asset-preview { display: grid; place-items: center; min-height: 110px; background: linear-gradient(135deg, #111827, #7c2d12); color: #fef3c7; font-weight: 900; }
.asset-preview :deep(.el-image) { width: 100%; height: 100%; }
.asset-info { padding: 12px; min-width: 0; }
.asset-info p { margin: 8px 0 0; color: var(--el-text-color-secondary); line-height: 1.55; font-size: 13px; }
.raw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.raw-wide { grid-column: 1 / -1; }
@media (max-width: 900px) { .raw-grid, .asset-card { grid-template-columns: 1fr; } }
</style>
