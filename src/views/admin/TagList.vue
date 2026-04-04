<template>
  <div class="tag-list">
    <div class="list-header">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建标签
      </el-button>
    </div>

    <el-card shadow="never">
      <div class="tag-grid" v-if="tags.length > 0">
        <div
          v-for="tag in tags"
          :key="tag.id"
          class="tag-item"
        >
          <div class="tag-info">
            <el-tag :color="tag.color || '#667eea'" effect="dark" class="tag-badge">
              {{ tag.name }}
            </el-tag>
            <span class="article-count">{{ getArticleCount(tag.name) }} 篇文章</span>
          </div>
          <div class="tag-actions">
            <el-button type="primary" link size="small" @click="handleEdit(tag)">编辑</el-button>
            <el-button type="danger" link size="small" @click="confirmDelete(tag)">删除</el-button>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无标签" />
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标签' : '新建标签'"
      width="400px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="标签名称" required>
          <el-input v-model="form.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-color-picker v-model="form.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBlogStore } from '@/stores/blog'
import type { Tag } from '@/types'

const blogStore = useBlogStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)

const tags = computed(() => blogStore.tags)

const form = reactive({
  id: '',
  name: '',
  slug: '',
  color: '#667eea'
})

// 优化标签文章计数计算，使用computed缓存结果
const tagArticleCounts = computed(() => {
  const counts: Record<string, number> = {}
  blogStore.articles.forEach(article => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tagName => {
        counts[tagName] = (counts[tagName] || 0) + 1
      })
    }
  })
  return counts
})

function getArticleCount(tagName: string) {
  return tagArticleCounts.value[tagName] || 0
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.slug = ''
  form.color = '#667eea'
}

function handleCreate() {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

function handleEdit(row: Tag) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color || '#667eea'
  })
  dialogVisible.value = true
}

async function confirmDelete(tag: Tag) {
  const articleCount = getArticleCount(tag.name)
  const message = articleCount > 0
    ? `确定要删除标签"${tag.name}"吗？\n该标签下有 ${articleCount} 篇文章，删除后这些文章将不再关联此标签。`
    : `确定要删除标签"${tag.name}"吗？`
  
  try {
    await ElMessageBox.confirm(message, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await handleDelete(tag.id)
  } catch (error) {
    // 用户取消删除
  }
}

async function handleDelete(id: string) {
  try {
    await blogStore.deleteTag(id)
    // 刷新标签列表和文章列表，确保数据同步
    await Promise.all([
      blogStore.fetchTags(),
      blogStore.fetchAdminArticles({})
    ])
    ElMessage.success('标签已删除')
  } catch (error) {
    console.error('Failed to delete tag:', error)
    ElMessage.error('删除失败')
  }
}

async function handleSubmit() {
  if (!form.name) {
    ElMessage.warning('请输入标签名称')
    return
  }
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await blogStore.updateTag(form.id, {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        color: form.color
      })
      ElMessage.success('标签已更新')
    } else {
      await blogStore.createTag({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        color: form.color
      })
      ElMessage.success('标签已创建')
    }
    // 刷新标签列表和文章列表，确保数据同步
    await Promise.all([
      blogStore.fetchTags(),
      blogStore.fetchAdminArticles({})
    ])
    dialogVisible.value = false
  } catch (error) {
    console.error('Failed to submit tag:', error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      blogStore.fetchTags(),
      blogStore.fetchAdminArticles({})
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.tag-list {
  .list-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
  }

  .tag-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .tag-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #667eea;
      box-shadow: 0 2px 12px rgba(102, 126, 234, 0.1);
    }

    .tag-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .tag-badge {
        font-size: 14px;
      }

      .article-count {
        font-size: 12px;
        color: #909399;
      }
    }

    .tag-actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
