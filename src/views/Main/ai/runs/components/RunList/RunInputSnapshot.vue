<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatFileSize, resolveTrustedFileURL } from '@/lib/browser/download'
import {
  parseRunInputSnapshot,
  type RunInputSnapshotRuntimeParams,
} from './input-snapshot'

const props = defineProps<{ snapshot: string }>()
const { t } = useI18n()
const snapshotView = computed(() => parseRunInputSnapshot(props.snapshot))
const attachmentViews = computed(() => {
  const view = snapshotView.value
  if (view.kind !== 'structured') return []
  return view.attachments.map((attachment) => ({
    ...attachment,
    previewUrl: trustedFileURL(attachment.url),
  }))
})
const runtimeParamOrder: Array<keyof RunInputSnapshotRuntimeParams> = [
  'temperature',
  'max_tokens',
  'max_history',
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

function trustedFileURL(input: string): string {
  try {
    return resolveTrustedFileURL(input)
  } catch {
    return ''
  }
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
            v-for="(attachment, index) in attachmentViews"
            :key="`${attachment.type}:${attachment.url}:${index}`"
            class="run-input-snapshot__attachment"
            :class="{ 'has-preview': attachment.previewUrl !== '' }"
          >
            <el-image
              v-if="attachment.previewUrl"
              class="run-input-snapshot__preview"
              :src="attachment.previewUrl"
              :preview-src-list="[attachment.previewUrl]"
              fit="cover"
              preview-teleported
            />
            <dl class="run-input-snapshot__facts">
              <div>
                <dt>{{ t('aiRuns.detail.attachmentName') }}</dt>
                <dd>{{ attachment.name }}</dd>
              </div>
              <div>
                <dt>{{ t('aiRuns.detail.attachmentType') }}</dt>
                <dd>{{ attachment.type }}</dd>
              </div>
              <div>
                <dt>{{ t('aiRuns.detail.attachmentSize') }}</dt>
                <dd>{{ formatFileSize(attachment.size) }}</dd>
              </div>
              <div class="run-input-snapshot__url">
                <dt>{{ t('aiRuns.detail.attachmentUrl') }}</dt>
                <dd><code>{{ attachment.url }}</code></dd>
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
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
  padding: 10px 0;
  border-top: 1px solid var(--el-border-color-extra-light);
}

.run-input-snapshot__attachment:first-child {
  padding-top: 0;
  border-top: 0;
}

.run-input-snapshot__attachment.has-preview {
  grid-template-columns: 72px minmax(0, 1fr);
}

.run-input-snapshot__preview {
  width: 72px;
  height: 72px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
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

.run-input-snapshot__url {
  grid-column: 1 / -1;
}

.run-input-snapshot__url code {
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.run-input-snapshot__runtime {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 720px) {
  .run-input-snapshot__facts,
  .run-input-snapshot__runtime {
    grid-template-columns: 1fr;
  }

  .run-input-snapshot__url {
    grid-column: auto;
  }
}
</style>
