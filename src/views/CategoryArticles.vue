<template>
  <div class="category-articles-page">
    <BlogLayout3Col>
      <div class="card">
        <div class="card-content">
          <header class="category-header">
            <h1 class="category-title">{{ category.name }}</h1>
            <p v-if="category.description" class="category-desc">{{ category.description }}</p>
            <p class="category-stats">
              <i class="i-ep-folder-opened category-icon" aria-hidden="true"></i>
              共 {{ total }} 篇文章
            </p>
          </header>
        </div>
      </div>

      <div v-if="!articles.length && !loading" class="card empty-card">
        <div class="card-content">
          <p class="empty-text">该分类下暂无文章</p>
        </div>
      </div>

      <article
        v-for="article in articles"
        :key="article.id"
        class="card article-card stagger-item"
        @click="goToArticle(article.slug || article.id)"
      >
        <div class="card-content">
          <h2 class="article-title">
            <router-link :to="`/article/${article.slug || article.id}`">
              <i class="i-mdi-chevron-double-right article-title-icon" aria-hidden="true"></i>{{ article.title }}
            </router-link>
          </h2>
          <div class="article-meta">
            <span class="meta-item">
              <i class="i-ep-calendar meta-icon" aria-hidden="true"></i>
              <time>{{ formatDate(article.createTime) }}</time>
            </span>
            <span v-if="article.categoryName" class="meta-item">
              <router-link :to="`/category/${article.categoryId}`" class="meta-link">
                {{ article.categoryName }}
              </router-link>
            </span>
            <span class="meta-item">
              <i class="i-ep-view meta-icon" aria-hidden="true"></i>
              {{ article.viewCount }} 阅读
            </span>
          </div>
          <div v-if="article.summary" class="article-content">
            <p>{{ article.summary }}</p>
          </div>
        </div>
      </article>

      <nav v-if="total > pageSize" class="pagination stagger-item">
        <el-pagination
          v-model:current-page="currentPage"
          :total="total"
          :page-size="pageSize"
          layout="prev, pager, next"
          background
          @current-change="handlePageChange"
        />
      </nav>
    </BlogLayout3Col>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import BlogLayout3Col from '@/components/BlogLayout3Col.vue'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const pageSize = 10
const loading = ref(false)

const category = ref<any>({
  id: '',
  name: '加载中...',
  description: '',
  articleCount: 0
})
const articles = ref<any[]>([])
const currentPage = ref(1)
const total = ref(0)

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}

function goToArticle(identifier: string) {
  router.push(`/article/${identifier}`)
}

function handlePageChange() {
  fetchArticles()
}

async function fetchArticles() {
  const categoryId = route.params.id as string
  loading.value = true
  try {
    if (blogStore.categories.length === 0) {
      await blogStore.fetchCategories()
    }

    const foundCategory = blogStore.categories.find(cat => cat.id === categoryId)
    if (foundCategory) {
      category.value = foundCategory
    } else {
      category.value = {
        id: categoryId,
        name: '未知分类',
        description: '',
        articleCount: 0
      }
    }

    await blogStore.fetchArticles({ categoryId, page: currentPage.value, pageSize })
    articles.value = blogStore.articles
    total.value = blogStore.total || blogStore.articles.length
  } catch (error) {
    console.error('Failed to fetch category articles:', error)
  } finally {
    loading.value = false
  }
}

watch(() => route.params.id, () => {
  currentPage.value = 1
  fetchArticles()
})

onMounted(async () => {
  await fetchArticles()
})
</script>

<style scoped lang="scss">
.category-articles-page {
  padding-bottom: var(--space-12);
}

.card {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  color: var(--text-secondary);
  overflow: hidden;
  cursor: default;
}

.card + .card {
  margin-top: var(--space-6);
}

.card-content {
  padding: var(--space-6);
}

.article-card {
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

.category-header {
  .category-title {
    position: relative;
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: var(--space-2);
    padding-bottom: var(--space-3);

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: linear-gradient(90deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 30%, transparent) 100%);
      border-radius: 2px;
    }
  }

  .category-desc {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-2);
  }

  .category-stats {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;

    .category-icon {
      margin-right: 4px;
      opacity: 0.7;
    }
  }
}

.empty-card .empty-text {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-tertiary);
}

.article-title {
  position: relative;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  font-family: 'Ubuntu', 'PingFang SC', 'Noto Sans SC', sans-serif;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 30%, transparent) 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 100%;
  }

  a {
    color: var(--text-primary);
    text-decoration: none;
    transition: color 0.3s ease;

    .article-title-icon {
      display: inline-block;
      margin-right: var(--space-2);
      color: var(--brand-primary);
      font-size: 0.85em;
      transition: transform 0.3s ease, color 0.3s ease;
    }

    &:hover {
      color: var(--brand-primary);

      .article-title-icon {
        transform: translateX(5px);
      }
    }
  }
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-4);

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .meta-icon {
      opacity: 0.7;
      transition: transform 0.3s ease, color 0.3s ease;
    }

    &:hover .meta-icon {
      transform: rotate(360deg);
      color: var(--brand-primary);
      opacity: 1;
    }
  }

  .meta-link {
    color: var(--text-tertiary);
    text-decoration: none;
    &:hover { color: var(--brand-primary); }
  }
}

.article-content {
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: var(--text-secondary);

  p {
    margin-bottom: var(--space-3);
  }
}

.pagination {
  margin-top: var(--space-6);
  display: flex;
  justify-content: center;
}

@media (prefers-reduced-motion: reduce) {
  .article-card,
  .article-title::after,
  .article-title a,
  .article-title-icon,
  .meta-icon {
    transition: none !important;
    transform: none !important;
    animation: none !important;
  }
}
</style>
