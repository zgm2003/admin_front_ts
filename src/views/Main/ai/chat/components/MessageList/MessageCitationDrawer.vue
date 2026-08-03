<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiMessageContext } from '@/api/ai/messages'

defineProps<{ context: AiMessageContext }>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()

function locator(source: AiMessageContext['sources'][number]) {
  const value = source.locator
  const parts = [value.page === null ? '' : value.page ? `p.${value.page}` : '', value.paragraph === null ? '' : value.paragraph ? `para.${value.paragraph}` : '', value.sheet ?? '', value.cell_start ?? ''].filter(Boolean)
  return parts.join(' / ') || value.kind
}
</script>

<template>
  <el-drawer
    v-model="visible"
    :title="t('aiChat.citations.title')"
    size="min(440px, 92vw)"
  >
    <div class="citation-drawer">
      <div class="citation-drawer__meta">
        <span>{{ t('aiChat.citations.outcome') }}</span><strong>{{ context.outcome }}</strong>
      </div>
      <section
        v-if="context.sources.some(source => source.cited)"
        class="citation-section"
      >
        <h4>{{ t('aiChat.citations.cited') }}</h4>
        <article
          v-for="source in context.sources.filter(item => item.cited)"
          :key="source.key"
          class="citation-source"
        >
          <div class="citation-source__title">
            <el-tag
              size="small"
              type="success"
            >
              [{{ source.key }}]
            </el-tag><strong>{{ source.title }}</strong>
          </div>
          <p>{{ locator(source) }}</p><small>{{ source.document_id }} / {{ source.document_version_id }}</small>
        </article>
      </section>
      <section
        v-if="context.sources.some(source => !source.cited)"
        class="citation-section"
      >
        <h4>{{ t('aiChat.citations.unreferenced') }}</h4>
        <article
          v-for="source in context.sources.filter(item => !item.cited)"
          :key="source.key"
          class="citation-source"
        >
          <div class="citation-source__title">
            <el-tag
              size="small"
              type="info"
            >
              [{{ source.key }}]
            </el-tag><strong>{{ source.title }}</strong>
          </div><p>{{ locator(source) }}</p>
        </article>
      </section>
      <section
        v-if="context.invalid_keys.length > 0"
        class="citation-section"
      >
        <h4>{{ t('aiChat.citations.invalid') }}</h4>
        <el-tag
          v-for="key in context.invalid_keys"
          :key="key"
          type="danger"
          effect="plain"
        >
          [{{ key }}]
        </el-tag>
      </section>
      <el-empty
        v-if="context.sources.length === 0 && context.invalid_keys.length === 0"
        :description="t('aiChat.citations.empty')"
      />
    </div>
  </el-drawer>
</template>

<style scoped>
.citation-drawer__meta { display: flex; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid var(--el-border-color-lighter); }
.citation-drawer__meta span, .citation-source p, .citation-source small { color: var(--el-text-color-secondary); font-size: 12px; }
.citation-section { padding: 14px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.citation-section h4 { margin: 0 0 10px; font-size: 13px; }
.citation-source { padding: 9px 0; }
.citation-source__title { display: flex; align-items: center; gap: 8px; }
.citation-source p { margin: 6px 0 3px; }
.citation-section > .el-tag { margin: 0 6px 6px 0; }
</style>
