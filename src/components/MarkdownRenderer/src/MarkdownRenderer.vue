<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  content: string
}>()

// 配置 markdown-it 与 highlight.js
const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string): string => {
    const langClass = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
    try {
      const highlighted = hljs.highlight(str, {language: langClass, ignoreIllegals: true}).value
      return `<pre class="code-block"><div class="code-header"><span class="code-lang">${langClass}</span><button class="copy-btn" data-code="${encodeURIComponent(str)}">复制</button></div><code class="hljs language-${langClass}">${highlighted}</code></pre>`
    } catch {
      return `<pre class="code-block"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`
    }
  }
})

const renderedHtml = computed(() => {
  return md.render(props.content || '')
})

const containerRef = ref<HTMLElement | null>(null)

// 处理复制按钮点击
const handleClick = (e: Event) => {
  const target = e.target as HTMLElement
  if (target.classList.contains('copy-btn')) {
    const code = decodeURIComponent(target.dataset.code || '')
    navigator.clipboard.writeText(code).then(() => {
      target.textContent = '已复制'
      setTimeout(() => {
        target.textContent = '复制'
      }, 2000)
    })
  }
}

onMounted(() => {
  containerRef.value?.addEventListener('click', handleClick)
})
</script>

<template>
  <div ref="containerRef" class="markdown-body" v-html="renderedHtml"></div>
</template>


<style scoped>
.markdown-body {
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
  color: var(--el-text-color-primary);
}

.markdown-body :deep(p) {
  margin: 0 0 0.75em;
}

.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.75em 0;
  padding-left: 1.5em;
}

.markdown-body :deep(li) {
  margin: 0.35em 0;
}

.markdown-body :deep(blockquote) {
  margin: 0.75em 0;
  padding: 0.75em 1em;
  border-left: 4px solid var(--el-color-primary-light-5);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  border-radius: 0 8px 8px 0;
}

.markdown-body :deep(code:not(.hljs)) {
  padding: 0.2em 0.5em;
  margin: 0 0.2em;
  font-size: 0.85em;
  background: var(--el-fill-color);
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  color: var(--el-color-danger);
}

/* 代码块 - 暗色主题 */
.markdown-body :deep(.code-block) {
  position: relative;
  margin: 0.75em 0;
  border-radius: 12px;
  overflow: hidden;
  background: #1a1b26;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.markdown-body :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #24283b;
  border-bottom: 1px solid #414868;
}

.markdown-body :deep(.code-lang) {
  font-size: 12px;
  font-weight: 500;
  color: #7aa2f7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.markdown-body :deep(.copy-btn) {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 500;
  color: #a9b1d6;
  background: rgba(122, 162, 247, 0.1);
  border: 1px solid #414868;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.markdown-body :deep(.copy-btn:hover) {
  color: #7aa2f7;
  background: rgba(122, 162, 247, 0.2);
  border-color: #7aa2f7;
}

.markdown-body :deep(.hljs) {
  display: block;
  padding: 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  background: transparent !important;
}

.markdown-body :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
  font-weight: 500;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 0.75em 0;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 10px 14px;
  border: 1px solid var(--el-border-color-lighter);
}

.markdown-body :deep(th) {
  background: var(--el-fill-color-light);
  font-weight: 600;
  text-align: left;
}

.markdown-body :deep(tr:hover td) {
  background: var(--el-fill-color-lighter);
}

.markdown-body :deep(hr) {
  margin: 1.5em 0;
  border: none;
  border-top: 1px solid var(--el-border-color-lighter);
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin: 1em 0 0.5em;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.markdown-body :deep(h1) { font-size: 1.5em; }
.markdown-body :deep(h2) { font-size: 1.35em; }
.markdown-body :deep(h3) { font-size: 1.2em; }

.markdown-body :deep(strong) {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.markdown-body :deep(em) {
  font-style: italic;
}

/* 图片 */
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.5em 0;
}
</style>
