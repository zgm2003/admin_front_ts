import { useI18n } from 'vue-i18n'

type Callback = (error?: string | Error | undefined) => void
type ValidatorValue = string

interface LengthRange {
  min: number
  max: number
  message?: string
}

function resolveValidatorMessage(message: string | undefined, fallback: string): string {
  return message === undefined ? fallback : message
}

export const useValidator = () => {
  const { t } = useI18n()

  const required = (message?: string) => {
    return {
      required: true,
      message: resolveValidatorMessage(message, t('common.required'))
    }
  }

  const lengthRange = (val: ValidatorValue, callback: Callback, options: LengthRange) => {
    const { min, max, message } = options
    if (val.length < min || val.length > max) {
      callback(new Error(resolveValidatorMessage(message, t('common.lengthRange', { min, max }))))
    } else {
      callback()
    }
  }

  const notSpace = (val: ValidatorValue, callback: Callback, message?: string) => {
    if (val.indexOf(' ') !== -1) {
      callback(new Error(resolveValidatorMessage(message, t('common.notSpace'))))
    } else {
      callback()
    }
  }

  const notSpecialCharacters = (val: ValidatorValue, callback: Callback, message?: string) => {
    if (/[`~!@#$%^&*()_+<>?:"{},.\/;'[\]]/gi.test(val)) {
      callback(new Error(resolveValidatorMessage(message, t('common.notSpecialCharacters'))))
    } else {
      callback()
    }
  }

  const isEqual = (val1: string, val2: string, callback: Callback, message?: string) => {
    if (val1 === val2) {
      callback()
    } else {
      callback(new Error(resolveValidatorMessage(message, t('common.notEqual'))))
    }
  }

  const isEmail = (val: ValidatorValue, callback: Callback, message?: string) => {
    const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!reg.test(val)) {
      callback(new Error(resolveValidatorMessage(message, t('common.emailError'))))
    } else {
      callback()
    }
  }

  const isMobile = (val: ValidatorValue, callback: Callback, message?: string) => {
    const reg = /^(?:(?:\+|00)86)?1[3-9]\d{9}$/
    if (!reg.test(val)) {
      callback(new Error(resolveValidatorMessage(message, t('common.mobileError'))))
    } else {
      callback()
    }
  }

  const isUrl = (val: ValidatorValue, callback: Callback, message?: string) => {
    const reg = /^(((ht|f)tps?):\/\/)?([^!@#$%^&*?.\s-]([^!@#$%^&*?.\s]{0,63}[^!@#$%^&*?.\s])?\.)+[a-z]{2,6}\/?/
    if (!reg.test(val)) {
      callback(new Error(resolveValidatorMessage(message, t('common.urlError'))))
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
