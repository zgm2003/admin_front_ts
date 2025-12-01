export const validateForm = async (formRef: any) => {
  if (!formRef || !formRef.value) return false
  try { await formRef.value.validate(); return true } catch { return false }
}

export const validateField = async (formRef: any, prop: string) => {
  if (!formRef || !formRef.value) return false
  try { await formRef.value.validateField(prop); return true } catch { return false }
}
