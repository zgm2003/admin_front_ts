<template>
  <header class="mobile-brand-bar" role="banner">
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

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
