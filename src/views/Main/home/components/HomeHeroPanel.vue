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
}>()

defineEmits<{
  personal: []
}>()
</script>

<template>
  <section class="hero-panel">
    <span
      class="hero-glow hero-glow--top"
      aria-hidden="true"
    />
    <span
      class="hero-glow hero-glow--bottom"
      aria-hidden="true"
    />

    <div class="hero-main">
      <div class="hero-profile">
        <el-avatar
          :src="avatar"
          :size="64"
          class="hero-avatar"
        />

        <div class="hero-copy">
          <div class="hero-kicker">
            {{ $t('common.welcomeBack') }}
          </div>
          <h1 class="hero-title">
            {{ displayName }}
          </h1>
          <p class="hero-subtitle">
            {{ roleName }}
          </p>
          <p class="hero-description">
            {{ $t('common.welcomeSubtitle') }}
          </p>
        </div>
      </div>

      <div class="hero-actions">
        <el-button
          type="primary"
          plain
          round
          @click="$emit('personal')"
        >
          {{ $t('menu.personal') }}
        </el-button>
      </div>
    </div>

    <div
      class="hero-focus"
      aria-hidden="true"
    >
      <span class="hero-focus__dot" />
      <span class="hero-focus__line" />
      <span class="hero-focus__label">ZhiLan Workspace</span>
    </div>

    <div class="profile-details">
      <div
        v-for="item in profileItems"
        :key="item.key"
        class="profile-detail-card"
      >
        <div class="profile-detail-card__label">
          {{ item.label }}
        </div>
        <div
          class="profile-detail-card__value"
          :title="item.value"
        >
          {{ item.value }}
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.hero-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 16px;
  overflow: hidden;
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, var(--shell-line));
  border-radius: 24px;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.88) 0%, rgba(246, 250, 255, 0.9) 54%, rgba(232, 242, 255, 0.88) 100%);
  box-shadow:
    0 22px 48px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
  color: var(--shell-text-strong);
  isolation: isolate;
}

.hero-glow {
  position: absolute;
  pointer-events: none;
  border-radius: 999px;
  z-index: 0;
}

.hero-glow--top {
  top: -112px;
  right: -58px;
  width: 260px;
  height: 260px;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--el-color-primary) 26%, transparent) 0%, transparent 68%);
}

.hero-glow--bottom {
  left: 38%;
  bottom: -118px;
  width: 300px;
  height: 300px;
  background:
    radial-gradient(circle, rgba(14, 165, 233, 0.14) 0%, transparent 72%);
}

.hero-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.hero-profile {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  min-width: 0;
}

.hero-avatar {
  flex-shrink: 0;
  border: 3px solid rgba(255, 255, 255, 0.9);
  box-shadow:
    0 16px 32px rgba(15, 23, 42, 0.12),
    0 0 0 8px rgba(255, 255, 255, 0.42);
}

.hero-copy {
  min-width: 0;
}

.hero-kicker {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--el-color-primary);
}

.hero-title {
  margin: 0 0 6px;
  font-size: clamp(28px, 2vw, 36px);
  line-height: 1.05;
  font-weight: 900;
  letter-spacing: -0.03em;
  color: var(--shell-text-strong);
}

.hero-subtitle {
  display: inline-flex;
  margin: 0;
  padding: 4px 10px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  font-size: 14px;
  font-weight: 700;
  color: color-mix(in srgb, var(--el-color-primary) 78%, #0f172a);
}

.hero-description {
  max-width: 520px;
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--shell-text-soft);
}

.hero-actions {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;

  .el-button + .el-button {
    margin-left: 0;
  }
}

.hero-focus {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 14px;
  min-height: 92px;
  padding: 16px 18px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 20px;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.04), rgba(59, 130, 246, 0.08), rgba(255, 255, 255, 0.28)),
    repeating-linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0 1px, transparent 1px 16px);
}

.hero-focus::after {
  content: '';
  position: absolute;
  right: 18px;
  top: 50%;
  width: min(42%, 220px);
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--el-color-primary) 46%, transparent));
}

.hero-focus__dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--el-color-primary);
  box-shadow:
    0 0 0 8px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
    0 0 22px color-mix(in srgb, var(--el-color-primary) 48%, transparent);
}

.hero-focus__line {
  width: 42px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--el-color-primary), transparent);
}

.hero-focus__label {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--el-color-primary) 64%, #0f172a);
}

.profile-details {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profile-detail-card {
  position: relative;
  min-height: 72px;
  overflow: hidden;
  padding: 13px 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
}

.profile-detail-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  background: linear-gradient(180deg, var(--el-color-primary), transparent);
  opacity: 0.7;
}

.profile-detail-card__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--shell-text-soft);
}

.profile-detail-card__value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 800;
  color: var(--shell-text-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

  .hero-focus {
    min-height: 72px;
  }

  .hero-actions {
    display: flex;
  }

  .profile-details {
    grid-template-columns: 1fr;
  }
}
</style>
