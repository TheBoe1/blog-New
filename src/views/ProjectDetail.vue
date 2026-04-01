<template>
  <div class="project-detail">
    <div class="project-header">
      <el-button type="primary" link @click="router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <h1>{{ project.name }}</h1>
      <div class="project-meta">
        <span><el-icon><Star /></el-icon> {{ project.stars }} Stars</span>
        <span><el-icon><Calendar /></el-icon> 更新于 {{ project.updatedAt }}</span>
      </div>
      <div class="project-tags">
        <el-tag v-for="tag in project.tags" :key="tag" effect="plain">{{ tag }}</el-tag>
      </div>
    </div>

    <el-card shadow="never" class="project-content">
      <div class="section">
        <h3>项目简介</h3>
        <p>{{ project.description }}</p>
      </div>

      <div class="section">
        <h3>技术栈</h3>
        <div class="tech-list">
          <div v-for="tech in project.techStack" :key="tech.name" class="tech-item">
            <span class="tech-name">{{ tech.name }}</span>
            <span class="tech-desc">{{ tech.description }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3>功能特性</h3>
        <ul class="feature-list">
          <li v-for="feature in project.features" :key="feature">{{ feature }}</li>
        </ul>
      </div>

      <div class="section">
        <h3>项目截图</h3>
        <div class="screenshots">
          <div v-for="(screenshot, index) in project.screenshots" :key="index" class="screenshot-item">
            <img :src="screenshot" :alt="`截图${index + 1}`" />
          </div>
        </div>
      </div>

      <div class="project-actions">
        <el-button type="primary" @click="handleVisit">
          <el-icon><Link /></el-icon>
          访问项目
        </el-button>
        <el-button @click="handleGithub">
          <el-icon><Link /></el-icon>
          查看源码
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const project = ref({
  id: '1',
  name: '个人博客系统',
  description: '基于 Vue 3 + TypeScript + Element Plus 构建的个人博客系统，支持文章管理、分类标签、评论系统等功能。采用现代化的前端技术栈，提供流畅的用户体验和便捷的后台管理功能。',
  tags: ['Vue 3', 'TypeScript', 'Element Plus', 'Pinia'],
  stars: 128,
  updatedAt: '2024-01-15',
  techStack: [
    { name: 'Vue 3', description: '渐进式 JavaScript 框架' },
    { name: 'TypeScript', description: 'JavaScript 的超集' },
    { name: 'Element Plus', description: 'Vue 3 组件库' },
    { name: 'Pinia', description: 'Vue 状态管理' },
    { name: 'Vite', description: '下一代前端构建工具' },
    { name: 'wangEditor', description: '富文本编辑器' }
  ],
  features: [
    '文章的增删改查和富文本编辑',
    '分类和标签管理',
    '评论系统和审核功能',
    '文章搜索和归档',
    '响应式设计，支持移动端',
    '后台管理系统'
  ],
  screenshots: []
})

function handleVisit() {
  console.log('Visit project')
}

function handleGithub() {
  console.log('View source code')
}

onMounted(() => {
  console.log('Loading project:', route.params.id)
})
</script>

<style scoped lang="scss">
.project-detail {
  .project-header {
    margin-bottom: 24px;

    h1 {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      margin: 16px 0;
    }

    .project-meta {
      display: flex;
      gap: 20px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #909399;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .project-tags {
      display: flex;
      gap: 8px;
    }
  }

  .project-content {
    .section {
      margin-bottom: 32px;

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e4e7ed;
      }

      p {
        font-size: 15px;
        color: #606266;
        line-height: 1.8;
        margin: 0;
      }

      .tech-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .tech-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          background: #f5f7fa;
          border-radius: 8px;

          .tech-name {
            font-weight: 600;
            color: #303133;
          }

          .tech-desc {
            font-size: 13px;
            color: #909399;
          }
        }
      }

      .feature-list {
        margin: 0;
        padding-left: 20px;

        li {
          font-size: 15px;
          color: #606266;
          line-height: 2;
        }
      }

      .screenshots {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .screenshot-item {
          border-radius: 8px;
          overflow: hidden;
          background: #f5f7fa;

          img {
            width: 100%;
            display: block;
          }
        }
      }
    }
  }

  .project-actions {
    display: flex;
    gap: 12px;
    padding-top: 24px;
    border-top: 1px solid #e4e7ed;
  }
}
</style>
