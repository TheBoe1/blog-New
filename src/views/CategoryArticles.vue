<template>
  <div class="category-articles">
    <div class="category-header">
      <h1>{{ category.name }}</h1>
      <p>{{ category.description }}</p>
      <div class="category-stats">
        <span>共 {{ total }} 篇文章</span>
      </div>
    </div>

    <el-card shadow="never" class="article-list">
      <div
        v-for="article in articles"
        :key="article.id"
        class="article-item"
        @click="goToArticle(article.id)"
      >
        <div class="article-info">
          <h3 class="article-title">{{ article.title }}</h3>
          <p class="article-summary">{{ article.summary }}</p>
          <div class="article-meta">
            <span>{{ formatDate(article.createTime) }}</span>
            <span>{{ article.viewCount }} 阅读</span>
          </div>
        </div>
      </div>

      <div class="pagination-area">
        <el-pagination
          v-model:current-page="currentPage"
          :total="total"
          :page-size="10"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const category = ref({
  id: '',
  name: '加载中...',
  description: '',
  articleCount: 0
})
const articles = ref([])
const currentPage = ref(1)
const total = ref(0)

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function goToArticle(id: string) {
  router.push(`/article/${id}`)
}

function handlePageChange() {
  fetchArticles()
}

async function fetchArticles() {
  const categoryId = route.params.id as string
  try {
    // 确保分类数据是最新的
    if (blogStore.categories.length === 0) {
      await blogStore.fetchCategories()
    }
    
    // 获取分类信息
    const foundCategory = blogStore.categories.find(cat => cat.id === categoryId)
    if (foundCategory) {
      category.value = foundCategory
    } else {
      // 如果找不到分类，尝试从API获取
      console.log(`Category ${categoryId} not found in store`)
      category.value = {
        id: categoryId,
        name: '未知分类',
        description: '该分类暂无描述',
        articleCount: 0,
        createTime: new Date().toISOString(),
        parentId: '',
        slug: '',
        sortOrder: 0
      }
    }

    // 获取该分类的文章
    await blogStore.fetchArticles({ categoryId, page: currentPage.value, pageSize: 10 })
    articles.value = blogStore.articles
    // 在实际应用中，total 应该从响应中获取
    total.value = blogStore.articles.length
  } catch (error) {
    console.error('Failed to fetch category articles:', error)
  }
}

watch(() => route.params.id, fetchArticles)
watch(currentPage, fetchArticles)

onMounted(async () => {
  await fetchArticles()
})
</script>

<style scoped lang="scss">
.category-articles {
  .category-header {
    margin-bottom: 24px;

    h1 {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px;
    }

    p {
      font-size: 16px;
      color: #606266;
      margin: 0 0 8px;
    }

    .category-stats {
      font-size: 14px;
      color: #909399;
    }
  }

  .article-list {
    :deep(.el-card__body) {
      padding: 0;
    }

    .article-item {
      padding: 20px;
      border-bottom: 1px solid #f0f2f5;
      cursor: pointer;
      transition: background 0.3s ease;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f5f7fa;
      }

      .article-info {
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
          margin: 0 0 12px;
          line-height: 1.6;
        }

        .article-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }

  .pagination-area {
    display: flex;
    justify-content: center;
    margin-top: 24px;
    padding: 20px;
  }
}
</style>
