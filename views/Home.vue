<template>
  <div class="page-home">
    <div class="home-content">
      <section class="section-card hero-section">
        <div class="hero-top">
          <div class="avatar">L</div>
          <div class="hero-text">
            <h2 class="title">怜言语记</h2>
            <p class="subtitle">技术成长与沉淀的个人知识库</p>
          </div>
        </div>
        
        <div class="intro-section">
          <p class="intro-text">专注后端开发，熟悉 Spring Boot / Redis / MySQL</p>
          <p class="intro-text">具备基础系统设计能力，实践过自动化部署流程</p>
          <p class="intro-text">关注系统稳定性与工程效率</p>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <h3 class="section-title">技术栈</h3>
        </div>
        
        <div class="tech-stack-section">
          <div class="tech-category">
            <span class="tech-label">核心</span>
            <div class="tech-tags">
              <span class="tech-tag primary">Java</span>
              <span class="tech-tag primary">Spring Boot</span>
              <span class="tech-tag primary">MySQL</span>
              <span class="tech-tag primary">Redis</span>
            </div>
          </div>
          
          <div class="tech-category">
            <span class="tech-label">前端</span>
            <div class="tech-tags">
              <span class="tech-tag">Vue 3</span>
              <span class="tech-tag">Element Plus</span>
            </div>
          </div>
          
          <div class="tech-category">
            <span class="tech-label">工具</span>
            <div class="tech-tags">
              <span class="tech-tag">Git</span>
              <span class="tech-tag">Docker</span>
              <span class="tech-tag">Nginx</span>
              <span class="tech-tag">Linux</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <h3 class="section-title">项目展示</h3>
          <router-link class="section-link" to="/projects">查看全部</router-link>
        </div>
        <div class="projects-preview">
          <div class="project-card" v-for="p in previewProjects" :key="p.id" @click="$router.push(`/projects/${p.id}`)">
            <div class="project-name">{{ p.name }}</div>
            <div class="project-desc">{{ p.desc }}</div>
            <div class="project-tags">
              <span class="tag" v-for="(t, idx) in p.techStack.slice(0, 3)" :key="idx">{{ t.split('：')[1] || t }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <h3 class="section-title">最新文章</h3>
          <router-link class="section-link" to="/learning">进入列表</router-link>
        </div>
        <div class="latest-list">
          <div v-for="a in latestArticles" :key="a.id" class="latest-item" @click="openArticle(a)">
            <div class="latest-main">
              <div class="latest-title">{{ a.topic }}</div>
              <div class="latest-meta">{{ a.bigName }} / {{ a.techName }} / {{ a.themeName }}</div>
            </div>
            <div class="latest-date">{{ a.date }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getLearningChildren, getLearningArticlesByNodePath, getProjectList } from '../main/mockData.js';

const router = useRouter();

onMounted(() => {
  document.title = '怜言语记';
});

onUnmounted(() => {
  document.title = '文章分类';
});

const rootPath = '/learning';
const totalArticles = computed(() => getLearningArticlesByNodePath(rootPath, 1, 1).total);

const bigCategories = computed(() => {
  const nodes = getLearningChildren(rootPath);
  return nodes.map((n) => {
    const count = getLearningArticlesByNodePath(n.path, 1, 1).total;
    return { key: n.key, name: n.name, path: n.path, count };
  });
});

const totalTechStacks = computed(() => {
  let cnt = 0;
  bigCategories.value.forEach((b) => {
    cnt += getLearningChildren(b.path).length;
  });
  return cnt;
});

const latestArticles = computed(() => getLearningArticlesByNodePath(rootPath, 1, 5).items);

const previewProjects = computed(() => getProjectList().slice(0, 3));

const openArticle = (article) => {
  router.push(article.route);
};
</script>

<style scoped>
.page-home {
  min-height: 100%;
}

.home-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
}

.hero-section {
  padding: 28px;
}

.hero-top {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #1890ff;
  background: rgba(24, 144, 255, 0.12);
  border: 1px solid rgba(24, 144, 255, 0.18);
}

.title {
  margin: 0 0 4px 0;
  font-size: 1.7rem;
  font-weight: 900;
  color: #111827;
  letter-spacing: 0.2px;
}

.subtitle {
  margin: 0;
  color: #6b7280;
}

.intro-section {
  margin-bottom: 0;
}

.intro-text {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  color: #374151;
  line-height: 1.6;
}

.intro-text:last-child {
  margin-bottom: 0;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
}

.section-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: #111827;
}

.section-link {
  color: #00a7d6;
  text-decoration: none;
  font-size: 0.9rem;
}

.section-link:hover {
  text-decoration: underline;
}

.tech-stack-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tech-category {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.tech-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #6b7280;
  width: 44px;
  flex-shrink: 0;
  padding-top: 4px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  background: #f3f4f6;
  color: #4b5563;
}

.tech-tag.primary {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  border: 1px solid rgba(24, 144, 255, 0.2);
}

.projects-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  padding: 18px;
  border-radius: 10px;
  border: 1px solid #f1f1f1;
  background: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.project-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 195, 255, 0.35);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.06);
}

.project-name {
  font-weight: 800;
  color: #111827;
  margin-bottom: 8px;
  font-size: 1rem;
}

.project-desc {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 12px;
  line-height: 1.5;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  background: #f3f4f6;
  color: #6b7280;
}

.latest-list {
  display: flex;
  flex-direction: column;
}

.latest-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid #f3f4f6;
  cursor: pointer;
}

.latest-item:first-child {
  border-top: none;
}

.latest-title {
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
}

.latest-meta {
  color: #9ca3af;
  font-size: 0.85rem;
}

.latest-date {
  color: #9ca3af;
  font-size: 0.85rem;
  flex-shrink: 0;
}

@media (max-width: 520px) {
  .projects-preview {
    grid-template-columns: 1fr;
  }
}
</style>
