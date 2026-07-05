<template>
  <div class="about-placeholder">
    <h1>关于</h1>
    <p>页面建设中，敬请期待。</p>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.about-placeholder {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-4);
  text-align: center;

  h1 {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: var(--space-4);
  }

  p {
    color: var(--text-tertiary);
  }
}
</style>
