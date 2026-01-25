import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

export function useCopy() {
  const { t } = useI18n()

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success(t('common.success.copy'))
    } catch {
      ElMessage.error(t('common.fail.copy'))
    }
  }

  return { copy }
}
