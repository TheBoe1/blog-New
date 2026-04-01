<template>
  <div class="page-projects">
    <template v-if="!$route.params.id">
      <a-card title="专题看板" :bordered="false" class="header-card">
        <template #extra>
          <a-typography-text type="secondary">技术专题归档与深度解析</a-typography-text>
        </template>
      </a-card>

      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col v-for="project in projects" :key="project.id" :xs="24" :sm="12" :md="8" :lg="8">
          <a-card hoverable class="project-card" @click="router.push(`/projects/${project.id}`)">
            <template #title>
              <a-space>
                <a-typography-text strong>{{ project.name }}</a-typography-text>
                <a-tag color="processing">进行中</a-tag>
              </a-space>
            </template>
            <template #extra>
              <RightOutlined />
            </template>
            
            <a-typography-text type="secondary" class="project-desc">
              {{ project.desc }}
            </a-typography-text>
            
            <a-divider style="margin: 12px 0" />
            
            <a-typography-title :level="5" style="margin-bottom: 8px">核心要点</a-typography-title>
            <a-list :data-source="project.features.slice(0, 3)" size="small">
              <template #renderItem="{ item }">
                <a-list-item style="padding: 4px 0; border: none">
                  <CheckCircleOutlined style="color: #52c41a; margin-right: 8px" />
                  <span>{{ item }}</span>
                </a-list-item>
              </template>
            </a-list>
            
            <a-divider style="margin: 12px 0" />
            
            <a-typography-title :level="5" style="margin-bottom: 8px">涉及技术</a-typography-title>
            <a-space wrap>
              <a-tag v-for="(stack, idx) in project.techStack.slice(0, 3)" :key="idx" color="blue">
                {{ stack }}
              </a-tag>
            </a-space>
          </a-card>
        </a-col>
      </a-row>
    </template>

    <div v-else class="detail-container">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getProjectList } from '../main/mockData.js';
import { RightOutlined, CheckCircleOutlined } from '@ant-design/icons-vue';

const router = useRouter();
const projects = ref(getProjectList());
</script>

<style scoped>
.page-projects {
  padding: 0;
}

.header-card {
  margin-bottom: 16px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.header-card :deep(.ant-card-head-title) {
  font-weight: 600;
  font-size: 18px;
  color: #202124;
}

.project-card {
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.project-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 32px rgba(26, 115, 232, 0.15);
  border-color: rgba(26, 115, 232, 0.3);
}

.project-card:active {
  transform: translateY(-4px) scale(1.01);
}

.project-card :deep(.ant-card-head-title) {
  font-weight: 600;
  color: #202124;
}

.project-card :deep(.ant-tag) {
  border-radius: 12px;
  border: none;
}

.project-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #5f6368;
  line-height: 1.6;
}

.project-card :deep(.ant-list-item) {
  padding: 4px 0;
}

.project-card :deep(.anticon-check-circle) {
  color: #34a853;
}

.detail-container {
  padding: 0;
}

@media (max-width: 768px) {
  .project-card {
    margin-bottom: 8px;
    border-radius: 12px;
  }
  
  .project-card:hover {
    transform: translateY(-4px) scale(1.01);
  }
  
  .header-card {
    border-radius: 12px;
  }
}

@media (max-width: 576px) {
  .project-card :deep(.ant-card-head-title) {
    font-size: 14px;
  }
  
  .project-card :deep(.ant-tag) {
    font-size: 11px;
    padding: 1px 8px;
  }
}
</style>
