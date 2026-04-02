<template>
  <div class="article-detail">
    <div class="article-header">
      <h1 class="article-title">{{ article.title }}</h1>
      <div class="article-meta">
        <span class="category">
          <el-tag effect="plain">{{ article.categoryName }}</el-tag>
        </span>
        <span class="date">
          <el-icon><Calendar /></el-icon>
          {{ formatDate(article.createTime) }}
        </span>
        <span class="views">
          <el-icon><View /></el-icon>
          {{ article.viewCount }} 阅读
        </span>
        <span class="likes">
          <el-icon><Star /></el-icon>
          {{ article.likeCount }} 点赞
        </span>
      </div>
      <div class="article-tags">
        <el-tag
          v-for="tag in article.tags"
          :key="tag"
          size="small"
          type="info"
          effect="plain"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>

    <div class="article-content-wrapper">
      <div class="article-content" ref="contentRef">
        <div class="content-body" v-html="article.htmlContent"></div>
      </div>

      <div class="article-sidebar">
        <div class="toc-wrapper" :class="{ fixed: isTocFixed }">
          <div class="toc-header">目录</div>
          <div class="toc-list">
            <div
              v-for="(heading, index) in headings"
              :key="index"
              class="toc-item"
              :class="{ active: activeHeading === heading.id }"
              :style="{ paddingLeft: (heading.level - 1) * 12 + 'px' }"
              @click="scrollToHeading(heading.id)"
            >
              {{ heading.text }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="article-footer">
      <div class="article-actions">
        <el-button :type="isLiked ? 'primary' : 'default'" @click="handleLike">
          <el-icon><Star /></el-icon>
          {{ isLiked ? '已点赞' : '点赞' }}
        </el-button>
        <el-button @click="handleShare">
          <el-icon><Share /></el-icon>
          分享
        </el-button>
      </div>

      <div class="article-nav">
        <div class="prev" v-if="prevArticle" @click="goToArticle(prevArticle.id)">
          <span class="label">上一篇</span>
          <span class="title">{{ prevArticle.title }}</span>
        </div>
        <div class="next" v-if="nextArticle" @click="goToArticle(nextArticle.id)">
          <span class="label">下一篇</span>
          <span class="title">{{ nextArticle.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useBlogStore } from '@/stores/blog'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const contentRef = ref<HTMLElement>()
const isTocFixed = ref(false)
const activeHeading = ref('')
const isLiked = ref(false)

const article = ref({
  id: '1',
  title: 'Vue 3 组合式 API 最佳实践',
  categoryName: '前端开发',
  tags: ['Vue', 'TypeScript', '前端开发'],
  htmlContent: `
    <h2 id="intro">简介</h2>
    <p>Vue 3 引入了组合式 API，这是一种全新的组件逻辑组织方式。相比选项式 API，组合式 API 提供了更好的代码组织和复用能力。</p>
    
    <h2 id="setup">setup 函数</h2>
    <p>setup 是组合式 API 的入口点，在组件创建之前执行。它接收 props 和 context 作为参数，返回的对象可以在模板中使用。</p>
    
    <h3 id="setup-props">Props</h3>
    <p>setup 函数的第一个参数是 props，它是响应式的，当传入的 props 发生变化时会更新。</p>
    
    <h3 id="setup-context">Context</h3>
    <p>context 是一个普通的 JavaScript 对象，包含 attrs、slots、emit 和 expose 等属性。</p>
    
    <h2 id="reactive">响应式 API</h2>
    <p>Vue 3 提供了多种响应式 API，包括 ref、reactive、computed、watch 等。</p>
    
    <h3 id="ref">ref</h3>
    <p>ref 用于创建一个响应式的引用，可以是任何类型的值。在模板中使用时会自动解包。</p>
    
    <h3 id="reactive-api">reactive</h3>
    <p>reactive 用于创建一个响应式的对象，返回原始对象的 Proxy 代理。</p>
    
    <h2 id="lifecycle">生命周期钩子</h2>
    <p>在 setup 中，生命周期钩子以 on 开头的函数形式使用，如 onMounted、onUpdated 等。</p>
    
    <h2 id="conclusion">总结</h2>
    <p>组合式 API 是 Vue 3 最重要的新特性之一，它提供了更灵活的代码组织方式和更好的逻辑复用能力。掌握组合式 API 是成为 Vue 3 高级开发者的必经之路。</p>
  `,
  viewCount: 256,
  likeCount: 32,
  createTime: '2024-01-15'
})

const headings = ref([
  { id: 'intro', text: '简介', level: 2 },
  { id: 'setup', text: 'setup 函数', level: 2 },
  { id: 'setup-props', text: 'Props', level: 3 },
  { id: 'setup-context', text: 'Context', level: 3 },
  { id: 'reactive', text: '响应式 API', level: 2 },
  { id: 'ref', text: 'ref', level: 3 },
  { id: 'reactive-api', text: 'reactive', level: 3 },
  { id: 'lifecycle', text: '生命周期钩子', level: 2 },
  { id: 'conclusion', text: '总结', level: 2 }
])

const prevArticle = ref({ id: '2', title: 'TypeScript 高级类型技巧' })
const nextArticle = ref({ id: '3', title: 'Element Plus 组件库深度解析' })

function scrollToHeading(id: string) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function handleScroll() {
  if (!contentRef.value) return
  
  const rect = contentRef.value.getBoundingClientRect()
  isTocFixed.value = rect.top < 80

  const headingElements = document.querySelectorAll('.content-body h2, .content-body h3')
  let current = ''
  
  headingElements.forEach((el) => {
    const elRect = el.getBoundingClientRect()
    if (elRect.top < 100) {
      current = el.id
    }
  })
  
  if (current) {
    activeHeading.value = current
  }
}

function handleLike() {
  isLiked.value = !isLiked.value
  if (isLiked.value) {
    article.value.likeCount++
    ElMessage.success('点赞成功')
  } else {
    article.value.likeCount--
  }
}

function handleShare() {
  ElMessage.success('链接已复制到剪贴板')
}

function goToArticle(id: string) {
  router.push(`/article/${id}`)
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  
  // 尝试从 store 获取文章数据
  const articleId = route.params.id as string
  if (articleId) {
    const fetchedArticle = await blogStore.fetchArticleById(articleId)
    if (fetchedArticle) {
      article.value = fetchedArticle
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped lang="scss">
.article-detail {
  max-width: 1000px;
  margin: 0 auto;

  .article-header {
    margin-bottom: 32px;

    .article-title {
      font-size: 32px;
      font-weight: 700;
      color: #303133;
      margin: 0 0 16px;
      line-height: 1.4;
    }

    .article-meta {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 16px;
      font-size: 14px;
      color: #909399;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .article-tags {
      display: flex;
      gap: 8px;
    }
  }

  .article-content-wrapper {
    display: flex;
    gap: 32px;
    margin-bottom: 40px;

    .article-content {
      flex: 1;
      min-width: 0;

      .content-body {
        background: white;
        padding: 32px;
        border-radius: 12px;
        line-height: 1.8;
        font-size: 16px;
        color: #303133;

        :deep(h2) {
          font-size: 24px;
          font-weight: 600;
          margin: 32px 0 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e4e7ed;
        }

        :deep(h3) {
          font-size: 20px;
          font-weight: 600;
          margin: 24px 0 12px;
        }

        :deep(p) {
          margin: 16px 0;
        }

        :deep(code) {
          background: #f5f7fa;
          padding: 2px 8px;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          font-size: 14px;
        }

        :deep(pre) {
          background: #1a1a2e;
          color: #e4e7ed;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;

          code {
            background: transparent;
            padding: 0;
          }
        }
      }
    }

    .article-sidebar {
      width: 200px;
      flex-shrink: 0;

      .toc-wrapper {
        &.fixed {
          position: fixed;
          top: 80px;
        }

        .toc-header {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 12px;
        }

        .toc-list {
          .toc-item {
            font-size: 13px;
            color: #606266;
            padding: 6px 0;
            cursor: pointer;
            transition: color 0.3s ease;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            &:hover,
            &.active {
              color: #667eea;
            }
          }
        }
      }
    }
  }

  .article-footer {
    margin-bottom: 40px;

    .article-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .article-nav {
      display: flex;
      justify-content: space-between;
      gap: 20px;

      .prev,
      .next {
        flex: 1;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        }

        .label {
          font-size: 12px;
          color: #909399;
          display: block;
          margin-bottom: 4px;
        }

        .title {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }
      }

      .next {
        text-align: right;
      }
    }
  }
}
</style>
