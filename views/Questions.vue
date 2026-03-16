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
import { ref } from 'vue';
import { getQuestions } from '../main/mockData.js';

const questions = ref(getQuestions());
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
  color: #f8fafc;
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
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.q-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.q-icon {
  background: #6366f1;
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.q-title {
  color: #f1f5f9;
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.4;
}

.a-body {
  display: flex;
  gap: 16px;
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.a-icon {
  color: #10b981;
  font-weight: 800;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.a-text {
  color: #cbd5e1;
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
  color: #64748b;
}
</style>
