<script setup lang="ts">
import type { PaymentRechargeListItem } from '@/api/payment/recharges'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const props = defineProps<{
  records: PaymentRechargeListItem[]
  canPay: (row: PaymentRechargeListItem) => boolean
  canSync: (row: PaymentRechargeListItem) => boolean
  canClose: (row: PaymentRechargeListItem) => boolean
}>()

const emit = defineEmits<{
  pay: [row: PaymentRechargeListItem]
  sync: [row: PaymentRechargeListItem]
  close: [row: PaymentRechargeListItem]
}>()

function tagType(status: PaymentRechargeListItem['status']) {
  if (status === 'credited' || status === 'paid') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'closed') return 'info'
  return 'warning'
}
</script>

<template>
  <section class="recharge-recent-records">
    <div class="recharge-recent-records__head">
      <h3>最近充值</h3>
      <span>只展示最近 5 条</span>
    </div>

    <el-empty
      v-if="props.records.length === 0"
      description="暂无充值记录"
      :image-size="84"
    />
    <div
      v-else
      class="recharge-recent-records__list"
    >
      <article
        v-for="row in props.records"
        :key="row.id"
        class="recharge-recent-records__item"
      >
        <div class="recharge-recent-records__main">
          <div class="recharge-recent-records__title">
            <b>{{ row.package_name }}</b>
            <el-tag
              :type="tagType(row.status)"
              size="small"
              effect="light"
            >
              {{ row.status_text }}
            </el-tag>
          </div>
          <div class="recharge-recent-records__meta">
            {{ row.recharge_no }} · {{ row.created_at }}
          </div>
        </div>
        <div class="recharge-recent-records__side">
          <strong>{{ row.amount_text }}</strong>
          <div class="recharge-recent-records__actions">
            <el-button
              v-if="userStore.can('payment_recharge_pay') && props.canPay(row)"
              type="primary"
              text
              size="small"
              @click="emit('pay', row)"
            >
              继续支付
            </el-button>
            <el-button
              v-if="userStore.can('payment_recharge_sync') && props.canSync(row)"
              type="warning"
              text
              size="small"
              @click="emit('sync', row)"
            >
              同步
            </el-button>
            <el-button
              v-if="userStore.can('payment_recharge_close') && props.canClose(row)"
              type="danger"
              text
              size="small"
              @click="emit('close', row)"
            >
              关闭
            </el-button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.recharge-recent-records {
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
}

.recharge-recent-records__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.recharge-recent-records__head h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 650;
}

.recharge-recent-records__head span,
.recharge-recent-records__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.recharge-recent-records__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.recharge-recent-records__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 12px 14px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid transparent;
  border-radius: 12px;
}

.recharge-recent-records__main {
  min-width: 0;
}

.recharge-recent-records__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.recharge-recent-records__side {
  display: grid;
  justify-items: end;
  gap: 6px;
  white-space: nowrap;
}

.recharge-recent-records__side strong {
  color: var(--el-text-color-primary);
}

.recharge-recent-records__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

@media (max-width: 1080px) {
  .recharge-recent-records__list {
    grid-template-columns: 1fr;
  }
}
</style>
