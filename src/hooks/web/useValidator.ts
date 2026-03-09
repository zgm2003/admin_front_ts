import { useI18n } from 'vue-i18n'

type Callback = (error?: string | Error | undefined) => void

interface LengthRange {
  min: number
  max: number
  message?: string
}

export const useValidator = () => {
  const { t } = useI18n()

  const required = (message?: string) => {
    return {
      required: true,
      message: message || t('common.required')
    }
  }

  const lengthRange = (val: any, callback: Callback, options: LengthRange) => {
    const { min, max, message } = options
    if (val.length < min || val.length > max) {
      callback(new Error(message || t('common.lengthRange', { min, max })))
    } else {
      callback()
    }
  }

  const notSpace = (val: any, callback: Callback, message?: string) => {
    if (val.indexOf(' ') !== -1) {
      callback(new Error(message || t('common.notSpace')))
    } else {
      callback()
    }
  }

  const notSpecialCharacters = (val: any, callback: Callback, message?: string) => {
    if (/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/gi.test(val)) {
      callback(new Error(message || t('common.notSpecialCharacters')))
    } else {
      callback()
    }
  }

  const isEqual = (val1: string, val2: string, callback: Callback, message?: string) => {
    if (val1 === val2) {
      callback()
    } else {
      callback(new Error(message || t('common.notEqual')))
    }
  }

  const isEmail = (val: any, callback: Callback, message?: string) => {
    const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!reg.test(val)) {
      callback(new Error(message || t('common.emailError')))
    } else {
      callback()
    }
  }

  const isMobile = (val: any, callback: Callback, message?: string) => {
    const reg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/
    if (!reg.test(val)) {
      callback(new Error(message || t('common.mobileError')))
    } else {
      callback()
    }
  }

  const isUrl = (val: any, callback: Callback, message?: string) => {
    const reg = /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/
    if (!reg.test(val)) {
      callback(new Error(message || t('common.urlError')))
    } else {
      callback()
    }
  }

  return {
    required,
    lengthRange,
    notSpace,
    notSpecialCharacters,
    isEqual,
    isEmail,
    isMobile,
    isUrl
  }
}
