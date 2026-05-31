import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'

interface ExportSubmitOptions<Response extends { message?: string | null }> {
  submit: (ids: number[]) => Promise<Response>
}

export function useExportSubmit<Response extends { message?: string | null }>(options: ExportSubmitOptions<Response>) {
  const { t } = useI18n()

  const submitSelectedExport = async (ids: number[]) => {
    if (ids.length === 0) {
      ElNotification.error({ message: t('common.selectAtLeastOne') })
      return
    }

    const data = await options.submit([...ids])
    ElNotification.success({ message: data.message || t('common.export.submitted') })
  }

  return { submitSelectedExport }
}
