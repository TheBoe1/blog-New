<template>
  <div class="page-learning">
    <div class="content-wrapper">
      <!-- 只有在列表页才显示头部和分类过滤器 -->
      <template v-if="!$route.params.id">
        <div class="learning-header">
          <h2 class="page-title">最近更新</h2>
          <div class="category-filters">
            <span 
              v-for="cat in categories" 
              :key="cat"
              class="filter-item" 
              :class="{ active: currentCategory === cat }"
              @click="currentCategory = cat"
            >
              {{ categoryDisplayNames[cat] }}
            </span>
          </div>
        </div>
        
        <div class="logs-list">
          <div class="log-item" v-for="log in filteredLogs" :key="log.id" @click="$router.push(`/learning/${log.id}`)">
            <div class="log-content">
              <h3 class="log-topic">{{ log.topic }}</h3>
              <p class="log-summary">这是一段关于 {{ log.topic }} 的技术实践总结，涵盖了核心原理解析以及在生产环境中的应用案例分享...</p>
              <div class="log-meta">
              <span class="category-tag">{{ categoryDisplayNames[log.category] }}</span>
              <span class="log-date">{{ log.date }}</span>
              <span class="read-count">👁️ {{ getViewCount(log.id) }} 阅读</span>
            </div>
            </div>
            <div class="log-image" v-if="log.image">
              <img :src="log.image" alt="topic cover" />
            </div>
          </div>
          <div v-if="filteredLogs.length === 0" class="empty-state">
            暂无该分类下的文章
          </div>
        </div>
      </template>
      
      <!-- 进入子路由（文章详情）时，直接显示内容容器 -->
      <div v-else class="detail-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getLearningLogs } from '../main/mockData.js';

const allLogs = ref(getLearningLogs());
const categories = ['全部', 'Cache', 'Middleware', 'Database', 'Java'];
const categoryDisplayNames = {
  '全部': '全部',
  'Cache': '前端技术',
  'Middleware': '后端架构',
  'Database': '算法研究',
  'Java': '工程实践'
};
const currentCategory = ref('全部');

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

// 模拟阅读量真实增长
import { onMounted, onUnmounted } from 'vue';
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

const filteredLogs = computed(() => {
  if (currentCategory.value === '全部') {
    return allLogs.value;
  }
  return allLogs.value.filter(log => log.category === currentCategory.value);
});
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

.category-filters {
  display: flex;
  gap: 20px;
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
  color: #909090;
  font-size: 0.9rem;
  line-height: 1.6;
  margin-bottom: 15px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
</style>