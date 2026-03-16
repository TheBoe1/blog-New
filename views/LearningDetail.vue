<template>
  <div class="learning-detail">
    <div class="content-wrapper">
      <nav class="detail-nav">
        <button @click="$router.back()" class="back-btn">
          <span class="arrow">←</span> 返回列表
        </button>
      </nav>

      <div v-if="detail" class="section-card detail-container">
        <header class="detail-header">
          <div class="header-meta">
            <span class="category-pill">{{ detail.category }}</span>
            <span class="date-text">{{ detail.date }}</span>
          </div>
          <h2 class="detail-title">{{ detail.topic }}</h2>
        </header>

        <main class="detail-body">
          <section class="content-section">
            <h3 class="section-title">学习摘要</h3>
            <p class="summary-text">
              这里是关于 <strong>{{ detail.topic }}</strong> 的深度学习笔记。在这一章节中，我们探讨了核心原理、实际应用场景以及在生产环境中的最佳实践。
            </p>
          </section>

          <section class="content-section">
            <h3 class="section-title">核心要点</h3>
            <ul class="points-list">
              <li>深入理解底层数据结构与算法实现</li>
              <li>掌握在分布式系统中的应用与一致性保证</li>
              <li>学习如何进行性能调优与故障排查</li>
            </ul>
          </section>

          <section class="content-section">
            <h3 class="section-title">详细内容</h3>
            <div class="placeholder-content">
        
              <p class="empty-hint">（子路由详情内容正在持续更新中...）</p>
            </div>
          </section>
        </main>

        <footer class="detail-footer">
          <div class="footer-divider"></div>
          <p class="last-updated">最后更新于: {{ detail.date }}</p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getLearningLogs } from '../main/mockData.js';

const route = useRoute();
const detail = ref(null);

onMounted(() => {
  const logs = getLearningLogs();
  detail.value = logs.find(item => item.id === parseInt(route.params.id));
});
</script>

<style scoped>
.learning-detail {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

.detail-nav {
  padding: 20px 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #eee;
  color: #666;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

/* 适配美团/若依背景色的卡片容器 */
.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
}

.detail-header {
  margin-bottom: 40px;
  border-bottom: 1px solid #f1f1f1;
  padding-bottom: 32px;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.category-pill {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid #91d5ff;
}

.date-text {
  color: #999;
  font-size: 0.85rem;
}

.detail-title {
  color: #333;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-title {
  color: #333;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title::before {
  content: "";
  width: 4px;
  height: 18px;
  background: #1890ff;
  border-radius: 2px;
}

.summary-text {
  color: #666;
  line-height: 1.8;
  font-size: 1rem;
}

.points-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.points-list li {
  color: #666;
  padding-left: 24px;
  position: relative;
  font-size: 0.95rem;
}

.points-list li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: #52c41a;
  font-weight: 800;
}

.placeholder-content {
  background: #fafafa;
  padding: 24px;
  border-radius: 8px;
  border: 1px dashed #eee;
}

.empty-hint {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

.footer-divider {
  height: 1px;
  background: #f1f1f1;
  margin: 40px 0 20px;
}

.last-updated {
  color: #999;
  font-size: 0.85rem;
  text-align: right;
}
</style>
