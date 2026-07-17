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

    <el-card shadow="never" class="project-content markdown-content">
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

      <div v-if="project.screenshots.length > 0" class="section">
        <h3>项目截图</h3>
        <div class="screenshots">
          <div v-for="(screenshot, index) in project.screenshots" :key="index" class="screenshot-item">
            <img
              :src="screenshot"
              :alt="`截图${index + 1}`"
              width="1200"
              height="675"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>

      <div class="project-actions">
        <el-button v-if="project.link" type="primary" @click="handleVisit">
          <el-icon><Link /></el-icon>
          访问项目
        </el-button>
        <el-button v-if="project.github" @click="handleGithub">
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
import { getProjectById, type Project } from '@/data/projects'

const route = useRoute()
const router = useRouter()

const defaultProject: Project = {
  id: '',
  name: '项目不存在',
  description: '抱歉，您访问的项目不存在或已被删除。',
  cover: '',
  tags: [],
  stars: 0,
  updatedAt: '',
  link: '',
  github: '',
  techStack: [],
  features: [],
  screenshots: []
}

const project = ref<Project>(defaultProject)

function handleVisit() {
  if (project.value.link) {
    window.open(project.value.link, '_blank')
  }
}

function handleGithub() {
  if (project.value.github) {
    window.open(project.value.github, '_blank')
  }
}

onMounted(() => {
  const id = route.params.id as string
  const foundProject = getProjectById(id)
  if (foundProject) {
    project.value = foundProject
  }
})
</script>

<style scoped lang="scss">
.project-detail {
  .project-header {
    margin-bottom: var(--space-6);

    h1 {
      font-size: var(--font-size-3xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: var(--space-4) 0;
    }

    .project-meta {
      display: flex;
      gap: var(--space-5);
      margin-bottom: var(--space-3);
      font-size: var(--font-size-sm);
      color: var(--text-muted);

      span {
        display: flex;
        align-items: center;
        gap: var(--space-1);
      }
    }

    .project-tags {
      display: flex;
      gap: var(--space-2);
    }
  }

  // .markdown-content (on .project-content) 提供 h3/p/ul/li 共享渲染样式 — 与文章详情一致 (Reuse, ADR-002 §5)
  .project-content {
    .section {
      margin-bottom: var(--space-8);

      &:last-child {
        margin-bottom: 0;
      }

      .tech-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);

        .tech-item {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          padding: var(--space-4);
          background: var(--surface-raised);
          border-radius: var(--radius-lg);

          .tech-name {
            font-weight: 600;
            color: var(--text-primary);
          }

          .tech-desc {
            font-size: var(--font-size-xs);
            color: var(--text-muted);
          }
        }
      }

      .feature-list {
        margin: 0;
        padding-left: var(--space-5);
      }

      .screenshots {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-4);

        .screenshot-item {
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--surface-raised);

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
    gap: var(--space-3);
    padding-top: var(--space-6);
    border-top: 1px solid var(--border-color);
  }
}
</style>
