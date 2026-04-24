<template>
  <div class="not-found">
    <div class="content">
      <h1 class="code">404</h1>
      <p class="message">页面未找到</p>
      <p class="description">抱歉，您访问的页面不存在或已被移除</p>
      <el-button type="primary" @click="router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style scoped lang="scss">
.not-found {
  min-height: calc(100vh - var(--header-height) - 200px);
  display: flex;
  align-items: center;
  justify-content: center;

  .content {
    text-align: center;
    padding: var(--space-8);
  }

  .code {
    font-size: 80px;
    font-weight: 700;
    color: var(--text-primary);
    line-height: 1;
    margin-bottom: var(--space-4);
    font-variant-numeric: tabular-nums;
  }

  .message {
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .description {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-8);
  }
}
</style>
