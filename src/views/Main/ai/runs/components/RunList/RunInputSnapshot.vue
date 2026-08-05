<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AiRunApi } from '@/api/ai/runs'
import { formatFileSize } from '@/lib/browser/download'
import {
  parseRunInputSnapshot,
  type RunInputSnapshotAttachment,
  type RunInputSnapshotRuntimeParams,
} from './input-snapshot'

type PreviewStatus = 'loading' | 'ready' | 'unavailable'
type AttachmentView = RunInputSnapshotAttachment & {
  previewStatus: PreviewStatus
  previewUrl: string
}

const props = defineProps<{ runId: number; snapshot: string }>()
const { t } = useI18n()
const snapshotView = computed(() => parseRunInputSnapshot(props.snapshot))
const attachmentViews = ref<AttachmentView[]>([])

watch([() => props.runId, snapshotView], ([runId, view], _previous, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  if (view.kind !== 'structured') {
    attachmentViews.value = []
    return
  }
  attachmentViews.value = view.attachments.map((attachment) => ({
    ...attachment,
    previewStatus: 'loading',
    previewUrl: '',
  }))
  for (const attachment of attachmentViews.value) {
    void loadPreview(runId, attachment.ordinal, controller.signal)
  }
}, { immediate: true })

const runtimeParamOrder: Array<keyof RunInputSnapshotRuntimeParams> = [
  'temperature',
  'max_tokens',
]
const runtimeParamEntries = computed(() => {
  const view = snapshotView.value
  if (view.kind !== 'structured' || view.runtimeParams === null) return []
  const params = view.runtimeParams
  return runtimeParamOrder.flatMap((key) => {
    const value = params[key]
    return value === undefined ? [] : [{ key, value }]
  })
})

async function loadPreview(runId: number, ordinal: number, signal: AbortSignal): Promise<void> {
  try {
    const result = await AiRunApi.inputAttachmentPreview({ id: runId, ordinal }, { signal })
    const previewUrl = resolvePreviewURL(result.url)
    if (signal.aborted) return
    setPreviewState(ordinal, 'ready', previewUrl)
  } catch {
    if (signal.aborted) return
    setPreviewState(ordinal, 'unavailable', '')
  }
}

function resolvePreviewURL(input: string): string {
  const base = new URL(globalThis.location.href)
  const url = new URL(input, base)
  if (url.username || url.password) throw new Error('AI run input attachment preview credentials are forbidden')
  if (url.origin !== base.origin && url.protocol !== 'https:') {
    throw new Error('AI run input attachment preview URL must use HTTPS')
  }
  return url.href
}

function setPreviewState(ordinal: number, previewStatus: PreviewStatus, previewUrl: string): void {
  const index = attachmentViews.value.findIndex((attachment) => attachment.ordinal === ordinal)
  const attachment = attachmentViews.value[index]
  if (!attachment) throw new Error(`Missing AI run input attachment ordinal ${ordinal}`)
  attachmentViews.value[index] = { ...attachment, previewStatus, previewUrl }
}
</script>

<template>
  <div class="run-input-snapshot">
    <pre
      v-if="snapshotView.kind === 'raw'"
      data-testid="run-input-raw"
      class="run-input-snapshot__raw"
    >{{ snapshotView.text }}</pre>
    <template v-else>
      <section
        v-if="snapshotView.content.trim() !== ''"
        class="run-input-snapshot__section"
      >
        <h4>{{ t('aiRuns.detail.inputContent') }}</h4>
        <div
          data-testid="run-input-content"
          class="run-input-snapshot__content"
        >
          {{ snapshotView.content }}
        </div>
      </section>

      <section
        v-if="attachmentViews.length > 0"
        class="run-input-snapshot__section"
      >
        <h4>{{ t('aiRuns.detail.attachments') }}</h4>
        <div class="run-input-snapshot__attachments">
          <article
            v-for="attachment in attachmentViews"
            :key="attachment.ordinal"
            class="run-input-snapshot__attachment"
          >
            <div class="run-input-snapshot__preview-frame">
              <el-skeleton-item
                v-if="attachment.previewStatus === 'loading'"
                class="run-input-snapshot__preview"
                variant="image"
              />
              <el-image
                v-else-if="attachment.previewStatus === 'ready'"
                class="run-input-snapshot__preview"
                :src="attachment.previewUrl"
                :preview-src-list="[attachment.previewUrl]"
                fit="cover"
                preview-teleported
              />
              <div
                v-else
                data-testid="run-input-preview-unavailable"
                class="run-input-snapshot__preview-unavailable"
              >
                {{ t('aiRuns.detail.previewUnavailable') }}
              </div>
            </div>
            <dl class="run-input-snapshot__facts">
              <div>
                <dt>{{ t('aiRuns.detail.attachmentName') }}</dt>
                <dd>{{ attachment.name }}</dd>
              </div>
              <div>
                <dt>{{ t('aiRuns.detail.attachmentType') }}</dt>
                <dd>{{ attachment.type }}</dd>
              </div>
              <div v-if="attachment.mimeType !== null">
                <dt>{{ t('aiRuns.detail.attachmentMimeType') }}</dt>
                <dd>{{ attachment.mimeType }}</dd>
              </div>
              <div>
                <dt>{{ t('aiRuns.detail.attachmentSize') }}</dt>
                <dd>{{ formatFileSize(attachment.size) }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </section>

      <section
        v-if="runtimeParamEntries.length > 0"
        class="run-input-snapshot__section"
      >
        <h4>{{ t('aiRuns.detail.runtimeParams') }}</h4>
        <dl class="run-input-snapshot__runtime">
          <div
            v-for="entry in runtimeParamEntries"
            :key="entry.key"
          >
            <dt><code>{{ entry.key }}</code></dt>
            <dd>{{ entry.value }}</dd>
          </div>
        </dl>
      </section>

      <el-collapse class="run-input-snapshot__raw-collapse">
        <el-collapse-item
          name="raw"
          :title="t('aiRuns.detail.rawSnapshot')"
        >
          <pre
            data-testid="run-input-structured-raw"
            class="run-input-snapshot__raw"
          >{{ snapshot }}</pre>
        </el-collapse-item>
      </el-collapse>
    </template>
  </div>
</template>

<style scoped>
.run-input-snapshot {
  min-width: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.run-input-snapshot__raw,
.run-input-snapshot__content {
  max-height: 240px;
  margin: 0;
  overflow: auto;
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 13px;
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.run-input-snapshot__section + .run-input-snapshot__section {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.run-input-snapshot__section h4 {
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 650;
}

.run-input-snapshot__attachments {
  display: grid;
}

.run-input-snapshot__attachment {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.run-input-snapshot__attachment:first-child {
  padding-top: 0;
  border-top: 0;
}

.run-input-snapshot__preview-frame,
.run-input-snapshot__preview {
  width: 72px;
  height: 72px;
}

.run-input-snapshot__preview-frame {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.run-input-snapshot__preview-unavailable {
  display: grid;
  width: 100%;
  height: 100%;
  padding: 6px;
  place-items: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
}

.run-input-snapshot__facts,
.run-input-snapshot__runtime {
  display: grid;
  gap: 6px 16px;
  min-width: 0;
  margin: 0;
}

.run-input-snapshot__facts {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.run-input-snapshot__facts > div,
.run-input-snapshot__runtime > div {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px;
  min-width: 0;
}

.run-input-snapshot__facts dt,
.run-input-snapshot__runtime dt {
  color: var(--el-text-color-secondary);
}

.run-input-snapshot__facts dd,
.run-input-snapshot__runtime dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.run-input-snapshot__runtime {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.run-input-snapshot__raw-collapse {
  margin-top: 12px;
}

@media (max-width: 720px) {
  .run-input-snapshot__facts,
  .run-input-snapshot__runtime {
    grid-template-columns: 1fr;
  }
}
</style>
