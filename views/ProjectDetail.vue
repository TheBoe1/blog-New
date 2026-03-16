<template>
  <div class="project-detail">
    <div class="content-wrapper">
      <nav class="detail-nav">
        <button @click="$router.back()" class="back-btn">
          <span class="arrow">←</span> 返回归档
        </button>
      </nav>

      <div v-if="project" class="section-card detail-container">
        <header class="detail-header">
          <div class="header-main">
            <h2 class="project-title">{{ project.name }}</h2>
            <p class="project-desc">{{ project.desc }}</p>
          </div>
          <div class="project-icon-large">🚀</div>
        </header>

        <main class="detail-body">
          <div class="detail-grid">
            <!-- Features Section -->
            <section class="detail-section">
              <h3 class="section-title">核心功能特点</h3>
              <div class="features-box">
                <div v-for="(feat, i) in project.features" :key="i" class="feature-tag-item">
                  <span class="check-icon">✦</span>
                  {{ feat }}
                </div>
              </div>
            </section>

            <!-- Tech Stack Section -->
            <section class="detail-section">
              <h3 class="section-title">技术实现方案</h3>
              <div class="tech-grid">
                <div v-for="(tech, i) in project.techStack" :key="i" class="tech-card">
                  {{ tech }}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer class="detail-footer">
          <div class="footer-divider"></div>
          <div class="footer-actions">
            <a href="https://lianlab.top/index" class="action-link primary" target="_blank" rel="noopener noreferrer">在线预览演示</a>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getProjectList } from '../main/mockData.js';

const route = useRoute();
const project = ref(null);

onMounted(() => {
  const projects = getProjectList();
  project.value = projects.find(item => item.id === parseInt(route.params.id));
});
</script>

<style scoped>
.project-detail {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 1000px;
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
  border-bottom: 1px solid #f1f1f1;
  padding-bottom: 32px;
}

.project-title {
  color: #333;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 12px;
}

.project-desc {
  color: #999;
  font-size: 1rem;
  line-height: 1.6;
  max-width: 600px;
}

.project-icon-large {
  font-size: 3rem;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.section-title {
  color: #333;
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 20px;
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

/* Features */
.features-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-tag-item {
  background: #f0f7ff;
  color: #1890ff;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid #bae7ff;
  display: flex;
  align-items: center;
  gap: 10px;
}

.check-icon {
  color: #1890ff;
  font-weight: bold;
}

/* Tech Stack */
.tech-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.tech-card {
  background: #f6ffed;
  color: #52c41a;
  padding: 12px 20px;
  border-radius: 8px;
  border: 1px solid #b7eb8f;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Footer Actions */
.footer-divider {
  height: 1px;
  background: #f1f1f1;
  margin: 40px 0 24px;
}

.footer-actions {
  display: flex;
  gap: 16px;
}

.action-link {
  text-decoration: none;
  padding: 10px 24px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: #fff;
  color: #666;
  border: 1px solid #eee;
}

.action-link.primary {
  background: #1890ff;
  color: #fff;
  border: none;
}

.action-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
