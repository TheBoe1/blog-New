<template>
  <article class="article-detail">
    <header class="article-header">
      <h1 class="article-title">{{ article.title }}</h1>
      <div class="article-meta">
        <span class="category">{{ article.categoryName }}</span>
        <span class="dot">·</span>
        <span class="date">{{ formatDate(article.createTime) }}</span>
        <span class="dot">·</span>
        <span class="reading-time">{{ readingTime }} 分钟阅读</span>
      </div>
      <div class="article-tags">
        <el-tag
          v-for="tag in article.tags"
          :key="tag"
          size="small"
          effect="plain"
          :color="getTagColor(tag)"
          style="color: #ffffff; border: none;"
        >
          {{ tag }}
        </el-tag>
      </div>
    </header>

    <div class="article-content">
      <MdPreview
        v-if="isMarkdown"
        :modelValue="articleContent"
        :theme="theme"
        previewTheme="github"
        codeTheme="github"
      />
      <div v-else v-html="article.htmlContent"></div>
    </div>

    <footer class="article-footer">
      <div class="article-actions">
        <el-button @click="handleLike">
          <el-icon><Star /></el-icon>
          {{ isLiked ? '已点赞' : '点赞' }}
        </el-button>
        <el-button @click="handleShare">
          <el-icon><Share /></el-icon>
          分享
        </el-button>
      </div>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { useBlogStore } from '@/stores/blog'
import { isHtmlContent, htmlToMarkdown } from '@/utils/markdown'

const route = useRoute()
const blogStore = useBlogStore()

const isLiked = ref(false)
const theme = ref('light')

const article = ref<any>({
  id: '',
  title: '',
  categoryName: '',
  tags: [],
  htmlContent: '',
  markdownContent: '',
  content: '',
  contentType: 'html',
  createTime: ''
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

const readingTime = computed(() => {
  const content = articleContent.value || article.value.summary || ''
  const text = content.replace(/<[^>]+>/g, '').replace(/[#*`_\[\]]/g, '')
  return Math.max(1, Math.ceil(text.length / 500))
})

function getTagColor(tagName: string): string {
  const tag = blogStore.tags.find(t => t.name === tagName)
  return tag?.color || 'var(--tag-default-color)'
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function handleLike() {
  isLiked.value = !isLiked.value
  ElMessage.success(isLiked.value ? '感谢点赞' : '已取消点赞')
}

function handleShare() {
  navigator.clipboard.writeText(window.location.href)
  ElMessage.success('链接已复制')
}

onMounted(async () => {
  await blogStore.fetchTags()
  const articleId = route.params.id as string
  if (articleId) {
    const fetchedArticle = await blogStore.fetchArticleById(articleId)
    if (fetchedArticle) {
      article.value = {
        ...fetchedArticle,
        contentType: fetchedArticle.contentType || 'html'
      }
    }
  }
})
</script>

<style scoped lang="scss">
.article-detail {
  max-width: var(--article-max-width);
  margin: 0 auto;
  padding-bottom: var(--space-16);
}

.article-header {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-color);

  .article-title {
    font-size: var(--text-3xl);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin-bottom: var(--space-4);
  }

  .article-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-4);

    .category {
      color: var(--link-color);
    }

    .dot {
      color: var(--border-color-strong);
    }
  }

  .article-tags {
    display: flex;
    gap: var(--space-2);
  }
}

.article-content {
  font-size: var(--text-base);
  line-height: 1.8;
  color: var(--text-primary);

  :deep(h2) {
    font-size: var(--text-xl);
    font-weight: 600;
    margin: var(--space-8) 0 var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-color);
  }

  :deep(h3) {
    font-size: var(--text-lg);
    font-weight: 600;
    margin: var(--space-6) 0 var(--space-3);
  }

  :deep(p) {
    margin: var(--space-4) 0;
  }

  :deep(code) {
    font-family: 'Fira Code', 'SF Mono', Consolas, monospace;
    font-size: 0.9em;
    background: var(--bg-tertiary);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
  }

  :deep(pre) {
    margin: var(--space-4) 0;
    padding: var(--space-4);
    background: #1e1e1e;
    border-radius: var(--radius-lg);
    overflow-x: auto;

    code {
      background: transparent;
      padding: 0;
      color: #d4d4d4;
      font-size: var(--text-sm);
    }
  }

  :deep(blockquote) {
    margin: var(--space-4) 0;
    padding: var(--space-4);
    border-left: 3px solid var(--border-color-strong);
    background: var(--bg-secondary);
    color: var(--text-secondary);
  }

  :deep(img) {
    max-width: 100%;
    border-radius: var(--radius-md);
  }

  :deep(ul),
  :deep(ol) {
    margin: var(--space-4) 0;
    padding-left: var(--space-6);
  }

  :deep(li) {
    margin: var(--space-2) 0;
  }
}

.article-footer {
  margin-top: var(--space-12);
  padding-top: var(--space-6);
  border-top: 1px solid var(--border-color);

  .article-actions {
    display: flex;
    gap: var(--space-3);
  }
}
</style>
