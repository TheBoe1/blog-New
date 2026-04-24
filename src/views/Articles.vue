<template>
  <div class="articles-page">
    <div class="page-header">
      <h1>文章列表</h1>
      <div class="filter-area">
        <el-select
          v-model="selectedCategory"
          placeholder="全部分类"
          clearable
          style="width: 140px"
          @change="handleCategoryChange"
        >
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
      </div>
    </div>

    <div class="articles-content">
      <div class="articles-main">
        <!-- Empty State -->
        <div v-if="articles.length === 0 && !loading" class="empty-state">
          <p class="empty-text">{{ isSearchResult ? '未找到相关文章' : '暂无文章' }}</p>
          <div class="empty-actions">
            <el-button v-if="isSearchResult || hasActiveFilters" @click="clearFilters">
              清除筛选
            </el-button>
          </div>
        </div>

        <div class="article-list">
          <article
            v-for="article in articles"
            :key="article.id"
            class="article-item"
            @click="goToArticle(article.id)"
          >
            <div v-if="article.cover" class="article-cover">
              <img :src="article.cover" :alt="article.title" loading="lazy" />
            </div>
            <div class="article-info">
              <div class="article-meta">
                <span class="category">{{ article.categoryName }}</span>
                <span class="date">{{ formatDate(article.createTime) }}</span>
              </div>
              <h3 class="article-title" v-html="highlightText(article.title, searchKeyword)"></h3>
              <p class="article-summary" v-html="highlightText(article.summary, searchKeyword)"></p>
              <div class="article-footer">
                <div class="tags">
                  <el-tag
                    v-for="tag in (article.tags || []).slice(0, 3)"
                    :key="tag"
                    size="small"
                    effect="plain"
                    :color="getTagColor(tag)"
                    style="color: #ffffff; border: none;"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="stats">
                  <span>{{ article.viewCount }} 阅读</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-if="total > pageSize" class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <aside class="articles-sidebar">
        <div class="sidebar-section">
          <h3 class="sidebar-title">归档</h3>
          <div v-if="archives.length === 0" class="sidebar-empty">暂无归档</div>
          <div v-else class="archive-list">
            <div
              v-for="archive in archives"
              :key="archive.year"
              class="archive-item"
              :class="{ active: selectedYear === archive.year }"
              @click="handleSelectYear(archive.year)"
            >
              <span class="year">{{ archive.year }}年</span>
              <span class="count">{{ archive.count }}篇</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section">
          <h3 class="sidebar-title">标签</h3>
          <div v-if="hotTags.length === 0" class="sidebar-empty">暂无标签</div>
          <div v-else class="tag-list">
            <el-tag
              v-for="tag in hotTags"
              :key="tag.name"
              size="small"
              effect="plain"
              class="tag-item"
              :class="{ active: selectedTag === tag.name }"
              @click="handleSelectTag(tag.name)"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { articleApi } from '@/api'
import { highlightText } from '@/utils/highlight'

const router = useRouter()
const route = useRoute()
const blogStore = useBlogStore()

const selectedCategory = ref('')
const selectedYear = ref<number | null>(null)
const selectedTag = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const loading = ref(false)

const searchKeyword = computed(() => (route.query.keyword as string) || '')
const isSearchResult = computed(() => !!route.query.keyword)
const hasActiveFilters = computed(() => !!selectedCategory.value || !!selectedYear.value || !!selectedTag.value)

function clearFilters() {
  selectedCategory.value = ''
  selectedYear.value = null
  selectedTag.value = null
  currentPage.value = 1
  router.push({ path: '/articles', query: {} })
}

const categories = ref<Array<{ id: string; name: string }>>([])
const articles = ref<any[]>([])
const archives = ref<{ year: number; count: number }[]>([])
const hotTags = ref([
  { name: 'Vue' },
  { name: 'TypeScript' },
  { name: 'Vite' }
])

function getTagColor(tagName: string): string {
  const tag = blogStore.tags.find(t => t.name === tagName)
  return tag?.color || 'var(--tag-default-color)'
}

function goToArticle(id: string) {
  router.push(`/article/${id}`)
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function handlePageChange() {
  fetchArticles()
}

function handleCategoryChange() {
  currentPage.value = 1
  fetchArticles()
}

function handleSelectYear(year: number) {
  selectedYear.value = selectedYear.value === year ? null : year
  currentPage.value = 1
  fetchArticles()
}

function handleSelectTag(tag: string) {
  selectedTag.value = selectedTag.value === tag ? null : tag
  currentPage.value = 1
  fetchArticles()
}

async function fetchArticles() {
  loading.value = true
  try {
    const queryParams: any = {
      page: currentPage.value,
      pageSize
    }
    if (selectedCategory.value) queryParams.categoryId = selectedCategory.value
    if (selectedYear.value) queryParams.year = selectedYear.value

    await blogStore.fetchArticles(queryParams)
    articles.value = blogStore.articles
    total.value = blogStore.articleCount
  } catch (error) {
    console.error('Failed to fetch articles:', error)
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

async function fetchArchives() {
  try {
    const archiveData = await articleApi.getArchive()
    if (!archiveData) {
      archives.value = []
      return
    }
    const yearMap = new Map<number, number>()

    if (Array.isArray(archiveData)) {
      for (const item of archiveData) {
        if (item.month && typeof item.month === 'string' && item.month.includes('-')) {
          const year = parseInt(item.month.split('-')[0])
          if (!isNaN(year)) {
            yearMap.set(year, (yearMap.get(year) || 0) + (item.count || 0))
          }
        }
      }
    } else if (typeof archiveData === 'object') {
      for (const [month, count] of Object.entries(archiveData)) {
        if (month.includes('-')) {
          const year = parseInt(month.split('-')[0])
          if (!isNaN(year)) {
            yearMap.set(year, (yearMap.get(year) || 0) + (count as number || 0))
          }
        }
      }
    }

    archives.value = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => b.year - a.year)
  } catch (error) {
    console.error('Failed to fetch archives:', error)
    archives.value = []
  }
}

onMounted(async () => {
  await fetchCategories()
  await blogStore.fetchTags()
  await fetchArchives()

  if (route.query.categoryId) {
    selectedCategory.value = route.query.categoryId as string
  }

  await fetchArticles()
})

watch(
  () => route.query,
  (newQuery) => {
    if (newQuery.categoryId !== selectedCategory.value) {
      selectedCategory.value = newQuery.categoryId as string || ''
    }
    fetchArticles()
  }
)
</script>

<style scoped lang="scss">
.articles-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-8);

    h1 {
      font-size: var(--text-2xl);
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.articles-content {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: var(--space-8);
}

.articles-main {
  min-width: 0;
}

// ─── Empty State ─────────────────────────────────────
.empty-state {
  padding: var(--space-16) 0;
  text-align: center;

  .empty-text {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-4);
  }
}

// ─── Article List ────────────────────────────────────
.article-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  .article-item {
    display: flex;
    gap: var(--space-5);
    padding: var(--space-5);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: border-color var(--transition-fast);

    &:hover {
      border-color: var(--border-color-strong);
    }

    .article-cover {
      width: 160px;
      height: 100px;
      flex-shrink: 0;
      border-radius: var(--radius-md);
      overflow: hidden;
      background: var(--bg-tertiary);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .article-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .article-meta {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: var(--text-sm);
        color: var(--text-tertiary);
        margin-bottom: var(--space-2);

        .category {
          color: var(--link-color);
        }
      }

      .article-title {
        font-size: var(--text-base);
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: var(--space-2);
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 1;
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
        flex: 1;
      }

      .article-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--space-3);

        .tags {
          display: flex;
          gap: var(--space-2);
        }

        .stats {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }
      }
    }
  }
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: var(--space-8);
}

// ─── Sidebar ─────────────────────────────────────────
.articles-sidebar {
  .sidebar-section {
    margin-bottom: var(--space-6);

    .sidebar-title {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-empty {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }
  }

  .archive-list {
    .archive-item {
      display: flex;
      justify-content: space-between;
      padding: var(--space-2) 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: color var(--transition-fast);

      &:hover,
      &.active {
        color: var(--link-color);
      }
    }
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);

    .tag-item {
      cursor: pointer;
      transition: border-color var(--transition-fast), color var(--transition-fast);

      &:hover,
      &.active {
        border-color: var(--link-color);
        color: var(--link-color);
      }
    }
  }
}

// ─── Responsive ──────────────────────────────────────
@media (max-width: 900px) {
  .articles-content {
    grid-template-columns: 1fr;
  }

  .articles-sidebar {
    display: none;
  }
}

@media (max-width: 640px) {
  .article-list .article-item {
    flex-direction: column;

    .article-cover {
      width: 100%;
      height: 160px;
    }
  }
}
</style>
