<template>
  <div class="article-list">
    <h1 class="page-title">文章管理</h1>
    <div class="list-header">
      <form class="search-area" @submit.prevent="handleSearch">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索文章标题..."
          prefix-icon="Search"
          clearable
          class="keyword-input"
          aria-label="搜索文章标题"
        />
        <el-select
          v-model="searchParams.categoryId"
          placeholder="选择分类"
          clearable
          class="category-select"
          aria-label="按分类筛选"
          @change="handleSearch"
        >
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
        <el-select
          v-model="searchParams.status"
          placeholder="发布状态"
          clearable
          class="status-select"
          aria-label="按发布状态筛选"
          @change="handleSearch"
        >
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
        </el-select>
        <el-button native-type="submit" :disabled="loading">搜索</el-button>
        <el-button native-type="button" @click="resetFilters">重置</el-button>
      </form>
      <el-button type="primary" @click="router.push('/admin/article/create')">
        <el-icon><Plus /></el-icon>
        新建文章
      </el-button>
    </div>

    <el-card shadow="never" v-loading="loading" :aria-busy="loading">
      <div v-if="loadError" class="list-state" role="alert">
        <p>文章加载失败，请检查网络后重试。</p>
        <el-button @click="loadArticles">重新加载</el-button>
      </div>
      <el-empty v-else-if="!loading && !articles.length" :description="hasFilters ? '没有符合筛选条件的文章' : '还没有文章'">
        <el-button v-if="hasFilters" @click="resetFilters">清除筛选</el-button>
        <el-button v-else type="primary" @click="router.push('/admin/article/create')">写第一篇文章</el-button>
      </el-empty>
      <template v-else>
      <div v-if="!isMobile" class="admin-table-scroll">
      <el-table :data="articles" style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="article-title-cell">
              <router-link v-if="row?.id" class="title" :to="`/admin/article/edit/${row.id}`">
                {{ row?.title || '' }}
              </router-link>
              <span v-else class="title">{{ row?.title || '' }}</span>
              <el-tag v-if="row?.isTop" type="danger" size="small" effect="dark">置顶</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="120" />
        <el-table-column prop="tags" label="标签" width="180">
          <template #default="{ row }">
            <el-tag
              v-for="tag in (row?.tags || []).slice(0, 3)"
              :key="tag"
              :color="getTagColor(tag)"
              effect="dark"
              size="small"
              style="margin-right: 4px"
            >
              {{ tag }}
            </el-tag>
            <el-tag v-if="(row?.tags || []).length > 3" size="small" type="info">
              +{{ (row?.tags || []).length - 3 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="viewCount" label="浏览" width="80" align="center" />
        <el-table-column prop="likeCount" label="点赞" width="80" align="center" />
        <el-table-column prop="isPublished" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row?.isPublished ? 'success' : 'info'" size="small">
              {{ row?.isPublished ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row?.createTime || '') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row?.id" type="primary" link @click="handleEdit(row.id)">
              编辑
            </el-button>
            <el-button v-if="row?.id" type="primary" link @click="handlePreview(row)">
              预览
            </el-button>
            <el-popconfirm
              v-if="row?.id"
              title="确定要删除这篇文章吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" link :disabled="!!deletingId">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      </div>

      <ul v-else class="article-cards" aria-label="文章列表">
        <li v-for="article in articles" :key="article.id" class="article-card">
          <div class="article-card-heading">
            <router-link :to="`/admin/article/edit/${article.id}`" class="article-card-title">{{ article.title || '无标题文章' }}</router-link>
            <el-tag :type="article.isPublished ? 'success' : 'info'">{{ article.isPublished ? '已发布' : '草稿' }}</el-tag>
          </div>
          <p class="article-card-meta">{{ article.categoryName || '未分类' }} · {{ formatDate(article.createTime) }}</p>
          <p class="article-card-meta">浏览 {{ article.viewCount || 0 }} · 点赞 {{ article.likeCount || 0 }}<span v-if="article.isTop"> · 置顶</span></p>
          <div v-if="article.tags.length" class="article-card-tags"><el-tag v-for="tag in article.tags" :key="tag" size="small">{{ tag }}</el-tag></div>
          <div class="article-card-actions">
            <el-button type="primary" plain @click="handleEdit(article.id)">编辑</el-button>
            <el-button @click="handlePreview(article)">预览</el-button>
            <el-popconfirm title="删除后无法恢复，确定删除？" confirm-button-text="删除" cancel-button-text="取消" @confirm="handleDelete(article.id)">
              <template #reference><el-button type="danger" plain :loading="deletingId === article.id" :disabled="!!deletingId">删除</el-button></template>
            </el-popconfirm>
          </div>
        </li>
      </ul>
      </template>

      <div class="pagination-area">
        <span class="result-count" role="status">共 {{ pagination.total }} 篇</span>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          :layout="isMobile ? 'prev, pager, next' : 'sizes, prev, pager, next, jumper'"
          :pager-count="isMobile ? 5 : 7"
          :disabled="loading || !!loadError"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useMediaQuery } from '@vueuse/core'
import { articleApi, categoryApi } from '@/api/article'
import type { Article, Category, ArticleQuery } from '@/types'
import { useBlogStore } from '@/stores/blog'

const router = useRouter()
const blogStore = useBlogStore()

const loading = ref(false)
const loadError = ref(false)
const deletingId = ref('')
const articles = ref<Article[]>([])
const categories = ref<Category[]>([])
const isMobile = useMediaQuery('(max-width: 768px)')
let requestSequence = 0
const appliedFilters = ref<ArticleQuery>({})

const searchParams = reactive({
  keyword: '',
  categoryId: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const hasFilters = computed(() => !!(appliedFilters.value.keyword || appliedFilters.value.categoryId || appliedFilters.value.isPublished !== undefined))

// 获取标签颜色
function getTagColor(tagName: string): string {
  const tag = blogStore.tags.find(t => t.name === tagName)
  return tag?.color || 'var(--brand-primary)'
}

async function loadArticles() {
  const sequence = ++requestSequence
  loading.value = true
  loadError.value = false
  try {
    const response = await articleApi.getAdminList({ ...appliedFilters.value, page: pagination.page, pageSize: pagination.pageSize })
    if (sequence !== requestSequence) return
    articles.value = (response.rows || response.list || []).filter(Boolean).map(article => ({
      ...article,
      tags: Array.isArray(article.tags) ? article.tags : typeof article.tags === 'string' ? (article.tags as string).split(',').map(tag => tag.trim()).filter(Boolean) : []
    }))
    pagination.total = response.total || 0
    const lastPage = Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    if (pagination.page > lastPage) {
      pagination.page = lastPage
      await loadArticles()
    }
  } catch {
    if (sequence === requestSequence) loadError.value = true
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

function formatDate(date: string) {
  if (!date || Number.isNaN(new Date(date).getTime())) return '日期未记录'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function handleSearch() {
  appliedFilters.value = {
    keyword: searchParams.keyword.trim() || undefined,
    categoryId: searchParams.categoryId || undefined,
    isPublished: searchParams.status ? searchParams.status === 'published' : undefined
  }
  pagination.page = 1
  void loadArticles()
}

function resetFilters() {
  searchParams.keyword = ''
  searchParams.categoryId = ''
  searchParams.status = ''
  handleSearch()
}

function handleSizeChange() {
  pagination.page = 1
  void loadArticles()
}

function handlePageChange() {
  void loadArticles()
}

function handleEdit(id: string) {
  router.push(`/admin/article/edit/${id}`)
}

function handlePreview(article: Article) {
  router.push(`/article/${article.slug || article.id}`)
}

async function handleDelete(id: string) {
  if (deletingId.value) return
  deletingId.value = id
  try {
    await blogStore.deleteArticle(id)
    ElMessage.success('文章已删除')
    await loadArticles()
  } catch (error) {
    ElMessage.error('删除失败')
  } finally {
    deletingId.value = ''
  }
}

onMounted(async () => {
  await Promise.all([
    loadArticles(),
    categoryApi.getList().then(result => { categories.value = result }).catch(() => { ElMessage.warning('分类加载失败，仍可按标题和状态搜索') }),
    blogStore.fetchTags()
  ])
})
</script>

<style scoped lang="scss">
.article-list {
  .page-title { margin: 0 0 var(--space-4); font-size: var(--font-size-2xl); color: var(--text-primary); }
  .list-state { display: grid; justify-items: center; gap: var(--space-4); padding: var(--space-8) var(--space-4); color: var(--text-primary); }
  .keyword-input { width: 240px; }
  .category-select { width: 150px; }
  .status-select { width: 120px; }
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin-bottom: var(--space-5);

    .search-area {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }
  }

  .article-title-cell {
    display: flex;
    align-items: center;
    gap: var(--space-2);

    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--link-color);
      text-decoration: underline;

      &:hover {
        color: var(--link-hover-color);
        text-decoration: none;
      }
    }
  }

  .pagination-area {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    flex-wrap: wrap;
    align-items: center;
    margin-top: var(--space-5);
  }
  .result-count { color: var(--text-secondary); font-size: var(--font-size-sm); }
  .article-cards { list-style: none; padding: 0; margin: 0; }
  .article-card { padding: var(--space-4) 0; border-bottom: 1px solid var(--border-color); }
  .article-card:first-child { padding-top: 0; }
  .article-card-heading { display: flex; align-items: flex-start; gap: var(--space-3); }
  .article-card-heading :deep(.el-tag) { flex-shrink: 0; }
  .article-card-title { flex: 1; min-width: 0; overflow-wrap: anywhere; color: var(--text-primary); font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
  .article-card-meta { margin: var(--space-2) 0; color: var(--text-secondary); font-size: var(--font-size-sm); }
  .article-card-tags { display: flex; flex-wrap: wrap; gap: var(--space-2); }
  .article-card-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-top: var(--space-4); }
  .article-card-actions :deep(.el-button + .el-button) { margin-left: 0; }

  @media (max-width: 768px) {
    .list-header { align-items: stretch; flex-direction: column; gap: var(--space-3); }
    .search-area { flex-wrap: wrap; }
    .search-area :deep(.el-input), .search-area :deep(.el-select) { flex: 1 1 100%; width: 100%; }
    .search-area :deep(.el-input__wrapper), .search-area :deep(.el-select__wrapper) { width: 100%; }
    :deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-button) { min-height: var(--space-12); }
    :deep(.el-input__inner), :deep(.el-select__placeholder) { font-size: var(--font-size-base); }
    :deep(.el-card__body) { padding: var(--space-4); }
    .pagination-area { justify-content: center; }
    .pagination-area :deep(.el-pagination) { max-width: 100%; flex-wrap: wrap; justify-content: center; }
  }
}
</style>
