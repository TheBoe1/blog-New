<template>
  <div class="page-projects">
    <div class="content-wrapper">
      <!-- 只有在专题列表页才显示头部 -->
      <template v-if="!$route.params.id">
        <div class="projects-header">
          <h2 class="page-title">专题看板</h2>
          <p class="page-subtitle">技术专题归档与深度解析</p>
        </div>
        
        <div class="projects-grid">
          <div class="project-card section-card" v-for="project in projects" :key="project.id" @click="$router.push(`/projects/${project.id}`)">
            <div class="project-header">
              <h3 class="project-name">{{ project.name }}</h3>
              <span class="project-status">进行中</span>
            </div>
            <p class="project-desc">{{ project.desc }}</p>
            
            <div class="project-section">
              <h4 class="section-label">核心要点</h4>
              <ul class="feature-list">
                <li v-for="(feat, idx) in project.features.slice(0, 3)" :key="idx">{{ feat }}</li>
              </ul>
            </div>

            <div class="project-section">
              <h4 class="section-label">涉及技术</h4>
              <div class="tech-tags">
                <span class="tech-tag" v-for="(stack, idx) in project.techStack" :key="idx">{{ stack }}</span>
              </div>
            </div>
            
            <div class="project-footer">
              <span class="view-detail">查看专题详情</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 进入专题详情（子路由）时，直接显示内容容器 -->
      <div v-else class="detail-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getProjectList } from '../main/mockData.js';

const projects = ref(getProjectList());
</script>

<style scoped>
.page-projects {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

.projects-header {
  padding: 20px 0;
  border-bottom: 1px solid #f1f1f1;
  margin-bottom: 24px;
}

.page-title {
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

/* 仿美团/若依卡片风格 */
.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.section-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border-color: #1890ff;
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.project-name {
  color: #333;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
}

.project-status {
  font-size: 0.75rem;
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #91d5ff;
}

.project-desc {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 20px;
  height: 45px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.project-section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #999;
  margin-bottom: 10px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  color: #666;
  font-size: 0.85rem;
  padding-left: 15px;
  position: relative;
  margin-bottom: 6px;
}

.feature-list li::before {
  content: "";
  width: 5px;
  height: 5px;
  background: #1890ff;
  border-radius: 50%;
  position: absolute;
  left: 0;
  top: 7px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  background: #f5f5f5;
  color: #666;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.project-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f5f5f5;
  text-align: right;
}

.view-detail {
  font-size: 0.85rem;
  color: #1890ff;
  font-weight: 600;
}
</style>