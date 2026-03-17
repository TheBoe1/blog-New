<template>
  <div class="learning-detail">
    <div class="content-wrapper">
      <nav class="detail-nav">
        <button @click="goBack" class="back-btn">
          <span class="arrow">←</span> 返回列表
        </button>
      </nav>

      <div v-if="detail" class="section-card detail-container">
        <header class="detail-header">
          <div class="header-meta">
            <span class="category-pill">{{ detail.bigName }} / {{ detail.techName }} / {{ detail.themeName }}</span>
            <span class="date-text">发布于 {{ detail.date }}</span>
            <span v-if="Array.isArray(detail.tags) && detail.tags.length" class="tag-row">
              <span class="tag" v-for="t in detail.tags" :key="t">{{ t }}</span>
            </span>
          </div>
          <h2 class="detail-title">{{ detail.topic }}</h2>
        </header>

        <main class="detail-body">
          <section class="content-section">
            <div v-if="detail?.content" class="article-content">{{ detail.content }}</div>
            <div v-else class="placeholder-content">
              <p class="empty-hint">（详情内容正在持续更新中...）</p>
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
import { ref, computed, watchEffect, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getLearningArticleByRoute, getLearningArticleById } from '../main/mockData.js';

const route = useRoute();
const router = useRouter();
const detail = ref(null);

onMounted(() => {
  if (detail.value) {
    document.title = detail.value.topic;
  }
});

watchEffect(() => {
  if (detail.value) {
    document.title = detail.value.topic;
  }
});

onUnmounted(() => {
  document.title = '文章分类';
});

const routePath = computed(() => {
  const id = route.params.id;
  const big = route.params.big;
  const tech = route.params.tech;
  const theme = route.params.theme;
  const slug = route.params.slug;
  
  if (slug && big && tech && theme) {
    return `/learning/${big}/${tech}/${theme}/${slug}`;
  }
  if (id) {
    return null;
  }
  return null;
});

watchEffect(() => {
  if (routePath.value) {
    detail.value = getLearningArticleByRoute(routePath.value);
    return;
  }
  const id = route.params.id;
  if (id) {
    detail.value = getLearningArticleById(id);
    return;
  }
  detail.value = null;
});

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  const target = detail.value?.themeRoute;
  if (target) router.push(target);
  else router.push('/learning');
};
</script>

<style scoped>
.learning-detail {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 960px;
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
  padding: 28px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
}

.detail-header {
  margin-bottom: 18px;
  border-bottom: 1px solid #f1f1f1;
  padding-bottom: 16px;
}

.header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
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

.tag-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.78rem;
  color: #555;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 2px 8px;
  border-radius: 999px;
}

.detail-title {
  color: #111827;
  font-size: 2rem;
  font-weight: 900;
  margin: 0;
  line-height: 1.35;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.placeholder-content {
  background: #fafafa;
  padding: 24px;
  border-radius: 8px;
  border: 1px dashed #eee;
}

.article-content {
  background: transparent;
  padding: 0;
  border-radius: 0;
  border: none;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.95;
  font-size: 1rem;
  color: #111827;
  margin: 0;
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
