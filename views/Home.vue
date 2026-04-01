<template>
  <div class="page-home">
    <a-row :gutter="[16, 16]">
      <a-col :span="24">
        <a-card class="hero-card" :bordered="false">
          <a-row :gutter="24" align="middle">
            <a-col :xs="24" :sm="24" :md="16">
              <div class="hero-content">
                <a-avatar :size="64" class="hero-avatar">L</a-avatar>
                <div class="hero-text">
                  <a-typography-title :level="2" class="hero-title">怜言语记</a-typography-title>
                  <a-typography-text type="secondary">技术成长与沉淀的个人知识库</a-typography-text>
                </div>
              </div>
            </a-col>
            <a-col :xs="24" :sm="24" :md="8">
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-statistic title="文章" :value="totalArticles" class="stat-item" />
                </a-col>
                <a-col :span="8">
                  <a-statistic title="大类" :value="bigCategories.length" class="stat-item" />
                </a-col>
                <a-col :span="8">
                  <a-statistic title="技术栈" :value="totalTechStacks" class="stat-item" />
                </a-col>
              </a-row>
            </a-col>
          </a-row>
          <a-divider style="margin: 16px 0" />
          <a-space wrap>
            <a-button type="primary" @click="router.push('/learning')">
              <template #icon><FileTextOutlined /></template>
              文章列表
            </a-button>
            <a-button @click="router.push('/projects')">
              <template #icon><AppstoreOutlined /></template>
              专题看板
            </a-button>
            <a-button @click="router.push('/deploy')">
              <template #icon><CloudServerOutlined /></template>
              系统部署
            </a-button>
            <a-button @click="router.push('/questions')">
              <template #icon><QuestionCircleOutlined /></template>
              常见问题
            </a-button>
            <a-button @click="router.push('/about')">
              <template #icon><InfoCircleOutlined /></template>
              关于系统
            </a-button>
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="文章分类" :bordered="false" :extra="renderExtra('/learning', '查看全部')">
          <a-row :gutter="[16, 16]">
            <a-col v-for="c in bigCategories" :key="c.key" :xs="12" :sm="8" :md="6" :lg="4">
              <a-card hoverable class="category-card" @click="router.push(`/learning/${c.key}`)">
                <a-statistic :title="c.name" :value="c.count" suffix="篇">
                  <template #formatter="{ value }">
                    <span class="category-count">{{ value }}</span>
                  </template>
                </a-statistic>
              </a-card>
            </a-col>
          </a-row>
        </a-card>
      </a-col>
    </a-row>

    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="最新文章" :bordered="false" :extra="renderExtra('/learning', '进入列表')">
          <a-list
            :data-source="latestArticles"
            item-layout="horizontal"
          >
            <template #renderItem="{ item }">
              <a-list-item @click="openArticle(item)" class="article-item">
                <a-list-item-meta :description="`${item.bigName} / ${item.techName} / ${item.themeName}`">
                  <template #title>
                    <span class="article-title">{{ item.topic }}</span>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <span class="article-date">{{ item.date }}</span>
                </template>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { computed, h } from 'vue';
import { useRouter } from 'vue-router';
import { getLearningChildren, getLearningArticlesByNodePath } from '../main/mockData.js';
import {
  FileTextOutlined,
  AppstoreOutlined,
  CloudServerOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  RightOutlined
} from '@ant-design/icons-vue';

const router = useRouter();
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

const openArticle = (article) => {
  router.push(article.detailRoute || article.route);
};

const renderExtra = (path, text) => {
  return h('a', { onClick: () => router.push(path), class: 'card-extra-link' }, [
    text,
    h(RightOutlined, { style: { marginLeft: '4px', fontSize: '12px' } })
  ]);
};
</script>

<style scoped>
.page-home {
  padding: 0;
}

.hero-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.25);
}

.hero-card :deep(.ant-card-body) {
  padding: 32px;
}

.hero-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-avatar {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-weight: 900;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hero-text {
  color: #fff;
}

.hero-title {
  margin: 0 !important;
  color: #fff !important;
  font-weight: 600 !important;
}

.hero-text :deep(.ant-typography) {
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
}

.stat-item :deep(.ant-statistic-title) {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
}

.stat-item :deep(.ant-statistic-content) {
  color: #fff;
  font-weight: 600;
}

.category-card {
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
}

.category-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.18);
  border-color: rgba(102, 126, 234, 0.3);
}

.category-count {
  font-size: 28px;
  font-weight: 600;
  color: #667eea;
}

.article-item {
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 8px;
}

.article-item:hover {
  background: rgba(102, 126, 234, 0.06);
  transform: translateX(4px);
}

.article-title {
  font-weight: 500;
  color: #202124;
  font-size: 15px;
}

.article-date {
  color: #5f6368;
  font-size: 12px;
}

.hero-card :deep(.ant-btn) {
  border-radius: 24px;
  height: 40px;
  padding: 0 24px;
  font-weight: 500;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.hero-card :deep(.ant-btn-primary) {
  background: #fff;
  color: #1a73e8;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.hero-card :deep(.ant-btn-primary:hover) {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.hero-card :deep(.ant-btn-primary:active) {
  transform: translateY(0);
}

.hero-card :deep(.ant-btn-default) {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(4px);
}

.hero-card :deep(.ant-btn-default:hover) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.hero-card :deep(.ant-btn-default:active) {
  transform: translateY(0);
}

.card-extra-link {
  color: #1a73e8;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.card-extra-link:hover {
  color: #1557b0;
  transform: translateX(2px);
}

.page-home :deep(.ant-card) {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.page-home :deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.page-home :deep(.ant-card-head) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 16px 24px;
}

.page-home :deep(.ant-card-head-title) {
  font-weight: 600;
  font-size: 16px;
  color: #202124;
}

.page-home :deep(.ant-card-body) {
  padding: 24px;
}

@media (max-width: 768px) {
  .hero-card :deep(.ant-card-body) {
    padding: 20px;
  }
  
  .hero-content {
    justify-content: center;
    margin-bottom: 16px;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .category-count {
    font-size: 22px;
  }
  
  .hero-card :deep(.ant-btn) {
    height: 36px;
    padding: 0 16px;
    font-size: 13px;
  }
  
  .page-home :deep(.ant-card-body) {
    padding: 16px;
  }
  
  .page-home :deep(.ant-card-head) {
    padding: 12px 16px;
  }
  
  .article-item {
    padding: 12px 16px !important;
  }
}

@media (max-width: 576px) {
  .hero-avatar {
    width: 48px !important;
    height: 48px !important;
    font-size: 20px !important;
  }
  
  .hero-title {
    font-size: 20px !important;
  }
  
  .category-card {
    border-radius: 12px;
  }
  
  .category-card:hover {
    transform: translateY(-4px) scale(1.01);
  }
}
</style>
