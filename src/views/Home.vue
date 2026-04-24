<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">
          记录思考<br />分享成长
        </h1>
        <p class="hero-description">
          专注于前端开发与技术分享，记录学习历程
        </p>
        <div class="hero-actions">
          <el-button type="primary" @click="goToArticles">
            浏览文章
          </el-button>
          <el-button @click="goToAbout">
            了解更多
          </el-button>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-value">{{ stats.articleCount }}</span>
          <span class="stat-label">文章</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.categoryCount }}</span>
          <span class="stat-label">分类</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(stats.viewCount) }}</span>
          <span class="stat-label">浏览</span>
        </div>
      </div>
    </section>

    <!-- Latest Articles -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">最新文章</h2>
        <el-button type="primary" link @click="goToArticles">
          查看全部 →
        </el-button>
      </div>

      <div class="article-grid">
        <article
          v-for="article in recentArticles"
          :key="article.id"
          class="article-card"
          @click="goToArticle(article.id)"
        >
          <div v-if="article.cover" class="article-cover">
            <img :src="article.cover" :alt="article.title" loading="lazy" />
          </div>
          <div class="article-body">
            <div class="article-meta">
              <span class="category">{{ article.categoryName }}</span>
              <span class="dot">·</span>
              <span class="reading-time">{{ getReadingTime(article.content || article.summary) }} 分钟</span>
            </div>
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary }}</p>
            <div class="article-tags" v-if="article.tags?.length">
              <el-tag
                v-for="tag in article.tags.slice(0, 3)"
                :key="tag"
                size="small"
                effect="plain"
                :color="getTagColor(tag)"
                style="color: #ffffff; border: none;"
              >
                {{ tag }}
              </el-tag>
            </div>
            <div class="article-footer">
              <span class="date">{{ formatDate(article.createTime) }}</span>
              <span class="views">{{ article.viewCount }} 阅读</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <!-- Categories -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">分类</h2>
      </div>

      <div class="category-grid">
        <div
          v-for="category in displayCategories"
          :key="category.id"
          class="category-card"
          @click="goToCategory(category.id)"
        >
          <div class="category-icon">
            <el-icon :size="20"><component :is="category.icon" /></el-icon>
          </div>
          <div class="category-info">
            <span class="category-name">{{ category.name }}</span>
            <span class="article-count">{{ category.articleCount }} 篇</span>
          </div>
          <el-icon class="category-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'

const router = useRouter()
const blogStore = useBlogStore()

const stats = ref({
  articleCount: 0,
  categoryCount: 0,
  viewCount: 0
})

const recentArticles = computed(() => blogStore.recentArticles)

const categoryIcons: Record<string, string> = {
  '1': 'Monitor',
  '2': 'DataAnalysis',
  '3': 'Coin',
  '4': 'Setting',
  '5': 'Folder',
  default: 'Folder'
}

const displayCategories = computed(() => {
  return blogStore.categories.map(cat => ({
    ...cat,
    icon: categoryIcons[cat.id] || categoryIcons.default
  }))
})

function formatNumber(num: number): string {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toString()
}

function goToArticles() {
  router.push('/articles')
}

function goToAbout() {
  router.push('/about')
}

function goToArticle(id: string) {
  router.push(`/article/${id}`)
}

function goToCategory(id: string) {
  router.push(`/category/${id}`)
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getReadingTime(content: string): number {
  if (!content) return 1
  const text = content.replace(/<[^>]+>/g, '').replace(/[#*`_\[\]]/g, '')
  return Math.max(1, Math.ceil(text.length / 500))
}

function getTagColor(tagName: string): string {
  const tag = blogStore.tags.find(t => t.name === tagName)
  return tag?.color || 'var(--tag-default-color)'
}

onMounted(async () => {
  await blogStore.fetchArticles({ page: 1, pageSize: 6, sortBy: 'createTime', sortOrder: 'desc' })
  await blogStore.fetchCategories()
  await blogStore.fetchTags()
  stats.value = {
    articleCount: blogStore.articleCount,
    categoryCount: blogStore.categoryCount,
    viewCount: blogStore.articles.reduce((sum, article) => sum + article.viewCount, 0)
  }
})
</script>

<style scoped lang="scss">
.home-page {
  padding-bottom: var(--space-16);
}

// ─── Hero ────────────────────────────────────────────
.hero {
  padding: var(--space-12) 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);

  .hero-content {
    max-width: 600px;

    .hero-title {
      font-size: var(--text-4xl);
      font-weight: 700;
      line-height: 1.2;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      margin-bottom: var(--space-4);
    }

    .hero-description {
      font-size: var(--text-lg);
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: var(--space-6);
    }

    .hero-actions {
      display: flex;
      gap: var(--space-3);
    }
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: var(--space-6);

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .stat-value {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--text-primary);
      font-variant-numeric: tabular-nums;
    }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: var(--border-color);
    }
  }
}

// ─── Section ─────────────────────────────────────────
.section {
  margin-bottom: var(--space-12);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);

    .section-title {
      font-size: var(--text-xl);
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

// ─── Article Grid ────────────────────────────────────
.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-6);

  .article-card {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
    cursor: pointer;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    display: flex;
    flex-direction: column;

    &:hover {
      border-color: var(--border-color-strong);
      box-shadow: var(--shadow-hover);
    }

    .article-cover {
      aspect-ratio: 16 / 9;
      overflow: hidden;
      background: var(--bg-tertiary);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .article-body {
      padding: var(--space-5);
      display: flex;
      flex-direction: column;
      flex: 1;

      .article-meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-sm);
        color: var(--text-tertiary);
        margin-bottom: var(--space-3);

        .category {
          color: var(--link-color);
        }

        .dot {
          color: var(--border-color-strong);
        }
      }

      .article-title {
        font-size: var(--text-base);
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .article-summary {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        min-height: 40px;
        flex-shrink: 0;
      }

      .article-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
        margin-top: auto;
        padding-top: var(--space-3);
      }

      .article-footer {
        display: flex;
        justify-content: space-between;
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin-top: var(--space-3);
        padding-top: var(--space-3);
        border-top: 1px solid var(--border-color);
      }
    }
  }
}

// ─── Category Grid ───────────────────────────────────
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);

  .category-card {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-5);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: border-color var(--transition-fast), background-color var(--transition-fast);

    &:hover {
      border-color: var(--border-color-strong);
      background: var(--bg-hover);
    }

    .category-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-tertiary);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
    }

    .category-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;

      .category-name {
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .article-count {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
      }
    }

    .category-arrow {
      color: var(--text-tertiary);
      transition: transform var(--transition-fast);
    }

    &:hover .category-arrow {
      transform: translateX(2px);
    }
  }
}

// ─── Responsive ──────────────────────────────────────
@media (max-width: 768px) {
  .hero {
    padding: var(--space-8) 0;

    .hero-title {
      font-size: var(--text-3xl);
    }

    .hero-stats {
      gap: var(--space-4);
    }
  }

  .article-grid {
    grid-template-columns: 1fr;
  }
}
</style>
