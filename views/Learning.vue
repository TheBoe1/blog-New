<template>
  <div class="page-learning">
    <a-card :bordered="false" class="header-card">
      <div class="header-content">
        <div class="header-left">
          <a-typography-title :level="4" style="margin: 0">文章分类</a-typography-title>
          <template v-if="isSearching">
            <a-tag color="blue" closable @close="router.push({ path: '/learning' })">
              搜索：{{ searchQuery }}
            </a-tag>
          </template>
        </div>
        <div class="header-right">
          <a-breadcrumb v-if="!isSearching">
            <a-breadcrumb-item>
              <a @click="router.push(rootPath)">全部</a>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="route.params.big">
              <a @click="router.push(`${rootPath}/${route.params.big}`)">{{ currentBigName }}</a>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="route.params.tech">
              <a @click="router.push(`${rootPath}/${route.params.big}/${route.params.tech}`)">{{ currentTechName }}</a>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="route.params.theme">
              {{ currentThemeName }}
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
      </div>
    </a-card>

    <div v-if="!isSearching && (currentNodes.length > 0 || isRoot)" class="node-grid">
      <a-row :gutter="[16, 16]">
        <a-col v-for="(node, index) in currentNodes" :key="node.path" :xs="12" :sm="8" :md="6" :lg="4">
          <a-card 
            hoverable 
            class="node-card" 
            @click="router.push(node.path)"
            :bodyStyle="{ padding: '20px 16px' }"
          >
            <a-space direction="vertical" :size="12" style="width: 100%; align-items: center">
              <a-avatar 
                :size="48" 
                :style="{ backgroundColor: categoryColors[index % categoryColors.length] }"
              >
                <template #icon>
                  <component :is="categoryIcons[index % categoryIcons.length]" />
                </template>
              </a-avatar>
              <a-typography-text strong style="font-size: 14px">{{ node.name }}</a-typography-text>
              <a-typography-text type="secondary" style="font-size: 12px">
                {{ getNodeArticleCount(node.path) }} 篇文章
              </a-typography-text>
            </a-space>
          </a-card>
        </a-col>
        <a-col v-if="isRoot" :xs="12" :sm="8" :md="6" :lg="4">
          <a-card 
            hoverable 
            class="node-card deploy-card" 
            @click="router.push('/deploy')"
            :bodyStyle="{ padding: '20px 16px' }"
          >
            <a-space direction="vertical" :size="12" style="width: 100%; align-items: center">
              <a-avatar :size="48" style="background-color: #722ed1">
                <template #icon><CloudServerOutlined /></template>
              </a-avatar>
              <a-typography-text strong style="font-size: 14px; color: #fff">系统部署</a-typography-text>
              <a-typography-text style="font-size: 12px; color: rgba(255,255,255,0.85)">
                部署指南
              </a-typography-text>
            </a-space>
          </a-card>
        </a-col>
      </a-row>
    </div>

    <a-card v-if="hasArticleDetail" :bordered="false" class="detail-card">
      <router-view />
    </a-card>

    <a-card v-else :bordered="false" class="list-card" style="margin-top: 16px">
      <template #title v-if="pageData.items.length > 0">
        <a-space>
          <FileTextOutlined />
          <span>文章列表</span>
          <a-tag color="blue">{{ pageData.total }} 篇</a-tag>
        </a-space>
      </template>
      
      <a-list
        :data-source="pageData.items"
        item-layout="horizontal"
      >
        <template #renderItem="{ item, index }">
          <a-list-item @click="openArticle(item)" class="log-item">
            <a-list-item-meta>
              <template #title>
                <a-space :size="8">
                  <span class="article-index">{{ String(index + 1).padStart(2, '0') }}</span>
                  <a-typography-text strong class="log-topic">{{ item.topic }}</a-typography-text>
                </a-space>
              </template>
              <template #description>
                <a-space :size="4" wrap>
                  <a-tag color="processing" @click.stop="router.push(`${rootPath}/${item.bigKey}`)">
                    <FolderOutlined /> {{ item.bigName }}
                  </a-tag>
                  <RightOutlined style="font-size: 10px; color: #d9d9d9" />
                  <a-tag @click.stop="router.push(`${rootPath}/${item.bigKey}/${item.techKey}`)">
                    {{ item.techName }}
                  </a-tag>
                  <RightOutlined style="font-size: 10px; color: #d9d9d9" />
                  <a-tag color="success" @click.stop="router.push(`${rootPath}/${item.bigKey}/${item.techKey}/${item.themeKey}`)">
                    {{ item.themeName }}
                  </a-tag>
                </a-space>
              </template>
            </a-list-item-meta>
            <template #actions>
              <a-space direction="vertical" :size="4" align="end">
                <a-typography-text type="secondary" style="font-size: 12px">
                  <CalendarOutlined /> {{ item.date }}
                </a-typography-text>
                <a-typography-text type="secondary" style="font-size: 12px">
                  <EyeOutlined /> {{ getViewCount(item.id) }} 阅读
                </a-typography-text>
              </a-space>
            </template>
          </a-list-item>
        </template>
      </a-list>
      
      <a-empty v-if="pageData.items.length === 0" description="暂无文章" />
      
      <div v-if="pageData.totalPages > 1" class="pagination-container">
        <a-pagination
          v-model:current="page"
          :total="pageData.total"
          :page-size="pageSize"
          show-less-items
          :show-total="total => `共 ${total} 篇`"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getLearningLogs, getLearningChildren, getLearningRootPath, getLearningArticlesByNodePath, searchLearningArticles } from '../main/mockData.js';
import { 
  EyeOutlined, 
  FileTextOutlined, 
  FolderOutlined,
  CalendarOutlined,
  RightOutlined,
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  CalculatorOutlined,
  ToolOutlined,
  RocketOutlined,
  ApiOutlined,
  SafetyOutlined,
  MobileOutlined,
  DesktopOutlined,
  CloudOutlined
} from '@ant-design/icons-vue';

const route = useRoute();
const router = useRouter();

const allLogs = ref(getLearningLogs());
const rootPath = getLearningRootPath();

const categoryColors = [
  '#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2'
];

const categoryIcons = [
  CodeOutlined,
  DatabaseOutlined, 
  CalculatorOutlined,
  ToolOutlined,
  RocketOutlined,
  ApiOutlined
];

const getNodeArticleCount = (nodePath) => {
  return getLearningArticlesByNodePath(nodePath, 1, 1).total;
};

const STORAGE_KEY = 'blog_view_counts_data_v2';

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

const viewCounts = ref(initialCounts);

const getViewCount = (id) => {
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

const currentNodes = computed(() => getLearningChildren(currentNodePath.value));
const searchQuery = computed(() => String(route.query.q ?? '').trim());
const isSearching = computed(() => searchQuery.value.length > 0);
const isRoot = computed(() => !route.params.big && !route.params.tech && !route.params.theme && !isSearching.value);

const hasArticleDetail = computed(() => {
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

const page = ref(1);
const pageSize = ref(10);

watch(currentNodePath, () => {
  page.value = 1;
});

watch(searchQuery, () => {
  page.value = 1;
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
.page-learning {
  padding: 0;
}

.header-card {
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.header-card :deep(.ant-card-body) {
  padding: 16px 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-right :deep(.ant-breadcrumb) {
  font-size: 13px;
}

.header-right :deep(.ant-breadcrumb a) {
  color: #5f6368;
  transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-right :deep(.ant-breadcrumb a:hover) {
  color: #1a73e8;
}

.node-grid {
  margin-bottom: 16px;
}

.node-card {
  text-align: center;
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.node-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 32px rgba(26, 115, 232, 0.15);
  border-color: rgba(26, 115, 232, 0.3);
}

.node-card:active {
  transform: translateY(-4px) scale(1.01);
}

.deploy-card {
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 100%);
  border: none;
}

.deploy-card:hover {
  box-shadow: 0 16px 32px rgba(26, 115, 232, 0.3);
}

.deploy-card :deep(.ant-typography) {
  color: #fff;
}

.detail-card {
  min-height: 400px;
}

.list-card :deep(.ant-card-body) {
  padding: 0;
}

.list-card :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.log-item {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 20px 24px !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04) !important;
  position: relative;
  overflow: hidden;
}

.log-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #1a73e8;
  transform: scaleY(0);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.log-item:hover {
  background: rgba(26, 115, 232, 0.04);
}

.log-item:hover::before {
  transform: scaleY(1);
}

.log-item:active {
  background: rgba(26, 115, 232, 0.08);
}

.log-topic {
  font-size: 15px;
  color: #202124;
  transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.log-topic:hover {
  color: #1a73e8;
}

.log-item :deep(.ant-tag) {
  border-radius: 12px;
  padding: 2px 10px;
  font-size: 12px;
  border: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.log-item :deep(.ant-tag:hover) {
  transform: scale(1.05);
}

.article-index {
  display: inline-block;
  min-width: 24px;
  font-size: 12px;
  font-weight: 600;
  color: #bfbfbf;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  text-align: right;
  margin-right: 4px;
}

.pagination-container {
  padding: 20px 24px;
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.pagination-container :deep(.ant-pagination-item) {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.pagination-container :deep(.ant-pagination-item:hover) {
  border-color: #1a73e8;
}

.pagination-container :deep(.ant-pagination-item a) {
  color: #5f6368;
}

.pagination-container :deep(.ant-pagination-item:hover a) {
  color: #1a73e8;
}

.pagination-container :deep(.ant-pagination-item-active) {
  background: #1a73e8;
  border-color: #1a73e8;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.3);
}

.pagination-container :deep(.ant-pagination-item-active a) {
  color: #fff;
}

.list-card {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

@media (max-width: 768px) {
  .header-card :deep(.ant-card-body) {
    padding: 12px 16px;
  }
  
  .log-item {
    padding: 12px 16px !important;
  }
  
  .pagination-container {
    padding: 12px 16px;
  }
  
  .node-card :deep(.ant-card-body) {
    padding: 16px 12px !important;
  }
  
  .node-card {
    border-radius: 12px;
  }
  
  .node-card:hover {
    transform: translateY(-4px) scale(1.01);
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .header-right :deep(.ant-breadcrumb) {
    font-size: 12px;
  }
  
  .log-item :deep(.ant-tag) {
    font-size: 11px;
    padding: 1px 8px;
  }
}

@media (max-width: 576px) {
  .article-index {
    font-size: 11px;
    min-width: 20px;
  }
  
  .log-topic {
    font-size: 14px;
  }
  
  .pagination-container :deep(.ant-pagination) {
    font-size: 12px;
  }
  
  .pagination-container :deep(.ant-pagination-item) {
    min-width: 28px;
    height: 28px;
    line-height: 26px;
  }
}
</style>
