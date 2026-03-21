<template>
  <div class="brand-section">
    <div class="brand-content">
      <div class="brand-header animate-fade-in-down">
        <div class="logo-box">
          <div class="logo-icon">
            <img src="/logo.png" :alt="t('loginPage.brand.logoAlt')" />
          </div>
        </div>
        <div class="brand-info">
          <h2 class="brand-name">{{ t('loginPage.brand.name') }}</h2>
          <span class="brand-tag">{{ t('loginPage.brand.tag') }}</span>
        </div>
      </div>

      <div class="main-text animate-fade-in-up">
        <h1 class="main-title">
          {{ t('loginPage.brand.titleLine1') }}<br />
          <span class="highlight">{{ t('loginPage.brand.titleHighlight') }}</span>
        </h1>
        <p class="sub-title">
          {{ t('loginPage.brand.description') }}
        </p>
      </div>

      <div class="feature-cards">
        <div
          v-for="(feature, index) in features"
          :key="feature.title"
          class="feature-card animate-slide-in"
          :style="{ animationDelay: `${(index + 2) * 0.1}s` }"
        >
          <div class="card-icon">
            <el-icon :size="24"><component :is="feature.icon" /></el-icon>
          </div>
          <div class="card-info">
            <h3 class="card-title">{{ feature.title }}</h3>
            <p class="card-desc">{{ feature.desc }}</p>
          </div>
        </div>
      </div>

      <div class="stat-footer animate-fade-in">
        <div v-for="stat in stats" :key="stat.label" class="stat-box">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleCheckFilled, Service, StarFilled } from '@element-plus/icons-vue'

const { t } = useI18n()

const features = computed(() => [
  {
    icon: CircleCheckFilled,
    title: t('loginPage.brand.features.secureTitle'),
    desc: t('loginPage.brand.features.secureDesc'),
  },
  {
    icon: Service,
    title: t('loginPage.brand.features.stableTitle'),
    desc: t('loginPage.brand.features.stableDesc'),
  },
  {
    icon: StarFilled,
    title: t('loginPage.brand.features.smartTitle'),
    desc: t('loginPage.brand.features.smartDesc'),
  },
])

const stats = computed(() => [
  {
    value: t('loginPage.brand.stats.trustedUsersValue'),
    label: t('loginPage.brand.stats.trustedUsers'),
  },
  {
    value: t('loginPage.brand.stats.satisfactionValue'),
    label: t('loginPage.brand.stats.satisfaction'),
  },
  {
    value: t('loginPage.brand.stats.enterpriseCustomersValue'),
    label: t('loginPage.brand.stats.enterpriseCustomers'),
  },
])
</script>
