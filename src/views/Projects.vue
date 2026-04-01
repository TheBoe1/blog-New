<template>
  <div class="projects-page">
    <div class="page-header">
      <h1>项目展示</h1>
      <p>这里展示了我参与开发的一些项目</p>
    </div>

    <div class="project-grid">
      <el-card
        v-for="project in projects"
        :key="project.id"
        shadow="hover"
        class="project-card"
        @click="router.push(`/project/${project.id}`)"
      >
        <div class="project-cover">
          <img v-if="project.cover" :src="project.cover" :alt="project.name" />
          <div v-else class="cover-placeholder">
            <el-icon :size="48"><FolderOpened /></el-icon>
          </div>
        </div>
        <div class="project-info">
          <h3 class="project-name">{{ project.name }}</h3>
          <p class="project-description">{{ project.description }}</p>
          <div class="project-tags">
            <el-tag
              v-for="tag in project.tags.slice(0, 3)"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
          <div class="project-meta">
            <span class="stars">
              <el-icon><Star /></el-icon>
              {{ project.stars }}
            </span>
            <span class="updated">
              更新于 {{ project.updatedAt }}
            </span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const projects = ref([
  {
    id: '1',
    name: '个人博客系统',
    description: '基于 Vue 3 + TypeScript + Element Plus 构建的个人博客系统，支持文章管理、分类标签等功能',
    cover: '',
    tags: ['Vue 3', 'TypeScript', 'Element Plus'],
    stars: 128,
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    name: '可视化数据平台',
    description: '企业级数据可视化平台，支持多种图表类型和实时数据展示',
    cover: '',
    tags: ['Vue 3', 'ECharts', 'DataV'],
    stars: 256,
    updatedAt: '2024-01-10'
  },
  {
    id: '3',
    name: '后台管理系统',
    description: '通用的后台管理系统模板，集成权限管理、用户管理等功能模块',
    cover: '',
    tags: ['Vue 3', 'Pinia', 'Axios'],
    stars: 89,
    updatedAt: '2024-01-05'
  },
  {
    id: '4',
    name: '移动端电商应用',
    description: '基于 uni-app 开发的跨平台电商应用，支持微信小程序和 H5',
    cover: '',
    tags: ['uni-app', 'Vue 3', '小程序'],
    stars: 156,
    updatedAt: '2023-12-20'
  }
])
</script>

<style scoped lang="scss">
.projects-page {
  .page-header {
    text-align: center;
    margin-bottom: 40px;

    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #303133;
      margin: 0 0 12px;
    }

    p {
      font-size: 16px;
      color: #909399;
      margin: 0;
    }
  }

  .project-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;

    .project-card {
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
      }

      :deep(.el-card__body) {
        padding: 0;
      }

      .project-cover {
        height: 200px;
        background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c0c4cc;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .project-info {
        padding: 20px;

        .project-name {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 12px;
        }

        .project-description {
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
          margin: 0 0 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .project-tags {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .project-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #909399;

          .stars {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }
  }
}
</style>
