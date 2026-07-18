<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { AppDialog } from '@/components/AppDialog'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
  openService: []
  openPolicy: []
}>()

const { t } = useI18n()

function handleVisibleChange(visible: boolean) {
  if (!visible) emit('cancel')
}
</script>

<template>
  <AppDialog
    :model-value="visible"
    :title="t('loginPage.policyConfirm.title')"
    width="440px"
    body-padding="24px"
    align-center
    append-to-body
    destroy-on-close
    aria-describedby="login-policy-confirm-description"
    class="login-policy-confirm-dialog"
    @update:model-value="handleVisibleChange"
  >
    <div class="policy-confirm-content">
      <p
        id="login-policy-confirm-description"
        class="policy-confirm-description"
      >
        {{ t('loginPage.policyConfirm.description') }}
      </p>
      <div class="policy-confirm-links">
        <button
          type="button"
          class="policy-link"
          data-testid="policy-service"
          @click="$emit('openService')"
        >
          {{ t('loginPage.form.serviceTerms') }}
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          class="policy-link"
          data-testid="policy-privacy"
          @click="$emit('openPolicy')"
        >
          {{ t('loginPage.form.privacyPolicy') }}
        </button>
      </div>
    </div>

    <template #footer>
      <div class="policy-confirm-actions">
        <el-button
          data-testid="policy-cancel"
          @click="$emit('cancel')"
        >
          {{ t('loginPage.policyConfirm.cancel') }}
        </el-button>
        <el-button
          data-testid="policy-confirm"
          type="primary"
          @click="$emit('confirm')"
        >
          {{ t('loginPage.policyConfirm.confirm') }}
        </el-button>
      </div>
    </template>
  </AppDialog>
</template>

<style scoped>
.policy-confirm-content {
  color: var(--el-text-color-regular);
}

.policy-confirm-description {
  margin: 0;
  line-height: 1.7;
}

.policy-confirm-links {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: var(--el-text-color-secondary);
}

.policy-link {
  padding: 0;
  border: 0;
  color: var(--el-color-primary);
  background: transparent;
  font: inherit;
  cursor: pointer;
}

.policy-link:hover,
.policy-link:focus-visible {
  text-decoration: underline;
}

.policy-link:focus-visible {
  outline: 2px solid var(--el-color-primary-light-5);
  outline-offset: 3px;
  border-radius: 2px;
}

.policy-confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
