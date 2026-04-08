<template>
  <div class="articles-page">
    <div class="page-header">
      <h1>文章列表</h1>
      <div class="filter-area">
        <el-select v-model="selectedCategory" placeholder="选择分类" clearable style="width: 150px" @change="handleCategoryChange">
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
        <div class="article-list">
          <div
            v-for="article in articles"
            :key="article.id"
            class="article-item"
            @click="goToArticle(article.id)"
          >
            <div class="article-cover" v-if="article.cover">
              <img :src="article.cover" :alt="article.title" />
            </div>
            <div class="article-info">
              <div class="article-meta-top">
                <el-tag size="small" effect="plain">{{ article.categoryName }}</el-tag>
                <span class="article-date">{{ formatDate(article.createTime) }}</span>
              </div>
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-summary">{{ article.summary }}</p>
              <div class="article-meta-bottom">
                <div class="tags">
                  <el-tag
                    v-for="tag in (article.tags || []).slice(0, 3)"
                    :key="tag"
                    size="small"
                    type="info"
					:color="getTagColor(article, tag)" style="color: #ffffff;"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="stats">
                  <span><el-icon><View /></el-icon> {{ article.viewCount }}</span>
                  <span><el-icon><Star /></el-icon> {{ article.likeCount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination-area">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="10"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <div class="articles-sidebar">
        <el-card shadow="never" class="sidebar-card">
          <template #header>
            <span>文章归档</span>
          </template>
          <div class="archive-list">
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
        </el-card>

        <el-card shadow="never" class="sidebar-card">
          <template #header>
            <span>热门标签</span>
          </template>
          <div class="tag-cloud">
            <el-tag
              v-for="tag in hotTags"
              :key="tag.name"
              :type="tag.type"
              class="tag-item"
              @click="handleSelectTag(tag.name)"
            >
              {{ tag.name }}
            </el-tag>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { articleApi } from '@/api'

const router = useRouter()
const route = useRoute()
const blogStore = useBlogStore()

const selectedCategory = ref('')
const selectedYear = ref<number | null>(null)
const currentPage = ref(1)
const total = ref(0)

const categories = ref([])
const articles = ref([])
const archives = ref<{year: number; count: number}[]>([])
const hotTags = ref([
  { name: 'Vue', type: '' },
  { name: 'TypeScript', type: 'success' },
  { name: 'Element Plus', type: 'info' },
  { name: 'Vite', type: 'warning' },
  { name: 'Pinia', type: 'danger' }
])

function goToArticle(id: string) {
  router.push(`/article/${id}`)
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
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
  currentPage.value = 1
  fetchArticles()
}

async function fetchArticles() {
  try {
    const queryParams: any = {
      categoryId: selectedCategory.value || undefined,
      year: selectedYear.value || undefined,
      page: currentPage.value,
      pageSize: 10
    }
    
    await blogStore.fetchArticles(queryParams)
    articles.value = blogStore.articles
    total.value = blogStore.articles.length
  } catch (error) {
    console.error('Failed to fetch articles:', error)
  }
}

async function fetchCategories() {
  if (blogStore.categories.length === 0) {
    await blogStore.fetchCategories()
  }
  categories.value = blogStore.categories
}
function getTagColor(article: any, tagName: string): string {
  // 1. 检查 article.tagColor 是否存在
  // 2. 检查该标签名是否在 tagColor 中有定义
  if (article.tagColor && article.tagColor[tagName]) {
    return article.tagColor[tagName]
  }
  
  // 3. 兜底：如果后端没给颜色，返回 Element Plus 的默认 Tag 颜色或自定义默认色
  return '#409eff' 
}
async function fetchArchives() {
  try {
    const archiveData = await articleApi.getArchive()
    if (!archiveData) {
      archives.value = []
      return
    }
    const result: {year: number; count: number}[] = []
    const yearMap = new Map<number, number>()
    
    if (Array.isArray(archiveData)) {
      for (const item of archiveData) {
        if (item.month && typeof item.month === 'string' && item.month.includes('-')) {
          const year = parseInt(item.month.split('-')[0])
          if (!isNaN(year)) {
            const total = yearMap.get(year) || 0
            yearMap.set(year, total + (item.count || 0))
          }
        }
      }
    } else if (typeof archiveData === 'object') {
      for (const [month, count] of Object.entries(archiveData)) {
        if (month && typeof month === 'string' && month.includes('-')) {
          const year = parseInt(month.split('-')[0])
          if (!isNaN(year)) {
            const total = yearMap.get(year) || 0
            yearMap.set(year, total + (count as number || 0))
          }
        }
      }
    }
    
    for (const [year, count] of yearMap.entries()) {
      result.push({ year, count })
    }
    result.sort((a, b) => b.year - a.year)
    archives.value = result
  } catch (error) {
    console.error('Failed to fetch archives:', error)
    archives.value = []
  }
}

onMounted(async () => {
  await fetchCategories()
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
    margin-bottom: 24px;

    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .filter-area {
      display: flex;
      gap: 12px;
    }
  }

  .articles-content {
    display: flex;
    gap: 24px;

    .articles-main {
      flex: 1;
      min-width: 0;

      .article-list {
        display: flex;
        flex-direction: column;
        gap: 20px;

        .article-item {
          display: flex;
          gap: 20px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #e4e7ed;

          &:hover {
            border-color: #667eea;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
          }

          .article-cover {
            width: 200px;
            height: 140px;
            border-radius: 8px;
            overflow: hidden;
            background: #f5f7fa;
            flex-shrink: 0;

            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
          }

          .article-info {
            flex: 1;
            display: flex;
            flex-direction: column;

            .article-meta-top {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;

              .article-date {
                font-size: 13px;
                color: #909399;
              }
            }

            .article-title {
              font-size: 18px;
              font-weight: 600;
              color: #303133;
              margin: 0 0 8px;
              transition: color 0.3s ease;

              &:hover {
                color: #667eea;
              }
            }

            .article-summary {
              font-size: 14px;
              color: #606266;
              line-height: 1.6;
              margin: 0 0 auto;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            .article-meta-bottom {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 12px;

              .tags {
                display: flex;
                gap: 8px;
              }

              .stats {
                display: flex;
                gap: 16px;
                font-size: 13px;
                color: #909399;

                span {
                  display: flex;
                  align-items: center;
                  gap: 4px;
                }
              }
            }
          }
        }
      }

      .pagination-area {
        display: flex;
        justify-content: center;
        margin-top: 24px;
      }
    }

    .articles-sidebar {
      width: 280px;
      flex-shrink: 0;

      .sidebar-card {
        margin-bottom: 20px;

        :deep(.el-card__header) {
          padding: 12px 16px;
          font-weight: 600;
          color: #303133;
        }
      }

      .archive-list {
        .archive-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f0f2f5;
          cursor: pointer;
          transition: all 0.3s ease;

          &:last-child {
            border-bottom: none;
          }

          &:hover,
          &.active {
            color: #667eea;
          }

          .year {
            font-size: 14px;
          }

          .count {
            font-size: 13px;
            color: #909399;
          }
        }
      }

      .tag-cloud {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag-item {
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  }
}
</style>
