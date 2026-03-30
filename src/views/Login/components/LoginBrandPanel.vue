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

<template>
  <section class="login-brand-panel">
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
  </section>
</template>

<style scoped lang="scss">
.login-brand-panel {
  flex: 1;
  color: #1f2937;

  @media (max-height: 800px) {
    transform: scale(0.9);
    transform-origin: left center;
  }
}

.brand-content {
  max-width: 560px;
}

.brand-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;

  .logo-box {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-radius: 16px;
    background: var(--el-color-primary);
    color: #ffffff;
    box-shadow: 0 12px 24px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2);
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;

    &:hover {
      transform: rotate(15deg) scale(1.1);
      box-shadow: 0 15px 30px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.3);
    }
  }

  .logo-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: var(--el-color-primary);

    img {
      width: 24px;
      height: 24px;
      filter: brightness(0) invert(1);
    }
  }

  .brand-name {
    margin: 0;
    color: #111827;
    font-size: 26px;
    font-weight: 800;
  }

  .brand-tag {
    color: #6b7280;
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
}

.main-text {
  .main-title {
    margin-bottom: 24px;
    color: #111827;
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;

    .highlight {
      background: linear-gradient(to right, var(--el-color-primary), var(--el-color-primary-light-3));
      background-clip: text;
      -webkit-text-fill-color: transparent;
      -webkit-background-clip: text;
      color: transparent;
    }
  }

  .sub-title {
    margin-bottom: 40px;
    color: #4b5563;
    font-size: 17px;
    line-height: 1.6;
  }
}

.feature-cards {
  display: grid;
  gap: 16px;
  margin-bottom: 48px;

  .feature-card {
    display: flex;
    gap: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    transition: all 0.3s;

    &:hover {
      transform: translateX(10px);
      background: #ffffff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }
  }

  .card-icon {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  .card-title {
    margin-bottom: 4px;
    color: #111827;
    font-size: 16px;
    font-weight: 700;
  }

  .card-desc {
    margin: 0;
    color: #6b7280;
    font-size: 14px;
  }
}

.stat-footer {
  display: flex;
  gap: 48px;
  padding-top: 32px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);

  .stat-box {
    cursor: default;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }
  }

  .stat-value {
    margin-bottom: 4px;
    color: #111827;
    font-size: 26px;
    font-weight: 800;
  }

  .stat-label {
    color: #6b7280;
    font-size: 13px;
  }
}

.animate-fade-in-down {
  animation: login-brand-fade-in-down 0.4s ease-out forwards;
}

.animate-fade-in-up {
  opacity: 0;
  animation: login-brand-fade-in-up 0.4s ease-out 0.1s forwards;
}

.animate-slide-in {
  opacity: 0;
  animation: login-brand-slide-in 0.3s ease-out forwards;
}

.animate-fade-in {
  opacity: 0;
  animation: login-brand-fade-in 0.5s ease-out 0.4s forwards;
}

@keyframes login-brand-fade-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes login-brand-fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes login-brand-slide-in {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes login-brand-fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
