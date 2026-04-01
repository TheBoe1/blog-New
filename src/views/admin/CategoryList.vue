<template>
  <div class="category-list">
    <div class="list-header">
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建分类
      </el-button>
    </div>

    <el-card shadow="never">
      <el-table :data="categories" style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="slug" label="别名" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="articleCount" label="文章数" width="100" align="center">
          <template #default="{ row }">
            {{ row.articleCount ?? getArticleCount(row.id) }}
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column prop="createTime" label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-popconfirm
              title="确定要删除此分类吗？"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" link>删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新建分类'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类名称" required>
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类别名">
          <el-input v-model="form.slug" placeholder="请输入分类别名（用于URL）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
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
import { ElMessage } from 'element-plus'
import { useBlogStore } from '@/stores/blog'

const blogStore = useBlogStore()

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: '',
  name: '',
  slug: '',
  description: '',
  sortOrder: 0
})

const categories = computed(() => blogStore.categories)

function getArticleCount(categoryId: string) {
  return blogStore.articles.filter(a => a.categoryId === categoryId).length
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.slug = ''
  form.description = ''
  form.sortOrder = 0
}

function handleCreate() {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder
  })
  dialogVisible.value = true
}

async function handleDelete(id: string) {
  const articleCount = getArticleCount(id)
  if (articleCount > 0) {
    ElMessage.warning(`该分类下有 ${articleCount} 篇文章，无法删除`)
    return
  }
  
  try {
    await blogStore.deleteCategory(id)
    ElMessage.success('分类已删除')
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

async function handleSubmit() {
  if (!form.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await blogStore.updateCategory(form.id, {
        name: form.name,
        slug: form.slug,
        description: form.description,
        sortOrder: form.sortOrder
      })
      ElMessage.success('分类已更新')
    } else {
      await blogStore.createCategory({
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
        description: form.description,
        sortOrder: form.sortOrder
      })
      ElMessage.success('分类已创建')
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      blogStore.fetchCategories(),
      blogStore.fetchArticles({})
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped lang="scss">
.category-list {
  .list-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 20px;
  }
}
</style>
