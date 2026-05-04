<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument } from '@element-plus/icons-vue'
import type { SystemLogDisplayLine } from '../composables/useSystemLog'

interface Props {
  lines: SystemLogDisplayLine[]
  loading: boolean
  autoScroll: boolean
}

interface Emits {
  copyLine: [line: SystemLogDisplayLine]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const viewerRef = useTemplateRef<HTMLElement>('viewer')

watch(
  () => props.lines,
  async () => {
    if (!props.autoScroll) return
    await nextTick()
    const el = viewerRef.value
    if (el) el.scrollTop = el.scrollHeight
  },
  { flush: 'post' },
)
</script>

<template>
  <div
    ref="viewer"
    v-loading="loading"
    class="system-log-viewer"
  >
    <div
      v-if="lines.length"
      class="log-lines"
    >
      <div
        v-for="line in lines"
        :key="line.number"
        class="log-line"
        :class="`is-${line.tone}`"
      >
        <span class="line-number">{{ line.number }}</span>
        <span
          v-if="line.level"
          class="line-level"
        >
          {{ line.level }}
        </span>
        <span
          v-else
          class="line-level is-empty"
        />
        <span class="line-content">
          <template
            v-for="(segment, segmentIndex) in line.segments"
            :key="`${line.number}-${segmentIndex}`"
          >
            <mark v-if="segment.hit">{{ segment.text }}</mark>
            <span v-else>{{ segment.text }}</span>
          </template>
        </span>
        <button
          type="button"
          class="line-copy"
          :title="t('systemLog.actions.copyLine')"
          @click="emit('copyLine', line)"
        >
          <el-icon :size="13">
            <CopyDocument />
          </el-icon>
        </button>
      </div>
    </div>

    <el-empty
      v-else-if="!loading"
      class="log-empty"
      :description="t('systemLog.empty')"
      :image-size="90"
    />
  </div>
</template>

<style scoped>
.system-log-viewer {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background:
    radial-gradient(circle at 20% 0%, rgba(64, 158, 255, 0.12), transparent 26%),
    #15171c;
  color: #d7dae0;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 12px;
  line-height: 1.62;
}

.log-lines {
  padding: 10px 0;
}

.log-line {
  position: relative;
  display: flex;
  align-items: flex-start;
  min-height: 23px;
  padding: 1px 40px 1px 12px;
  border-left: 3px solid transparent;
  color: #d7dae0;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-line:hover {
  background: rgba(255, 255, 255, 0.055);
}

.line-number {
  width: 54px;
  flex-shrink: 0;
  padding-right: 12px;
  color: #717886;
  text-align: right;
  user-select: none;
}

.line-level {
  width: 68px;
  flex-shrink: 0;
  color: #8f98a8;
  font-weight: 700;
  user-select: none;
}

.line-level.is-empty {
  width: 16px;
}

.line-content {
  flex: 1;
  min-width: 0;
}

.line-copy {
  position: absolute;
  top: 2px;
  right: 10px;
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #b8c0cc;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.14s ease, background 0.14s ease;
}

.log-line:hover .line-copy {
  opacity: 1;
}

.line-copy:hover {
  background: rgba(255, 255, 255, 0.14);
}

.is-error {
  border-left-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  color: #ffb4a8;
}

.is-error .line-level {
  color: #ff8f8f;
}

.is-warning {
  border-left-color: #f0b429;
  background: rgba(240, 180, 41, 0.08);
  color: #f6d365;
}

.is-warning .line-level {
  color: #f0b429;
}

.is-info .line-level {
  color: #8fd694;
}

.is-debug {
  color: #a8d6ff;
}

.is-debug .line-level {
  color: #7cc7ff;
}

:deep(mark) {
  padding: 0 2px;
  border-radius: 2px;
  background: #ffe66d;
  color: #15171c;
}

.log-empty {
  padding-top: 72px;
}

@media (max-width: 768px) {
  .system-log-viewer {
    min-height: 360px;
    font-size: 11px;
  }

  .log-line {
    padding-right: 12px;
  }

  .line-number {
    width: 38px;
    padding-right: 8px;
  }

  .line-level {
    display: none;
  }

  .line-copy {
    display: none;
  }
}
</style>
