<template>
  <div class="page-about">
    <a-card :bordered="false" class="about-card">
      <a-row :gutter="[24, 24]">
        <a-col :span="24">
          <a-space align="center" :size="16">
            <a-avatar :size="64" class="about-avatar">L</a-avatar>
            <div>
              <a-typography-title :level="3" style="margin: 0">怜言语记</a-typography-title>
              <a-typography-text type="secondary">技术成长与沉淀的个人知识库</a-typography-text>
            </div>
          </a-space>
        </a-col>
      </a-row>
    </a-card>

    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :sm="12" :md="8">
        <a-card title="关于系统" :bordered="false" class="info-card">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="版本">v1.2</a-descriptions-item>
            <a-descriptions-item label="框架">Vue 3 + Vite</a-descriptions-item>
            <a-descriptions-item label="UI">Ant Design Vue</a-descriptions-item>
            <a-descriptions-item label="路由">Vue Router 4</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="12" :md="8">
        <a-card title="功能特性" :bordered="false" class="info-card">
          <a-list :data-source="features" size="small">
            <template #renderItem="{ item }">
              <a-list-item style="padding: 4px 0; border: none">
                <CheckCircleOutlined style="color: #52c41a; margin-right: 8px" />
                <span>{{ item }}</span>
              </a-list-item>
            </template>
          </a-list>
        </a-card>
      </a-col>
      
      <a-col :xs="24" :sm="24" :md="8">
        <a-card title="联系方式" :bordered="false" class="info-card">
          <a-space direction="vertical" :size="12">
            <a :href="link.url" rel="noopener noreferrer" v-for="link in contactLinks" :key="link.title">
              <a-button type="link" :icon="h(link.icon)">
                {{ link.title }}
              </a-button>
            </a>
          </a-space>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="更新日志" :bordered="false" style="margin-top: 16px">
      <a-timeline>
        <a-timeline-item v-for="log in changeLogs" :key="log.date" :color="log.color">
          <p><strong>{{ log.date }}</strong></p>
          <p>{{ log.content }}</p>
        </a-timeline-item>
      </a-timeline>
    </a-card>
  </div>
</template>

<script setup>
import { h } from 'vue';
import { CheckCircleOutlined, GithubOutlined, BugOutlined, UserOutlined } from '@ant-design/icons-vue';

const features = [
  '文章分类管理',
  '全文搜索功能',
  '响应式设计',
  '暗色主题支持'
];

const contactLinks = [
  { title: 'GitHub仓库', url: 'https://github.com/TheBoe1/LianLab-content', icon: GithubOutlined },
  { title: '问题反馈 (Issues)', url: 'https://github.com/TheBoe1/terminal/issues', icon: BugOutlined },
  { title: '开发者主页', url: 'https://github.com/TheBoe1', icon: UserOutlined }
];

const changeLogs = [
  { date: '2026-03-17', content: '使用 Ant Design Vue 重构用户界面', color: 'green' },
  { date: '2026-03-15', content: '优化路由架构，实现主页面与管理平台分离部署', color: 'blue' },
  { date: '2026-03-12', content: '新增 Git 相关文章分类', color: 'blue' },
  { date: '2026-03-10', content: '初始版本发布', color: 'gray' }
];
</script>

<style scoped>
.page-about {
  padding: 0;
}

.about-card {
  background: linear-gradient(135deg, #1a73e8 0%, #4285f4 50%, #34a853 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(26, 115, 232, 0.25);
}

.about-card :deep(.ant-card-body) {
  padding: 32px;
}

.about-avatar {
  background: rgba(255, 255, 255, 0.25);
  color: #fff;
  font-weight: 900;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.about-card :deep(.ant-typography) {
  color: #fff;
}

.info-card {
  height: 100%;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.info-card :deep(.ant-card-head-title) {
  font-weight: 600;
  color: #202124;
}

.page-about :deep(.ant-card) {
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.page-about :deep(.ant-timeline-item-content) {
  padding: 4px 0;
}

.page-about :deep(.ant-btn-link) {
  color: #1a73e8;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-about :deep(.ant-btn-link:hover) {
  color: #1557b0;
}

@media (max-width: 768px) {
  .about-card :deep(.ant-card-body) {
    padding: 20px;
  }
  
  .about-avatar {
    width: 48px !important;
    height: 48px !important;
    font-size: 20px !important;
  }
  
  .info-card {
    border-radius: 12px;
  }
  
  .info-card:hover {
    transform: none;
  }
  
  .page-about :deep(.ant-card) {
    border-radius: 12px;
  }
}

@media (max-width: 576px) {
  .about-card :deep(.ant-typography-title) {
    font-size: 20px !important;
  }
}
</style>
