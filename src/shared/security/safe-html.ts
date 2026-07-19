import createDOMPurify from 'dompurify'
import type { WindowLike } from 'dompurify'
import type { ObjectDirective } from 'vue'

type HtmlSanitizer = (html: string) => string

export function createMarkdownSanitizer(windowLike: WindowLike): HtmlSanitizer {
  const purifier = createDOMPurify(windowLike)
  if (!purifier.isSupported) throw new Error('HTML sanitizer is unavailable')
  const sanitize: HtmlSanitizer = (html) => purifier.sanitize(html, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['form', 'iframe', 'object', 'embed', 'style'],
      FORBID_ATTR: ['style'],
    })
  if (sanitize('<script>unsafe</script>').includes('<script')) {
    throw new Error('HTML sanitizer failed its startup probe')
  }
  return sanitize
}

let browserSanitizer: HtmlSanitizer | undefined

export function sanitizeMarkdownHtml(html: string): string {
  browserSanitizer ??= createMarkdownSanitizer(window)
  return browserSanitizer(html)
}

function renderSafeHtml(element: HTMLElement, html: string): void {
  element.innerHTML = sanitizeMarkdownHtml(html)
}

export const vSafeHtml: ObjectDirective<HTMLElement, string> = {
  mounted(element, binding) {
    renderSafeHtml(element, binding.value)
  },
  updated(element, binding) {
    if (binding.value !== binding.oldValue) renderSafeHtml(element, binding.value)
  },
}
