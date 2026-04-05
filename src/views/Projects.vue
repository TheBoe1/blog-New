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
import { useRouter } from 'vue-router'
import { projects } from '@/data/projects'

const router = useRouter()
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
