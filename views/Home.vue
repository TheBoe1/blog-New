<template>
  <div class="page-home">
    <div class="home-content">
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-card">
          <div class="hero-top">
            <div class="avatar">L</div>
            <div class="hero-text">
              <h2 class="title">怜言语记</h2>
              <p class="subtitle">技术成长与沉淀的个人知识库</p>
            </div>
          </div>
          <div class="stats-row">
            <div class="stat">
              <div class="stat-val">{{ totalArticles }}</div>
              <div class="stat-key">文章</div>
            </div>
            <div class="stat">
              <div class="stat-val">{{ bigCategories.length }}</div>
              <div class="stat-key">大类</div>
            </div>
            <div class="stat">
              <div class="stat-val">{{ totalTechStacks }}</div>
              <div class="stat-key">技术栈</div>
            </div>
          </div>
          <div class="quick-actions">
            <router-link class="action primary" to="/learning">文章列表</router-link>
            <router-link class="action" to="/projects">专题看板</router-link>
            <router-link class="action" to="/deploy">系统部署</router-link>
            <router-link class="action" to="/questions">常见问题</router-link>
            <router-link class="action" to="/about">关于系统</router-link>
          </div>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <h3 class="section-title">文章分类</h3>
          <router-link class="section-link" to="/learning">查看全部</router-link>
        </div>
        <div class="category-grid">
          <div v-for="c in bigCategories" :key="c.key" class="cat-card" @click="$router.push(`/learning/${c.key}`)">
            <div class="cat-name">{{ c.name }}</div>
            <div class="cat-meta">{{ c.count }} 篇</div>
          </div>
        </div>
      </section>

      <section class="section-card">
        <div class="section-head">
          <h3 class="section-title">最新文章</h3>
          <router-link class="section-link" to="/learning">进入列表</router-link>
        </div>
        <div class="latest-list">
          <div v-for="a in latestArticles" :key="a.id" class="latest-item" @click="$router.push(a.route)">
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
import { computed } from 'vue';
import { getLearningChildren, getLearningArticlesByNodePath } from '../main/mockData.js';

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

const latestArticles = computed(() => getLearningArticlesByNodePath(rootPath, 1, 6).items);
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

.hero {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(900px 240px at 20% 0%, rgba(0, 195, 255, 0.18), transparent 60%),
    radial-gradient(900px 240px at 80% 0%, rgba(114, 46, 209, 0.14), transparent 60%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.85));
  border: 1px solid #f1f1f1;
}

.hero-card {
  position: relative;
  padding: 28px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
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

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0 18px;
}

.stat {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #f1f1f1;
  border-radius: 12px;
  padding: 12px 14px;
}

.stat-val {
  font-size: 1.1rem;
  font-weight: 900;
  color: #111827;
  margin-bottom: 4px;
}

.stat-key {
  font-size: 0.8rem;
  color: #9ca3af;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #f1f1f1;
  background: #fff;
  color: #333;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.action:hover {
  transform: translateY(-1px);
  border-color: rgba(0, 195, 255, 0.5);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.action.primary {
  background: rgba(0, 195, 255, 0.1);
  border-color: rgba(0, 195, 255, 0.35);
  color: #00a7d6;
  font-weight: 700;
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

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 14px;
}

.cat-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f1f1f1;
  background: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}

.cat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 195, 255, 0.35);
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.06);
}

.cat-name {
  font-weight: 800;
  color: #111827;
  margin-bottom: 6px;
}

.cat-meta {
  color: #9ca3af;
  font-size: 0.85rem;
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
  .hero-card {
    padding: 20px;
  }
  .stats-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
