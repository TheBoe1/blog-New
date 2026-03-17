<template>
  <div class="app-layout">
    <!-- 侧边栏 - 仿若依风格 -->
    <aside class="sidebar">
      <div class="logo-container">
        <div class="logo">LianLab <span class="v-tag">v1.2</span></div>
      </div>
      <div class="menu-list">
        <router-link to="/" class="menu-item">
          <span class="icon">🏠</span>
          <span class="label">首页</span>
        </router-link>
        <router-link to="/learning" class="menu-item">
          <span class="icon">📄</span>
          <span class="label">文章列表</span>
        </router-link>
        <router-link to="/projects" class="menu-item">
          <span class="icon">📂</span>
          <span class="label">专题看板</span>
        </router-link>
        <router-link to="/deploy" class="menu-item">
          <span class="icon">🚀</span>
          <span class="label">系统部署</span>
        </router-link>
        
        <div class="menu-divider">外部项目</div>
        
        <a href="https://lianlab.top/index/" class="menu-item external" target="_blank" rel="noopener noreferrer">
          <span class="icon">⚙️</span>
          <span class="label">管理系统</span>
        </a>
        <a href="https://lianlab.top/Visual/" class="menu-item external" target="_blank" rel="noopener noreferrer">
          <span class="icon">📊</span>
          <span class="label">可视化平台</span>
        </a>

        <router-link to="/about" class="menu-item bottom">
          <span class="icon">ℹ️</span>
          <span class="label">关于系统</span>
        </router-link>
      </div>
    </aside>

    <div class="main-wrapper">
      <!-- 顶部栏 - 仿美团简洁风格 -->
      <header class="top-header">
        <div class="header-left">
          <div class="breadcrumb">怜言语记</div>
        </div>
        <div class="header-right">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="q"
              type="text"
              placeholder="搜索技术文章..."
              @focus="openSuggest"
              @blur="closeSuggest"
              @keydown.enter="goSearch"
              @keydown.esc="hideSuggest"
            />
            <div v-if="showSuggest && suggestions.length" class="suggest-panel">
              <div
                v-for="item in suggestions"
                :key="item.route"
                class="suggest-item"
                @mousedown="goDetail(item)"
              >
                <div class="suggest-title">{{ item.title }}</div>
                <div class="suggest-meta">{{ item.bigName }} / {{ item.techName }} / {{ item.themeName }}</div>
              </div>
              <div class="suggest-footer" @mousedown="goSearch">查看全部结果</div>
            </div>
          </div>
        </div>
      </header>

      <!-- 内容区 - 美团背景色与容器布局 -->
      <main class="content-area">
        <div class="content-container">
          <router-view />
        </div>
      </main>

      <footer class="app-footer">
        <p>© 2026 怜言语记. 助力技术成长与沉淀.</p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { searchLearningArticles } from '../main/mockData.js';

const router = useRouter();
const q = ref('');
const showSuggest = ref(false);
let blurTimer = null;

const suggestions = computed(() => {
  const keyword = q.value.trim();
  if (!keyword) return [];
  return searchLearningArticles(keyword, 8);
});

watch(q, (val) => {
  if (val && val.trim()) {
    showSuggest.value = true;
  } else {
    showSuggest.value = false;
  }
});

const hideSuggest = () => {
  showSuggest.value = false;
};

const openSuggest = () => {
  if (blurTimer) clearTimeout(blurTimer);
  if (q.value.trim() && suggestions.value.length) showSuggest.value = true;
};

const closeSuggest = () => {
  if (blurTimer) clearTimeout(blurTimer);
  blurTimer = setTimeout(() => {
    showSuggest.value = false;
  }, 120);
};

const goDetail = (item) => {
  q.value = '';
  showSuggest.value = false;
  router.push(item.route);
};

const goSearch = () => {
  const keyword = q.value.trim();
  if (!keyword) return;
  showSuggest.value = false;
  router.push({ path: '/learning', query: { q: keyword } });
};
</script>

<style scoped>
/* 整体布局 */
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background-color: #f4f5f5; /* 美团背景色 */
}

/* 侧边栏 - 调整为浅色风格以适配美团/若依整体背景 */
.sidebar {
  width: 220px;
  background-color: #ffffff; /* 改为白色背景 */
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  flex-shrink: 0;
  border-right: 1px solid #f1f1f1; /* 增加右侧分割线 */
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f1f1f1;
}

.logo {
  color: #333; /* 文字改为深色 */
  font-weight: 800;
  font-size: 1.2rem;
}

.v-tag {
  font-size: 0.6rem;
  background: #1890ff;
  color: #fff;
  padding: 2px 4px;
  border-radius: 4px;
}

.menu-list {
  flex: 1;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #666; /* 默认文字颜色 */
  text-decoration: none;
  transition: all 0.2s;
  font-size: 0.95rem;
  margin: 2px 0;
}

.menu-item .icon {
  margin-right: 12px;
  font-size: 1.1rem;
  opacity: 0.7;
}

.menu-item:hover {
  color: #1890ff;
  background-color: #f0f7ff; /* 悬浮淡蓝色 */
}

.menu-item.router-link-active {
  color: #1890ff;
  background-color: #e6f7ff; /* 选中淡蓝色 */
  border-right: 3px solid #1890ff; /* 增加右侧激活条 */
  font-weight: 600;
}

.menu-divider {
  padding: 20px 20px 10px;
  font-size: 0.75rem;
  color: #999; /* 分割线文字颜色 */
  text-transform: uppercase;
  letter-spacing: 1px;
}

.menu-item.bottom {
  margin-top: auto;
  border-top: 1px solid #f1f1f1;
}

.menu-item.external {
  color: #666;
}

.menu-item.external:hover {
  color: #1890ff;
}

/* 右侧主区域 */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部栏 - 仿美团简洁风格 */
.top-header {
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;
}

.breadcrumb {
  color: #333;
  font-weight: 600;
  font-size: 1.1rem;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f4f5f5;
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid #eee;
  position: relative;
}

.search-box input {
  border: none;
  background: transparent;
  outline: none;
  margin-left: 8px;
  width: 200px;
  font-size: 0.9rem;
}

.suggest-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 360px;
  background: #fff;
  border: 1px solid #f1f1f1;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  z-index: 20;
}

.suggest-item {
  padding: 12px 14px;
  cursor: pointer;
  border-bottom: 1px solid #f6f6f6;
}

.suggest-item:hover {
  background: #fafafa;
}

.suggest-title {
  color: #333;
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.3;
  margin-bottom: 6px;
}

.suggest-meta {
  color: #909090;
  font-size: 0.8rem;
}

.suggest-footer {
  padding: 10px 14px;
  text-align: center;
  color: #00c3ff;
  cursor: pointer;
  font-size: 0.9rem;
  background: #fff;
}

.suggest-footer:hover {
  background: rgba(0, 195, 255, 0.06);
}

/* 内容区容器布局 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.content-container {
  max-width: 1000px; /* 仿美团技术团队容器宽度 */
  margin: 0 auto;
  background: transparent;
}

.app-footer {
  padding: 10px 20px; /* 大幅压缩上下内边距 */
  text-align: center;
  color: #ccc;
  font-size: 0.75rem; /* 稍微再小一点 */
  background: transparent;
}

.app-footer p {
  margin: 0;
  opacity: 0.5; /* 更淡一点，降低存在感 */
}
</style>
