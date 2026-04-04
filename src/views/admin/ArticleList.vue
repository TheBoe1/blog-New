<template>
  <div class="article-list">
    <div class="list-header">
      <div class="search-area">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索文章标题..."
          prefix-icon="Search"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
        />
        <el-select
          v-model="searchParams.categoryId"
          placeholder="选择分类"
          clearable
          style="width: 150px"
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
          style="width: 120px"
        >
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
        </el-select>
      </div>
      <el-button type="primary" @click="router.push('/admin/article/create')">
        <el-icon><Plus /></el-icon>
        新建文章
      </el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="filteredArticles" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="article-title-cell">
              <span v-if="row?.id" class="title" style="cursor: pointer;" @click="handleEdit(row.id)">
                {{ row?.title || '' }}
              </span>
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
            <el-button v-if="row?.id" type="primary" link @click="handlePreview(row.id)">
              预览
            </el-button>
            <el-popconfirm
              v-if="row?.id"
              title="确定要删除这篇文章吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useBlogStore } from '@/stores/blog'

const router = useRouter()
const route = useRoute()
const blogStore = useBlogStore()

const loading = ref(false)

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

const categories = ref([])

// 获取标签颜色
function getTagColor(tagName: string): string {
  const tag = blogStore.tags.find(t => t.name === tagName)
  return tag?.color || '#667eea'
}

const filteredArticles = computed(() => {
  let result = [...blogStore.articles]
  
  if (searchParams.keyword) {
    const keyword = searchParams.keyword.toLowerCase()
    result = result.filter(a => 
      a.title.toLowerCase().includes(keyword) ||
      a.summary.toLowerCase().includes(keyword)
    )
  }
  
  if (searchParams.categoryId) {
    result = result.filter(a => a.categoryId === searchParams.categoryId)
  }
  
  if (searchParams.status) {
    const isPublished = searchParams.status === 'published'
    result = result.filter(a => a.isPublished === isPublished)
  }
  
  pagination.total = result.length
  
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  
  return result.slice(start, end)
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function handleSearch() {
  pagination.page = 1
}

function handleSizeChange() {
  pagination.page = 1
}

function handlePageChange() {
}

function handleEdit(id: string) {
  console.log('Editing article with id:', id)
  console.log('Navigating to:', `/admin/article/edit/${id}`)
  router.push(`/admin/article/edit/${id}`)
  console.log('Navigation completed')
}

function handlePreview(id: string) {
  console.log('Previewing article with id:', id)
  console.log('Navigating to:', `/article/${id}`)
  router.push(`/article/${id}`)
  console.log('Navigation completed')
}

async function handleDelete(id: string) {
  try {
    await blogStore.deleteArticle(id)
    ElMessage.success('文章已删除')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      blogStore.fetchAdminArticles({}),
      blogStore.fetchTags()
    ])
    pagination.total = blogStore.articles.length
  } finally {
    loading.value = false
  }
})

onBeforeRouteUpdate(async (to, from) => {
  console.log('onBeforeRouteUpdate triggered:', { to: to.path, from: from.path })
  if (to.path === '/admin/articles') {
    console.log('Refreshing article list...')
    loading.value = true
    try {
      const result = await Promise.all([
        blogStore.fetchAdminArticles({}),
        blogStore.fetchTags()
      ])
      console.log('Fetch result:', result)
      console.log('Articles in store:', blogStore.articles)
      pagination.total = blogStore.articles.length
      console.log('Pagination total:', pagination.total)
    } catch (error) {
      console.error('Error refreshing articles:', error)
    } finally {
      loading.value = false
      console.log('Refresh completed')
    }
  }
})

// Watch for route changes
watch(() => route.path, async (newPath, oldPath) => {
  console.log('Route changed:', { newPath, oldPath })
  if (newPath === '/admin/articles') {
    console.log('Route watcher: Refreshing article list...')
    loading.value = true
    try {
      const result = await Promise.all([
        blogStore.fetchAdminArticles({}),
        blogStore.fetchTags()
      ])
      console.log('Route watcher: Fetch result:', result)
      pagination.total = blogStore.articles.length
      console.log('Route watcher: Refresh completed')
    } catch (error) {
      console.error('Route watcher: Error refreshing articles:', error)
    } finally {
      loading.value = false
    }
  }
})
</script>

<style scoped lang="scss">
.article-list {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .search-area {
      display: flex;
      gap: 12px;
    }
  }

  .article-title-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #337ab7;
      text-decoration: underline;
      
      &:hover {
        color: #23527c;
        text-decoration: none;
      }
    }
  }

  .pagination-area {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
