<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { RechargePackageItem } from '@/api/payment/recharges'

const props = defineProps<{
  packages: RechargePackageItem[]
  selectedCode: string
}>()

const emit = defineEmits<{
  select: [code: string]
}>()

const { t } = useI18n()
</script>

<template>
  <section class="recharge-package-grid">
    <div class="recharge-package-grid__head">
      <div>
        <div class="recharge-package-grid__eyebrow">
          {{ t('paymentRecharge.packages.eyebrow') }}
        </div>
        <h3 class="recharge-package-grid__title">
          {{ t('paymentRecharge.packages.title') }}
        </h3>
      </div>
      <div class="recharge-package-grid__hint">
        {{ t('paymentRecharge.packages.hint') }}
      </div>
    </div>

    <el-empty
      v-if="props.packages.length === 0"
      :description="t('paymentRecharge.packages.empty')"
      :image-size="96"
    />
    <div
      v-else
      class="recharge-package-grid__cards"
    >
      <button
        v-for="item in props.packages"
        :key="item.code"
        class="recharge-package-grid__card"
        :class="{ 'is-active': item.code === props.selectedCode }"
        type="button"
        @click="emit('select', item.code)"
      >
        <span
          v-if="item.badge"
          class="recharge-package-grid__badge"
        >{{ item.badge }}</span>
        <span class="recharge-package-grid__amount">{{ item.name }}</span>
        <span class="recharge-package-grid__name">{{ t('paymentRecharge.packages.payableAmount', { amount: item.amount_text }) }}</span>
        <span
          v-if="item.code === props.selectedCode"
          class="recharge-package-grid__selected"
        >{{ t('paymentRecharge.packages.selected') }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.recharge-package-grid {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
}

.recharge-package-grid__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
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
  font-size: 19px;
  font-weight: 650;
}

.recharge-package-grid__hint {
  flex: 0 0 auto;
  padding: 6px 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
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
  min-height: 104px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 15px;
  box-shadow: 0 8px 18px rgb(31 45 61 / 3%);
  transition:
    color .18s ease,
    background .18s ease,
    border-color .18s ease,
    box-shadow .18s ease,
    transform .18s ease;
}

.recharge-package-grid__card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 10px 24px rgb(64 158 255 / 12%);
  transform: translateY(-1px);
}

.recharge-package-grid__card.is-active {
  color: var(--el-color-primary);
  background: linear-gradient(180deg, rgb(64 158 255 / 10%), rgb(64 158 255 / 4%));
  border-color: var(--el-color-primary);
  box-shadow: 0 12px 26px rgb(64 158 255 / 14%);
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

.recharge-package-grid__card.is-active .recharge-package-grid__badge {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
}

.recharge-package-grid__name {
  margin-top: 8px;
  color: currentcolor;
  font-size: 13px;
  font-weight: 600;
  opacity: .76;
}

.recharge-package-grid__amount {
  margin-top: auto;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.05;
}

.recharge-package-grid__card.is-active .recharge-package-grid__amount {
  color: var(--el-color-primary);
}

.recharge-package-grid__selected {
  position: absolute;
  right: 10px;
  bottom: 10px;
  padding: 2px 8px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 650;
  line-height: 18px;
  background: var(--el-bg-color);
  border: 1px solid rgb(64 158 255 / 18%);
  border-radius: 999px;
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
