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
            <span class="article-count">{{ tag.articleCount ?? getArticleCount(tag.name) }} 篇文章</span>
          </div>
          <div class="tag-actions">
            <el-button type="primary" link size="small" @click="handleEdit(tag)">编辑</el-button>
            <el-popconfirm
              title="确定要删除此标签吗？"
              @confirm="handleDelete(tag.id)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
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
import { ElMessage } from 'element-plus'
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

function getArticleCount(tagName: string) {
  return blogStore.articles.filter(a => a.tags && a.tags.includes(tagName)).length
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

async function handleDelete(id: string) {
  try {
    await blogStore.deleteTag(id)
    ElMessage.success('标签已删除')
  } catch (error) {
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
      blogStore.fetchTags(),
      blogStore.fetchArticles({})
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
