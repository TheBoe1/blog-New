<template>
  <div class="article-editor">
    <div class="editor-header">
      <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <div class="header-actions">
        <el-button @click="handleSaveDraft">
          <el-icon><Document /></el-icon>
          保存草稿
        </el-button>
        <el-button type="primary" @click="handlePublish">
          <el-icon><Upload /></el-icon>
          {{ form.isPublished ? '更新发布' : '发布文章' }}
        </el-button>
      </div>
    </div>

    <div class="editor-content">
      <div class="main-editor">
        <el-card shadow="never" class="title-card">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题..."
            class="title-input"
          />
        </el-card>

        <el-card shadow="never" class="editor-card">
          <div class="editor-wrapper">
            <Toolbar
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
              class="wang-toolbar"
            />
            <Editor
              v-model="form.htmlContent"
              :defaultConfig="editorConfig"
              mode="default"
              class="wang-editor"
              @onCreated="handleCreated"
              @onChange="handleChange"
            />
          </div>
        </el-card>
      </div>

      <div class="sidebar-settings">
        <el-card shadow="never" class="setting-card">
          <template #header>
            <span class="card-title">文章设置</span>
          </template>

          <el-form ref="formRef" :model="form" :rules="formRules" label-position="top">
            <el-form-item label="文章分类" prop="categoryId">
              <el-select
                v-model="form.categoryId"
                placeholder="选择分类（必选）"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categories"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
                <el-option label="其他" value="other" />
              </el-select>
              <el-input
                v-if="form.categoryId === 'other'"
                v-model="form.customCategory"
                placeholder="请输入自定义分类"
                style="margin-top: 8px"
              />
            </el-form-item>

            <el-form-item label="文章标签" prop="tags">
              <el-select
                v-model="form.tags"
                multiple
                filterable
                allow-create
                placeholder="选择或创建标签（必选）"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>

            <el-form-item label="文章摘要">
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="3"
                placeholder="请输入文章摘要..."
              />
            </el-form-item>

            <el-form-item label="封面图片">
              <el-upload
                class="cover-uploader"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :http-request="handleCoverUpload"
              >
                <img v-if="form.cover" :src="form.cover" class="cover-preview" />
                <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>

            <el-form-item label="发布时间" prop="publishedAt">
              <el-date-picker
                v-model="form.publishedAt"
                type="datetime"
                placeholder="选择发布时间（必选）"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="form.isTop">置顶文章</el-checkbox>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="never" class="stats-card">
          <template #header>
            <span class="card-title">文章信息</span>
          </template>
          <div class="stats-list">
            <div class="stat-item">
              <span class="label">字数统计</span>
              <span class="value">{{ wordCount }}</span>
            </div>
            <div class="stat-item">
              <span class="label">阅读时长</span>
              <span class="value">{{ readingTime }} 分钟</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, shallowRef, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { useBlogStore } from '@/stores/blog'
import { articleApi } from '@/api/article'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const isEdit = computed(() => !!route.params.id)

const editorRef = shallowRef<IDomEditor>()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref({
  title: '',
  content: '',
  htmlContent: '',
  summary: '',
  cover: '',
  categoryId: '',
  customCategory: '',
  tags: [] as string[],
  isPublished: false,
  isTop: false,
  publishedAt: '' as string
})

const formRules: FormRules = {
  categoryId: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  tags: [{ required: true, type: 'array', min: 1, message: '请至少选择一个标签', trigger: 'change' }],
  publishedAt: [{ required: true, message: '请选择发布时间', trigger: 'change' }]
}

const categories = computed(() => blogStore.categories.map(c => ({ id: c.id, name: c.name })))

const tags = computed(() => blogStore.tags.map(t => t.name))

const wordCount = computed(() => {
  const text = form.value.content.replace(/<[^>]+>/g, '')
  return text.length
})

const readingTime = computed(() => {
  return Math.ceil(wordCount.value / 500)
})

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video']
}

const editorConfig: Partial<IEditorConfig> = markRaw({
  placeholder: '开始编写你的文章...',
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt: string, href: string) => void) {
        const url = await uploadImage(file)
        insertFn(url, file.name, url)
      }
    },
    codeSelectLang: {
      codeLangs: [
        { text: 'CSS', value: 'css' },
        { text: 'HTML', value: 'html' },
        { text: 'XML', value: 'xml' },
        { text: 'JavaScript', value: 'javascript' },
        { text: 'TypeScript', value: 'typescript' },
        { text: 'Java', value: 'java' },
        { text: 'Python', value: 'python' },
        { text: 'C', value: 'c' },
        { text: 'C++', value: 'cpp' },
        { text: 'C#', value: 'csharp' },
        { text: 'PHP', value: 'php' },
        { text: 'Go', value: 'go' },
        { text: 'Shell', value: 'shell' },
        { text: 'SQL', value: 'sql' },
        { text: 'JSON', value: 'json' }
      ]
    }
  }
})

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}

function handleChange(editor: IDomEditor) {
  form.value.content = editor.getText()
  form.value.htmlContent = editor.getHtml()
}

async function uploadImage(file: File): Promise<string> {
  try {
    const result = await articleApi.uploadImage(file)
    return result.url
  } catch (error) {
    ElMessage.error('图片上传失败')
    throw error
  }
}

function formatDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function beforeCoverUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

async function handleCoverUpload(options: any) {
  try {
    const result = await articleApi.uploadCover(options.file)
    form.value.cover = result.url
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('封面上传失败')
  }
}

async function handleSaveDraft() {
  if (!form.value.title) {
    ElMessage.warning('请输入文章标题')
    return
  }
  form.value.isPublished = false
  await saveArticle()
  ElMessage.success('草稿保存成功')
  router.push('/admin/articles')
}

async function handlePublish() {
  if (!form.value.title) {
    ElMessage.warning('请输入文章标题')
    return
  }
  if (!form.value.htmlContent || form.value.htmlContent === '<p><br></p>') {
    ElMessage.warning('请输入文章内容')
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  form.value.isPublished = true
  // 如果没有选择时间，默认当前时间
  if (!form.value.publishedAt) {
    form.value.publishedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  await saveArticle()
  ElMessage.success(isEdit.value ? '文章更新成功' : '文章发布成功')
  router.push('/admin/articles')
}

async function saveArticle() {
  loading.value = true
  try {
    const articleData = {
      title: form.value.title,
      content: form.value.content,
      htmlContent: form.value.htmlContent,
      summary: form.value.summary,
      cover: form.value.cover,
      categoryId: form.value.categoryId === 'other' ? form.value.customCategory : form.value.categoryId,
      tags: form.value.tags,
      isPublished: form.value.isPublished,
      isTop: form.value.isTop,
      publishedAt: form.value.publishedAt || undefined
    }

    if (isEdit.value && route.params.id) {
      await blogStore.updateArticle(route.params.id as string, articleData)
    } else {
      await blogStore.createArticle(articleData)
    }
  } catch (error) {
    ElMessage.error('保存失败，请重试')
    throw error
  } finally {
    loading.value = false
  }
}

async function loadArticle() {
  if (isEdit.value && route.params.id) {
    loading.value = true
    try {
      const article = await blogStore.fetchArticleById(route.params.id as string)
      if (article) {
        form.value = {
          title: article.title,
          content: article.content || '',
          htmlContent: article.htmlContent || '',
          summary: article.summary || '',
          cover: article.cover || '',
          categoryId: article.categoryId || '',
          customCategory: '',
          tags: article.tags || [],
          isPublished: article.isPublished || false,
          isTop: article.isTop || false,
          publishedAt: article.publishedAt ? formatDateTime(new Date(article.publishedAt)) : ''
        }
      }
    } finally {
      loading.value = false
    }
  }
}

async function loadData() {
  await Promise.all([
    blogStore.fetchCategories(),
    blogStore.fetchTags()
  ])
}

onMounted(async () => {
  await loadData()
  await loadArticle()
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped lang="scss">
.article-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
    font-size: 20px;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.editor-content {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.main-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;

  .title-card {
    :deep(.el-card__body) {
      padding: 16px;
    }

    .title-input {
      :deep(.el-input__wrapper) {
        box-shadow: none;
        padding: 0;
        
        .el-input__inner {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          
          &::placeholder {
            color: #c0c4cc;
          }
        }
      }
    }
  }

  .editor-card {
    flex: 1;
    overflow: hidden;
    
    :deep(.el-card__body) {
      height: 100%;
      padding: 0;
    }

    .editor-wrapper {
      height: 100%;
      display: flex;
      flex-direction: column;
      border: 1px solid #e4e7ed;
      
      .wang-toolbar {
        border-bottom: 1px solid #e4e7ed;
      }
      
      .wang-editor {
        flex: 1;
        overflow-y: auto;
      }
    }
  }
}

.sidebar-settings {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;

  .setting-card,
  .stats-card {
    :deep(.el-card__header) {
      padding: 12px 16px;
      border-bottom: 1px solid #e4e7ed;
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }
}

.cover-uploader {
  width: 100%;
  
  :deep(.el-upload) {
    width: 100%;
    height: 160px;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.3s ease;

    &:hover {
      border-color: #667eea;
    }
  }

  .cover-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-uploader-icon {
    font-size: 28px;
    color: #8c939d;
  }
}

.stats-list {
  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f0f2f5;

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #909399;
      font-size: 13px;
    }

    .value {
      color: #303133;
      font-size: 13px;
      font-weight: 500;
    }
  }
}
</style>
