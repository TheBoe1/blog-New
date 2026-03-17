<template>
  <div class="page-questions">
    <div class="content-wrapper">
      <h2 class="page-title">常见问题 (FAQ)</h2>
      <div class="questions-list">
        <div class="q-card glass-panel" v-for="q in questions" :key="q.id">
          <div class="q-header">
            <span class="q-icon">Q</span>
            <h3 class="q-title">{{ q.title }}</h3>
          </div>
          <div class="a-body">
            <span class="a-icon">A</span>
            <p class="a-text">{{ q.answer }}</p>
          </div>
          <div class="q-footer">
            <span class="q-date">{{ q.date }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { getQuestions } from '../main/mockData.js';

const questions = ref(getQuestions());

onMounted(() => {
  document.title = '常见问题';
});

onUnmounted(() => {
  document.title = '文章分类';
});
</script>

<style scoped>
.page-questions {
  padding: 32px;
  min-height: 100%;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.page-title {
  color: #333;
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 32px;
  text-align: center;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #f1f1f1;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.glass-panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 195, 255, 0.35);
}

.q-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f3f4f6;
}

.q-icon {
  background: rgba(24, 144, 255, 0.12);
  color: #1890ff;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.q-title {
  color: #111827;
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
}

.a-body {
  display: flex;
  gap: 16px;
  background: #f8fafc;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid #eef2f7;
  border-left: 4px solid rgba(16, 185, 129, 0.6);
}

.a-icon {
  color: #10b981;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.12);
}

.a-text {
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
}

.q-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.q-date {
  font-size: 0.8rem;
  color: #9ca3af;
}
</style>
