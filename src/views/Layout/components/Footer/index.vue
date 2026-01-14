<script setup>
</script>

<template>
  <div class="footer">
    <span class="footer-text">{{ $t('footer.copyright') }}</span>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.footer-text {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
