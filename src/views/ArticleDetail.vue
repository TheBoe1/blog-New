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
		  :color="getTagColor(article, tag)" style="color: #ffffff;"
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
        <div class="content-body">
          <MdPreview
            v-if="isMarkdown"
            :modelValue="articleContent"
            :theme="theme"
            previewTheme="github"
            codeTheme="github"
          />
          <div v-else v-html="article.htmlContent"></div>
        </div>
      </div>

      <div class="article-sidebar">
        <div class="toc-wrapper" :class="{ fixed: isTocFixed }">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { useBlogStore } from '@/stores/blog'
import { isHtmlContent, htmlToMarkdown } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const contentRef = ref<HTMLElement>()
const isTocFixed = ref(false)
const activeHeading = ref('')
const isLiked = ref(false)
const theme = ref('light')

const article = ref({
  id: '1',
  title: 'Vue 3 组合式 API 最佳实践',
  categoryName: '前端开发',
  tags: ['Vue', 'TypeScript', '前端开发'],
  htmlContent: '',
  markdownContent: '',
  content: '',
  contentType: 'html',
  viewCount: 256,
  likeCount: 32,
  createTime: '2024-01-15'
})

const isMarkdown = computed(() => {
  return article.value.contentType === 'markdown' || 
         (article.value.markdownContent && article.value.markdownContent.trim()) ||
         (article.value.content && !isHtmlContent(article.value.content))
})

const articleContent = computed(() => {
  if (article.value.markdownContent && article.value.markdownContent.trim()) {
    return article.value.markdownContent
  }
  if (article.value.content && !isHtmlContent(article.value.content)) {
    return article.value.content
  }
  if (article.value.htmlContent && isHtmlContent(article.value.htmlContent)) {
    return htmlToMarkdown(article.value.htmlContent)
  }
  return ''
})

const headings = computed(() => {
  const result: Array<{ id: string; text: string; level: number }> = []
  
  if (isMarkdown.value && articleContent.value) {
    const lines = articleContent.value.split('\n')
    lines.forEach(line => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const text = match[2].trim()
        const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '')
        result.push({ id, text, level })
      }
    })
  } else if (article.value.htmlContent) {
    const regex = /<h([2-3])[^>]*id=["']([^"']+)["'][^>]*>(.*?)<\/h\1>/g
    let match
    while ((match = regex.exec(article.value.htmlContent)) !== null) {
      result.push({
        level: parseInt(match[1]),
        id: match[2],
        text: match[3].replace(/<[^>]+>/g, '')
      })
    }
  }
  
  return result
})
function getTagColor(article: any, tagName: string): string {
  if (article.tagColor && article.tagColor[tagName]) {
    return article.tagColor[tagName]
  }
  return 'var(--tag-default-color)'
}
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

  const headingElements = document.querySelectorAll('.content-body h2, .content-body h3, .md-preview h2, .md-preview h3')
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
  
  const articleId = route.params.id as string
  if (articleId) {
    const fetchedArticle = await blogStore.fetchArticleById(articleId)
    if (fetchedArticle) {
      article.value = {
        ...fetchedArticle,
        contentType: (fetchedArticle as any).contentType || 'html'
      }
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
        
        :deep(.md-preview) {
          background: transparent;
          padding: 0;
        }
        
        :deep(.md-preview-content) {
          padding: 0;
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
