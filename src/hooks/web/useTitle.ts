import { watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useTitle = (newTitle?: string) => {
  const { t } = useI18n()
  const title = ref(newTitle ? t(newTitle) : '')

  watch(
    title,
    (n, o) => {
      if (typeof n === 'string' && n !== o && document) {
        document.title = n
      }
    },
    { immediate: true }
  )

  return title
}
