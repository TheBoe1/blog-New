<template>
  <a-layout class="app-layout">
    <a-layout-sider
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
      :width="220"
      :collapsedWidth="80"
      class="app-sider"
      breakpoint="lg"
      @collapse="onCollapse"
    >
      <div class="logo-container">
        <div class="logo">
          <span v-if="!collapsed">LianLab</span>
          <span v-else>L</span>
          <a-tag v-if="!collapsed" color="blue" class="v-tag">v1.2</a-tag>
        </div>
        <a-tooltip v-if="!collapsed" :title="collapsed ? '展开专栏' : '收起专栏'">
          <span class="collapse-btn" @click="toggleSidebar">
            <MenuFoldOutlined v-if="!collapsed" />
            <MenuUnfoldOutlined v-else />
          </span>
        </a-tooltip>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        mode="inline"
        :theme="theme"
        class="app-menu"
        :inlineIndent="16"
      >
        <a-menu-item key="/" @click="navigateTo('/')">
          <template #icon><HomeOutlined /></template>
          <span>首页</span>
        </a-menu-item>
        <a-menu-item key="/learning" @click="navigateTo('/learning')">
          <template #icon>
            <a-badge :count="0" :offset="[10, 0]" size="small">
              <FileTextOutlined />
            </a-badge>
          </template>
          <span>文章列表</span>
        </a-menu-item>
        <a-menu-item key="/projects" @click="navigateTo('/projects')">
          <template #icon><AppstoreOutlined /></template>
          <span>专题看板</span>
        </a-menu-item>
        
        <a-menu-divider />
        <a-menu-item-group v-if="!collapsed" title="外部项目">
          <a-menu-item key="carbon" class="external-menu-item" @click="openExternal('https://lianlab.top/carbon/')">
            <template #icon><SettingOutlined /></template>
            <span>管理系统</span>
            <ExportOutlined class="external-icon" />
          </a-menu-item>
          <a-menu-item key="visual" class="external-menu-item" @click="openExternal('https://lianlab.top/Visual/')">
            <template #icon><BarChartOutlined /></template>
            <span>可视化平台</span>
            <ExportOutlined class="external-icon" />
          </a-menu-item>
        </a-menu-item-group>
        
        <a-menu-divider v-if="collapsed" />
        <a-tooltip v-if="collapsed" placement="right" title="管理系统">
          <a-menu-item key="carbon-collapsed" @click="openExternal('https://lianlab.top/carbon/')">
            <template #icon><SettingOutlined /></template>
          </a-menu-item>
        </a-tooltip>
        <a-tooltip v-if="collapsed" placement="right" title="可视化平台">
          <a-menu-item key="visual-collapsed" @click="openExternal('https://lianlab.top/Visual/')">
            <template #icon><BarChartOutlined /></template>
          </a-menu-item>
        </a-tooltip>
        
        <a-menu-item key="/about" class="bottom-menu" @click="navigateTo('/about')">
          <template #icon><InfoCircleOutlined /></template>
          <span>关于系统</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout class="main-layout">
      <a-layout-header class="app-header">
        <div class="header-left">
          <a-tooltip :title="collapsed ? '展开菜单' : '收起菜单'">
            <span class="trigger" @click="collapsed = !collapsed">
              <MenuUnfoldOutlined v-if="collapsed" />
              <MenuFoldOutlined v-else />
            </span>
          </a-tooltip>
          <a-breadcrumb class="header-breadcrumb">
            <a-breadcrumb-item>
              <router-link to="/"><HomeOutlined /> 怜言语记</router-link>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="currentRouteName">
              {{ currentRouteName }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <a-input-search
            v-model:value="searchValue"
            placeholder="搜索技术文章..."
            style="width: 280px"
            @search="onSearchSelect"
            @focus="showSearchDropdown = true"
            @blur="hideSearchDropdown"
            allow-clear
          >
            <template #prefix>
              <SearchOutlined style="color: #bfbfbf" />
            </template>
          </a-input-search>
          <div v-if="showSearchDropdown && searchOptions.length > 0" class="search-dropdown">
            <a-list :data-source="searchOptions" size="small">
              <template #renderItem="{ item }">
                <a-list-item @click="selectSearchItem(item)" class="search-item">
                  <a-list-item-meta :description="item.meta">
                    <template #title>
                      <span v-html="highlightText(item.title, searchValue)"></span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
            </a-list>
          </div>
        </div>
      </a-layout-header>

      <a-layout-content class="app-content">
        <div class="content-container">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </a-layout-content>

      <a-layout-footer class="app-footer">
        <a-space split>
          <span>&copy; 2026 怜言语记</span>
          <a href="https://github.com/TheBoe1" rel="noopener noreferrer">
            <GithubOutlined /> GitHub
          </a>
        </a-space>
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { searchLearningArticles } from '../main/mockData.js';
import {
  HomeOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  ExportOutlined,
  GithubOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();

const collapsed = ref(false);
const selectedKeys = ref(['/']);
const theme = ref('light');
const searchValue = ref('');
const searchOptions = ref([]);
const showSearchDropdown = ref(false);

const routeNameMap = {
  '/': '首页',
  '/learning': '文章列表',
  '/projects': '专题看板',
  '/about': '关于系统',
  '/deploy': '系统部署',
  '/git': 'Git教程',
  '/questions': '常见问题'
};

const currentRouteName = computed(() => {
  const path = route.path;
  if (path.startsWith('/learning')) return '文章列表';
  if (path.startsWith('/projects')) return '专题看板';
  return routeNameMap[path] || '';
});

const navigateTo = (path) => {
  selectedKeys.value = [path];
  router.push(path);
};

const openExternal = (url) => {
  window.location.href = url;
};

const toggleSidebar = () => {
  collapsed.value = !collapsed.value;
};

const onCollapse = (collapsedValue) => {
  collapsed.value = collapsedValue;
};

const onSearch = (value) => {
  if (!value.trim()) {
    searchOptions.value = [];
    return;
  }
  const results = searchLearningArticles(value, 8);
  searchOptions.value = results.map(item => ({
    value: item.route,
    title: item.title,
    meta: `${item.bigName} / ${item.techName} / ${item.themeName}`
  }));
};

watch(searchValue, (value) => {
  onSearch(value);
});

const onSearchSelect = (value) => {
  if (value && searchOptions.value.length > 0) {
    selectSearchItem(searchOptions.value[0]);
  }
};

const selectSearchItem = (item) => {
  searchValue.value = '';
  searchOptions.value = [];
  showSearchDropdown.value = false;
  router.push(item.value);
};

const hideSearchDropdown = () => {
  setTimeout(() => {
    showSearchDropdown.value = false;
  }, 200);
};

const highlightText = (text, keyword) => {
  if (!keyword) return text;
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, '<span style="color: #667eea; font-weight: 600">$1</span>');
};

watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/learning/')) {
    selectedKeys.value = ['/learning'];
  } else if (newPath.startsWith('/projects/')) {
    selectedKeys.value = ['/projects'];
  } else {
    selectedKeys.value = [newPath];
  }
}, { immediate: true });

const handleResize = () => {
  if (window.innerWidth < 992) {
    collapsed.value = true;
  }
};

onMounted(() => {
  handleResize();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
}

.app-sider {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  z-index: 10;
  overflow: hidden;
}

.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #667eea;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.5px;
  transition: all 0.3s ease;
}

.v-tag {
  font-size: 10px;
  border-radius: 10px;
  padding: 0 8px;
  height: 18px;
  line-height: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.collapse-btn {
  font-size: 16px;
  cursor: pointer;
  color: #5f6368;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.collapse-btn:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  color: #667eea;
  border-color: rgba(102, 126, 234, 0.3);
  transform: scale(1.05);
}

.collapse-btn:active {
  transform: scale(0.95);
}

.v-tag {
  font-size: 10px;
}

.app-menu {
  border-right: none;
  height: calc(100% - 64px);
  overflow-y: auto;
}

.app-menu :deep(.ant-menu-item-group-title) {
  padding: 16px 16px 8px;
  color: #5f6368;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.app-menu :deep(.ant-menu-item) {
  margin: 2px 8px;
  border-radius: 24px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  height: 40px;
  line-height: 40px;
}

.app-menu :deep(.ant-menu-item:hover) {
  background: rgba(102, 126, 234, 0.08);
  color: #667eea;
}

.app-menu :deep(.ant-menu-item-selected) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 1px 3px rgba(102, 126, 234, 0.3);
}

.app-menu :deep(.ant-menu-item-selected .anticon) {
  color: #fff;
}

.external-menu-item {
  position: relative;
}

.external-icon {
  position: absolute;
  right: 12px;
  font-size: 10px;
  color: #5f6368;
  opacity: 0;
  transition: opacity 0.2s;
}

.external-menu-item:hover .external-icon {
  opacity: 1;
}

.bottom-menu {
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.main-layout {
  background: #f5f5f5;
}

.app-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  z-index: 9;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 8px 12px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.trigger::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(102, 126, 234, 0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.trigger:hover::before {
  width: 100%;
  height: 100%;
}

.trigger:hover {
  color: #667eea;
}

.trigger:active {
  transform: scale(0.95);
}

.header-breadcrumb {
  font-weight: 600;
}

.header-breadcrumb :deep(a) {
  color: #666;
  transition: color 0.2s;
}

.header-breadcrumb :deep(a:hover) {
  color: #667eea;
}

.header-right {
  display: flex;
  align-items: center;
  position: relative;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 320px;
  max-height: 400px;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
  z-index: 100;
  margin-top: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  animation: dropdownSlideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dropdownSlideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-item {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 12px 16px !important;
  border-radius: 8px;
  margin: 4px 8px;
}

.search-item:hover {
  background: rgba(102, 126, 234, 0.08);
  transform: translateX(4px);
}

.search-item:active {
  background: rgba(102, 126, 234, 0.12);
}

.app-content {
  margin: 16px;
  overflow: auto;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
}

.app-footer {
  text-align: center;
  background: transparent;
  padding: 16px 24px;
}

.app-footer :deep(.ant-space-item) {
  color: #999;
  font-size: 12px;
}

.app-footer :deep(a) {
  color: #666;
  transition: color 0.2s;
}

.app-footer :deep(a:hover) {
  color: #667eea;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }
  
  .header-breadcrumb {
    display: none;
  }
  
  .header-right :deep(.ant-input-search) {
    width: 160px !important;
  }
  
  .search-dropdown {
    width: 280px;
    right: -12px;
  }
  
  .app-content {
    margin: 8px;
  }
  
  .logo {
    font-size: 18px;
  }
  
  .app-menu :deep(.ant-menu-item) {
    margin: 2px 4px;
    border-radius: 20px;
    height: 36px;
    line-height: 36px;
  }
}

@media (max-width: 576px) {
  .header-right :deep(.ant-input-search) {
    width: 120px !important;
  }
  
  .search-dropdown {
    width: 240px;
    right: -8px;
  }
  
  .app-footer :deep(.ant-space) {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
