<template>
  <div class="articles-page">
    <BlogLayout3Col>
      <!-- Filter chips (top, single row) -->
      <div class="filter-bar">
        <div class="filter-chips">
          <button
            class="filter-chip"
            :class="{ active: !selectedCategory }"
            @click="selectedCategory = ''; fetchArticles()"
          >
            全部
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="filter-chip"
            :class="{ active: selectedCategory === cat.id }"
            @click="selectedCategory = cat.id; fetchArticles()"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Skeleton during loading -->
      <div v-if="loading && groupedArticles.length === 0" class="card">
        <div class="card-content">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="rect" style="width: 64px; height: 28px; border-radius: 4px; margin-bottom: 20px;" />
              <div v-for="i in 7" :key="i" class="timeline-skeleton-row">
                <el-skeleton-item variant="text" style="width: 80px; flex-shrink: 0;" />
                <el-skeleton-item variant="text" style="flex: 1;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="groupedArticles.length === 0 && !loading" class="empty-state">
        <p class="empty-text">{{ isSearchResult ? '未找到相关文章' : '暂无文章' }}</p>
        <div class="empty-actions">
          <button v-if="isSearchResult || selectedCategory" class="btn-text" @click="clearFilters">
            清除筛选
          </button>
        </div>
      </div>

      <!-- Timeline grouped by year (lexburner signature) -->
      <div v-for="group in groupedArticles" :key="group.year" class="card">
        <div class="card-content">
          <h3 class="archive-year-tag">{{ group.year }}</h3>
          <div class="timeline">
            <article v-for="article in group.articles" :key="article.id" class="timeline-item">
              <div class="timeline-content">
                <p class="timeline-date">{{ formatDate(article.createTime) }}</p>
                <p class="timeline-title">
                  <router-link :to="`/article/${article.slug || article.id}`" v-html="highlightText(article.title, searchKeyword)" />
                </p>
                <p v-if="article.categoryName" class="timeline-category">
                  <router-link :to="`/category/${article.categoryId}`">{{ article.categoryName }}</router-link>
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </BlogLayout3Col>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { highlightText } from '@/utils/highlight'
import type { Article } from '@/types'
import BlogLayout3Col from '@/components/BlogLayout3Col.vue'

const router = useRouter()
const route = useRoute()
const blogStore = useBlogStore()

const selectedCategory = ref('')
const loading = ref(true)
const allArticles = ref<Article[]>([])

const categories = ref<Array<{ id: string; name: string }>>([])

const searchKeyword = computed(() => (route.query.keyword as string) || '')
const isSearchResult = computed(() => !!route.query.keyword)

const groupedArticles = computed(() => {
  const map = new Map<number, Article[]>()
  for (const article of allArticles.value) {
    const year = new Date(article.createTime).getFullYear()
    if (!map.has(year)) map.set(year, [])
    map.get(year)!.push(article)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, articles]) => ({
      year,
      articles: articles.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    }))
})

function clearFilters() {
  selectedCategory.value = ''
  router.push({ path: '/articles', query: {} })
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}

async function fetchArticles() {
  loading.value = true
  try {
    const params: any = {
      page: 1,
      pageSize: 999,
      sortBy: 'createTime',
      sortOrder: 'desc'
    }
    if (selectedCategory.value) params.categoryId = selectedCategory.value
    if (searchKeyword.value) params.keyword = searchKeyword.value

    await blogStore.fetchArticles(params)
    allArticles.value = blogStore.articles
  } catch (error) {
    console.error('Failed to fetch articles:', error)
    allArticles.value = []
  } finally {
    loading.value = false
  }
}

async function fetchCategories() {
  if (blogStore.categories.length === 0) {
    await blogStore.fetchCategories()
  }
  categories.value = blogStore.categories
}

onMounted(async () => {
  await fetchCategories()
  if (route.query.categoryId) {
    selectedCategory.value = route.query.categoryId as string
  }
  await fetchArticles()
})

watch(
  () => route.query,
  () => {
    fetchArticles()
  }
)
</script>

<style scoped lang="scss">
.articles-page {
  padding-bottom: var(--space-12);
}

// ─── Filter chips ───────────────────────────────────────
.filter-bar {
  margin-bottom: var(--space-6);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.filter-chips {
  display: flex;
  gap: var(--space-2);
  padding-bottom: var(--space-1);
}

.filter-chip {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
    transform: translateY(-1px);
  }

  &.active {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: var(--text-on-brand);
  }
}

// ─── Empty state ────────────────────────────────────────
.empty-state {
  text-align: center;
  padding: var(--space-12) 0;

  .empty-text {
    color: var(--text-tertiary);
    margin-bottom: var(--space-3);
  }

  .btn-text {
    background: none;
    border: none;
    color: var(--brand-primary);
    cursor: pointer;
    font-size: var(--font-size-sm);
    text-decoration: underline;

    &:hover {
      color: var(--brand-primary-hover);
    }
  }
}

// ─── Card ───────────────────────────────────────────────
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.card + .card {
  margin-top: var(--space-6);
}

.card-content {
  padding: var(--space-6);
}

.timeline-skeleton-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) 0;
}

// ─── Year tag ───────────────────────────────────────────
.archive-year-tag {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  background: var(--brand-primary);
  color: var(--text-on-brand);
  font-size: var(--font-size-base);
  font-weight: 600;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-4);
}

// ─── Timeline (lexburner signature: left border + dots) ──
.timeline {
  margin-left: 1rem;
  padding: 1rem 0 0 1.5rem;
  border-left: 1px solid var(--border-color);
}

.timeline-item {
  position: relative;
  padding: var(--space-2) 0;

  // Dot on the timeline (12px gray circle on the left border)
  &::before {
    content: '';
    position: absolute;
    left: calc(-0.375rem - 1.5rem - 0.25px);
    top: 1.25rem;
    width: 0.75rem;
    height: 0.75rem;
    background: var(--border-color);
    border-radius: 50%;
    transition: background 0.3s ease, transform 0.3s ease;
  }

  // Cover the tail of the timeline after the last item
  &:last-child::after {
    content: '';
    position: absolute;
    left: calc(-0.375rem - 1.5rem - 0.25px);
    top: calc(1.25rem + 0.75rem);
    bottom: -1rem;
    width: 0.75rem;
    background: var(--bg-primary);
  }

  &:hover::before {
    background: var(--brand-primary);
    transform: scale(1.2);
  }
}

.timeline-content {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--space-3);
}

.timeline-date {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  font-family: 'Source Code Pro', 'Consolas', monospace;
  flex-shrink: 0;
  min-width: 5.5rem;
}

.timeline-title {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-base);
  font-weight: 500;
  line-height: 1.5;

  a {
    color: var(--text-primary);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: var(--brand-primary);
    }

    :deep(mark) {
      background-color: rgba(255, 220, 0, 0.3);
      padding: 1px 3px;
      border-radius: 2px;
      color: inherit;
    }
  }
}

.timeline-category {
  flex-shrink: 0;
  font-size: var(--font-size-xs);

  a {
    color: var(--text-tertiary);
    text-decoration: none;
    transition: color 0.3s ease;

    &:hover {
      color: var(--brand-primary);
    }
  }
}

// ─── Responsive ─────────────────────────────────────────
@media (max-width: 768px) {
  .timeline {
    margin-left: 0;
    padding-left: 1.25rem;
  }

  .timeline-item::before {
    left: calc(-0.375rem - 1.25rem - 0.25px);
  }

  .timeline-item:last-child::after {
    left: calc(-0.375rem - 1.25rem - 0.25px);
  }

  .timeline-content {
    flex-direction: column;
    gap: var(--space-1);
  }

  .timeline-date {
    min-width: 0;
  }
}

// ─── Reduced motion ─────────────────────────────────────
@media (prefers-reduced-motion: reduce) {
  .filter-chip,
  .timeline-item::before,
  .timeline-title a,
  .timeline-category a {
    transition: none !important;
    transform: none !important;
  }
}
</style>
