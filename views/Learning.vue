<template>
  <div class="page-learning">
    <div class="content-wrapper">
      <div class="learning-header">
        <h2 class="page-title">{{ pageTitle }}</h2>
        <div v-if="isSearching" class="search-hint">
          搜索：{{ searchQuery }}
          <span class="clear-search" @click="router.push({ path: '/learning' })">清除</span>
        </div>
      </div>

      <div v-if="!isSearching" class="node-grid">
        <div 
          v-for="node in rootNodes" 
          :key="node.path" 
          :class="['node-card', { active: isActiveNode(node.path) }]"
          @click="navigateToNode(node.path)"
        >
          {{ node.name }}
        </div>
      </div>

      <div v-if="!isSearching && hasBigCategory" class="node-grid sub-grid">
        <div 
          v-for="node in currentNodes" 
          :key="node.path" 
          :class="['node-card', { active: isActiveNode(node.path) }]"
          @click="navigateToNode(node.path)"
        >
          {{ node.name }}
        </div>
      </div>

      <div v-if="!isSearching && hasTechCategory" class="node-grid sub-grid tech-grid">
        <div 
          v-for="node in currentTechNodes" 
          :key="node.path" 
          :class="['node-card', { active: isActiveNode(node.path) }]"
          @click="navigateToNode(node.path)"
        >
          {{ node.name }}
        </div>
      </div>

      <div v-if="!hasArticleDetail" class="logs-list">
        <div class="log-item" v-for="log in pageData.items" :key="log.id" @click="openArticle(log)">
          <div class="log-content">
            <h3 class="log-topic">{{ log.topic }}</h3>
            <div class="log-summary">
              <span class="path-link" @click.stop="router.push(`${rootPath}/${log.bigKey}`)">{{ log.bigName }}</span>
              <span class="sep">/</span>
              <span class="path-link" @click.stop="router.push(`${rootPath}/${log.bigKey}/${log.techKey}`)">{{ log.techName }}</span>
              <span class="sep">/</span>
              <span class="path-link" @click.stop="router.push(`${rootPath}/${log.bigKey}/${log.techKey}/${log.themeKey}`)">{{ log.themeName }}</span>
            </div>
            <div class="log-meta">
              <span class="log-date">{{ log.date }}</span>
              <span class="read-count">👁️ {{ getViewCount(log.id) }} 阅读</span>
            </div>
          </div>
          <div class="log-image" v-if="log.image">
            <img :src="log.image" alt="topic cover" />
          </div>
        </div>
        <div v-if="pageData.items.length === 0" class="empty-state">
          暂无文章
        </div>
      </div>
      <div v-else class="article-detail-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getLearningLogs, getLearningChildren, getLearningRootPath, getLearningArticlesByNodePath, searchLearningArticles } from '../main/mockData.js';

const route = useRoute();
const router = useRouter();

const allLogs = ref(getLearningLogs());
const rootPath = getLearningRootPath();

// 真正持久化的阅读量记录逻辑
const STORAGE_KEY = 'blog_view_counts_data_v2';

// 初始数据加载
const initialCounts = (() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return {};
    }
  }
  return {};
})();

// 使用 ref 包裹，并立即保存初始状态
const viewCounts = ref(initialCounts);

const getViewCount = (id) => {
  // 如果当前 ID 还没有记录，则生成一个固定的初始随机数
  if (viewCounts.value[id] === undefined) {
    viewCounts.value[id] = Math.floor(Math.random() * 500) + 200;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(viewCounts.value));
  }
  const count = viewCounts.value[id];
  return count > 1000 ? (count / 1000).toFixed(1) + 'k' : count;
};

let timer;
onMounted(() => {
  timer = setInterval(() => {
    let hasChanged = false;
    allLogs.value.forEach(log => {
      if (Math.random() > 0.8) {
        if (viewCounts.value[log.id] === undefined) {
          viewCounts.value[log.id] = Math.floor(Math.random() * 500) + 200;
        }
        viewCounts.value[log.id] += 1;
        hasChanged = true;
      }
    });
    if (hasChanged) {
      // 强制更新并保存，确保响应式和持久化同步
      viewCounts.value = { ...viewCounts.value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(viewCounts.value));
    }
  }, 10000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const currentNodePath = computed(() => {
  const big = route.params.big;
  const tech = route.params.tech;
  const theme = route.params.theme;
  if (big && tech && theme) return `${rootPath}/${big}/${tech}/${theme}`;
  if (big && tech) return `${rootPath}/${big}/${tech}`;
  if (big) return `${rootPath}/${big}`;
  return rootPath;
});

const currentNodes = computed(() => {
  const big = route.params.big;
  if (!big) return [];
  return getLearningChildren(`${rootPath}/${big}`);
});
const rootNodes = computed(() => getLearningChildren(rootPath));

const currentTechNodes = computed(() => {
  const big = route.params.big;
  if (!big) return [];
  const tech = route.params.tech;
  if (!tech) return [];
  return getLearningChildren(`${rootPath}/${big}/${tech}`);
});

const searchQuery = computed(() => String(route.query.q ?? '').trim());
const isSearching = computed(() => searchQuery.value.length > 0);
const isRoot = computed(() => !route.params.big && !route.params.tech && !route.params.theme && !isSearching.value);
const hasBigCategory = computed(() => !!route.params.big);
const hasTechCategory = computed(() => !!route.params.big && !!route.params.tech);

const isActiveNode = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

const navigateToNode = (path) => {
  router.push(path);
};

const hasArticleDetail = computed(() => {
  const pathSegments = route.path.split('/').filter(Boolean);
  
  if (route.params.id) {
    return true;
  }
  
  if (route.params.slug && route.params.big && route.params.tech && route.params.theme) {
    return true;
  }
  
  return false;
});

const currentBigName = computed(() => {
  const big = route.params.big;
  if (!big) return '';
  const found = getLearningChildren(rootPath).find(x => x.key === big);
  return found?.name ?? String(big);
});

const currentTechName = computed(() => {
  const big = route.params.big;
  const tech = route.params.tech;
  if (!big || !tech) return '';
  const found = getLearningChildren(`${rootPath}/${big}`).find(x => x.key === tech);
  return found?.name ?? String(tech);
});

const currentThemeName = computed(() => {
  const big = route.params.big;
  const tech = route.params.tech;
  const theme = route.params.theme;
  if (!big || !tech || !theme) return '';
  const found = getLearningChildren(`${rootPath}/${big}/${tech}`).find(x => x.key === theme);
  return found?.name ?? String(theme);
});

const pageTitle = computed(() => {
  if (isSearching.value) {
    return `搜索：${searchQuery.value}`;
  }
  if (route.params.theme) {
    return currentThemeName.value;
  }
  if (route.params.tech) {
    return currentTechName.value;
  }
  if (route.params.big) {
    return currentBigName.value;
  }
  return '文章分类';
});

const page = ref(1);
const pageSize = ref(10);

watch(currentNodePath, () => {
  page.value = 1;
});

watch(searchQuery, () => {
  page.value = 1;
});

watch(pageTitle, (newTitle) => {
  document.title = newTitle;
}, { immediate: true });

onUnmounted(() => {
  document.title = '文章分类';
});

const searchResults = computed(() => searchLearningArticles(searchQuery.value, 50));

const pageData = computed(() => {
  if (isSearching.value) {
    const list = searchResults.value;
    const p = Math.max(1, Number(page.value) || 1);
    const size = Math.max(1, Number(pageSize.value) || 10);
    const start = (p - 1) * size;
    const end = start + size;
    return {
      items: list.slice(start, end),
      total: list.length,
      page: p,
      pageSize: size,
      totalPages: Math.ceil(list.length / size)
    };
  }
  return getLearningArticlesByNodePath(currentNodePath.value, page.value, pageSize.value);
});

const openArticle = (log) => {
  router.push(log.detailRoute || log.route);
};
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
  font-size: 0.95rem;
}

.page-learning {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 800px; /* 文章列表通常窄一点，方便阅读 */
  margin: 0 auto;
}

.learning-header {
  padding: 20px 0;
  border-bottom: 1px solid #f1f1f1;
  margin-bottom: 20px;
}

.page-title {
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 15px;
}

.breadcrumb {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #71777c;
  font-size: 0.95rem;
}

.search-hint {
  margin-bottom: 10px;
  color: #71777c;
  font-size: 0.9rem;
}

.clear-search {
  margin-left: 10px;
  color: #00c3ff;
  cursor: pointer;
}

.clear-search:hover {
  text-decoration: underline;
}

.crumb {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
}

.crumb:hover {
  background: rgba(0, 195, 255, 0.1);
  color: #00c3ff;
}

.crumb.active {
  cursor: default;
  background: rgba(0, 195, 255, 0.1);
  color: #00c3ff;
  font-weight: 600;
}

.sep {
  color: #c0c4cc;
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0;
  border-top: 1px solid #f1f1f1;
  border-left: 1px solid #f1f1f1;
}

.sub-grid {
  margin-top: 16px;
}

.tech-grid {
  margin-top: 16px;
}

.node-card {
  background: transparent;
  border-right: 1px solid #f1f1f1;
  border-bottom: 1px solid #f1f1f1;
  border-radius: 0;
  padding: 10px 8px;
  cursor: pointer;
  transition: color 0.15s;
  text-align: center;
  position: relative;
  font-size: 0.9rem;
}

.node-card:hover {
  color: #00c3ff;
}

.node-card.active {
  color: #00c3ff;
  font-weight: 600;
}

.node-card.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: #00c3ff;
}

.node-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}

.node-sub {
  font-size: 0.85rem;
  color: #909090;
}

.filter-item {
  font-size: 0.95rem;
  color: #71777c;
  cursor: pointer;
  transition: color 0.2s;
  padding: 4px 8px;
  border-radius: 4px;
}

.filter-item.active {
  color: #00c3ff;
  background: rgba(0, 195, 255, 0.1);
  font-weight: 600;
}

.filter-item:hover {
  color: #00c3ff;
}

.logs-list {
  display: flex;
  flex-direction: column;
}

.log-item {
  background: #fff;
  padding: 20px;
  border-top: 1px solid #f1f1f1;
  border-bottom: 1px solid #f1f1f1;
  display: flex;
  gap: 20px;
  cursor: pointer;
  transition: background 0.2s;
}

.log-item:hover {
  background: #fafafa;
}

.log-content {
  flex: 1;
}

.log-topic {
  color: #333;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0 0 10px;
}

.log-summary {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #71777c;
  font-size: 0.9rem;
}

.path-link {
  color: #00c3ff;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.path-link:hover {
  background: rgba(0, 195, 255, 0.1);
}

.log-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 0.85rem;
  color: #909090;
}

.category-tag {
  color: #00c3ff;
  font-weight: 600;
}

.log-image {
  width: 120px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  background: #eee;
}

.log-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-detail-container {
  padding: 20px 0;
}
</style>
