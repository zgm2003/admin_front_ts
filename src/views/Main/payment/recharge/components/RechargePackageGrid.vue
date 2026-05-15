<script setup lang="ts">
import type { RechargePackageItem } from '@/api/payment/recharges'

const props = defineProps<{
  packages: RechargePackageItem[]
  selectedCode: string
}>()

const emit = defineEmits<{
  select: [code: string]
}>()
</script>

<template>
  <section class="recharge-package-grid">
    <div class="recharge-package-grid__head">
      <div>
        <div class="recharge-package-grid__eyebrow">充值套餐</div>
        <h3 class="recharge-package-grid__title">选择充值金额</h3>
      </div>
      <el-tag type="info" effect="plain">余额充值</el-tag>
    </div>

    <el-empty v-if="props.packages.length === 0" description="暂无可用充值套餐" :image-size="96" />
    <div v-else class="recharge-package-grid__cards">
      <button
        v-for="item in props.packages"
        :key="item.code"
        class="recharge-package-grid__card"
        :class="{ 'is-active': item.code === props.selectedCode }"
        type="button"
        @click="emit('select', item.code)"
      >
        <span v-if="item.badge" class="recharge-package-grid__badge">{{ item.badge }}</span>
        <span class="recharge-package-grid__name">{{ item.name }}</span>
        <span class="recharge-package-grid__amount">{{ item.amount_text }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.recharge-package-grid {
  padding: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
}

.recharge-package-grid__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.recharge-package-grid__eyebrow {
  margin-bottom: 4px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.recharge-package-grid__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 650;
}

.recharge-package-grid__cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.recharge-package-grid__card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 96px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(180deg, var(--el-fill-color-blank), var(--el-fill-color-extra-light));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
}

.recharge-package-grid__card:hover,
.recharge-package-grid__card.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 10px 24px rgb(64 158 255 / 12%);
  transform: translateY(-1px);
}

.recharge-package-grid__card.is-active::after {
  position: absolute;
  right: 14px;
  bottom: 12px;
  width: 8px;
  height: 8px;
  content: '';
  background: var(--el-color-primary);
  border-radius: 999px;
}

.recharge-package-grid__badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 7px;
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 18px;
  background: var(--el-color-primary-light-9);
  border-radius: 999px;
}

.recharge-package-grid__name {
  color: var(--el-text-color-primary);
  font-size: 20px;
  font-weight: 700;
}

.recharge-package-grid__amount {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

@media (max-width: 1080px) {
  .recharge-package-grid__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .recharge-package-grid__cards {
    grid-template-columns: 1fr;
  }
}
</style>
