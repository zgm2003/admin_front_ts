<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <header class="login-mobile-brand" role="banner">
    <div class="mobile-brand-header">
      <div class="logo-box">
        <div class="logo-icon">
          <img src="/logo.png" :alt="t('loginPage.brand.logoAlt')" />
        </div>
      </div>
      <div class="brand-info">
        <h2 class="brand-name">{{ t('loginPage.brand.name') }}</h2>
        <p
          class="brand-tagline"
          :aria-label="`${t('loginPage.brand.titleLine1')} ${t('loginPage.brand.titleHighlight')}`"
        >
          <span class="tagline-part">{{ t('loginPage.brand.titleLine1') }}</span>
          <span class="tagline-dot" aria-hidden="true">·</span>
          <span class="tagline-part tagline-accent">{{ t('loginPage.brand.titleHighlight') }}</span>
        </p>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.login-mobile-brand {
  box-sizing: border-box;
  padding: 8px 14px 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.mobile-brand-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .logo-box {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 10px;
    background: var(--el-color-primary);
    color: var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2);
  }

  .logo-icon {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    background: var(--el-color-primary);

    img {
      width: 14px;
      height: 14px;
      filter: brightness(0) invert(1);
    }
  }

  .brand-info {
    min-width: 0;
    flex: 1;
    text-align: left;
  }

  .brand-name {
    margin: 0;
    color: var(--el-text-color-primary, #0f172a);
    font-size: 16px;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .brand-tagline {
    margin: 1px 0 0;
    padding: 0;
    color: var(--el-text-color-secondary, #64748b);
    font-size: 11px;
    font-weight: 500;
    line-height: 1.35;
  }

  .tagline-dot {
    margin: 0 4px;
    color: var(--el-border-color, #94a3b8);
    font-weight: 400;
  }

  .tagline-part:not(.tagline-accent) {
    color: var(--el-text-color-regular, #475569);
    font-weight: 600;
  }

  .tagline-part.tagline-accent {
    color: var(--el-color-primary);
    font-weight: 700;
  }
}
</style>
