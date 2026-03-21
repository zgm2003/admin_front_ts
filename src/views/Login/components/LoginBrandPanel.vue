<template>
  <div class="brand-section">
    <div class="brand-content">
      <div class="brand-header animate-fade-in-down">
        <div class="logo-box">
          <div class="logo-icon">
            <img src="/logo.png" alt="Logo" />
          </div>
        </div>
        <div class="brand-info">
          <h2 class="brand-name">智澜系统</h2>
          <span class="brand-tag">ZhiLan Admin System</span>
        </div>
      </div>

      <div class="main-text animate-fade-in-up">
        <h1 class="main-title">
          科技引领<br />
          <span class="highlight">赋能企业管理</span>
        </h1>
        <p class="sub-title">
          集先进技术与智能分析于一体，提供高效、安全、可扩展的企业级解决方案。
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
import { CircleCheckFilled, Service, StarFilled } from '@element-plus/icons-vue'

const features = [
  { icon: CircleCheckFilled, title: '安全可靠', desc: '企业级数据加密，符合国际安全标准' },
  { icon: Service, title: '高效稳定', desc: '7×24小时稳定运行，确保业务连续性' },
  { icon: StarFilled, title: '智能分析', desc: '基于大数据分析，提供智能化决策支持' },
]

const stats = [
  { value: '50万+', label: '信赖用户' },
  { value: '98.5%', label: '满意评价' },
  { value: '2,000+', label: '企业客户' },
]
</script>
