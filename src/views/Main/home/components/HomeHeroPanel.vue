<script setup lang="ts">
defineProps<{
  displayName: string
  roleName: string
  avatar: string
  profileItems: Array<{
    key: string
    label: string
    value: string
  }>
  profileBio: string
}>()

defineEmits<{
  personal: []
}>()
</script>

<template>
  <section class="hero-panel">
    <div class="hero-main">
      <div class="hero-profile">
        <el-avatar :src="avatar" :size="64" class="hero-avatar" />

        <div class="hero-copy">
          <h1 class="hero-title">{{ displayName }}</h1>
          <p class="hero-subtitle">{{ roleName }}</p>
        </div>
      </div>

      <div class="hero-actions">
        <el-button text type="primary" @click="$emit('personal')">{{ $t('menu.personal') }}</el-button>
      </div>
    </div>

    <div class="profile-details">
      <div
        v-for="item in profileItems"
        :key="item.key"
        class="profile-detail-card"
      >
        <div class="profile-detail-card__label">{{ item.label }}</div>
        <div class="profile-detail-card__value" :title="item.value">{{ item.value }}</div>
      </div>
    </div>

    <div v-if="profileBio" class="profile-bio">
      <div class="profile-bio__label">{{ $t('personal.form.bio') }}</div>
      <div class="profile-bio__text" :title="profileBio">{{ profileBio }}</div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  min-height: 0;
  gap: 14px;
  padding: 20px 22px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-primary);
}

.hero-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hero-profile {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.hero-avatar {
  flex-shrink: 0;
  border: 2px solid var(--el-bg-color);
}

.hero-copy {
  min-width: 0;
}

.hero-title {
  margin: 0 0 4px;
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
}

.hero-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.hero-actions {
  display: flex;
  gap: 10px;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.profile-detail-card {
  min-height: 64px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
}

.profile-detail-card__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-detail-card__value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-bio {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: var(--el-bg-color);
}

.profile-bio__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.profile-bio__text {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .hero-panel {
    justify-content: flex-start;
    height: auto;
    padding: 18px 16px;
    gap: 14px;
  }

  .hero-main {
    flex-direction: column;
    align-items: stretch;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-actions {
    display: flex;
  }

  .profile-details {
    grid-template-columns: 1fr;
  }
}
</style>
