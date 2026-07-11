<template>
  <div class="article-editor">
    <div class="editor-header">
      <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <div class="header-actions">
        <el-radio-group v-model="editorType" size="small" :disabled="isEdit">
          <el-radio-button value="markdown">Markdown</el-radio-button>
          <el-radio-button value="richtext">富文本</el-radio-button>
        </el-radio-group>
        <el-tooltip v-if="isEdit" content="编辑模式下不可切换编辑器类型" placement="top">
          <el-icon class="edit-tip"><InfoFilled /></el-icon>
        </el-tooltip>
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
            <MarkdownEditor
              v-if="editorType === 'markdown'"
              v-model="form.markdownContent"
              placeholder="开始编写你的文章..."
              :article-hash="articleHash"
              @save="handleSaveDraft"
            />
            <template v-else>
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
            </template>
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
import { ref, computed, onMounted, onBeforeUnmount, shallowRef, markRaw, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { useBlogStore } from '@/stores/blog'
import { articleApi } from '@/api/article'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import { htmlToMarkdown, isHtmlContent } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()

const isEdit = computed(() => !!route.params.id)

const editorRef = shallowRef<IDomEditor>()
const formRef = ref<FormInstance>()
const loading = ref(false)
const editorType = ref<'markdown' | 'richtext'>('markdown')
const articleHash = ref('')

function generateHash(): string {
  return 'article_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
}

const form = ref({
  title: '',
  content: '',
  htmlContent: '',
  markdownContent: '',
  summary: '',
  cover: '',
  categoryId: '',
  customCategory: '',
  tags: [] as string[],
  isPublished: false,
  isTop: false,
  publishedAt: '' as string,
  contentType: 'markdown' as 'markdown' | 'html'
})

const formRules: FormRules = {
  categoryId: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  tags: [{ required: true, type: 'array', min: 1, message: '请至少选择一个标签', trigger: 'change' }],
  publishedAt: [{ required: true, message: '请选择发布时间', trigger: 'change' }]
}

const categories = computed(() => blogStore.categories.map(c => ({ id: c.id, name: c.name })))

const tags = computed(() => blogStore.tags.map(t => t.name))

const wordCount = computed(() => {
  const text = form.value.content.replace(/<[^>]+>/g, '').replace(/[#*`_\[\]]/g, '')
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

watch(editorType, (newType) => {
  if (newType === 'markdown' && form.value.htmlContent && isHtmlContent(form.value.htmlContent)) {
    form.value.markdownContent = htmlToMarkdown(form.value.htmlContent)
  }
  form.value.contentType = newType === 'markdown' ? 'markdown' : 'html'
})

async function uploadImage(file: File): Promise<string> {
  try {
    const result = await articleApi.uploadImage(file, articleHash.value, 'content')
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
    const result = await articleApi.uploadCover(options.file, articleHash.value)
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
  
  const hasContent = editorType.value === 'markdown' 
    ? form.value.markdownContent && form.value.markdownContent.trim()
    : form.value.htmlContent && form.value.htmlContent !== '<p><br></p>'
    
  if (!hasContent) {
    ElMessage.warning('请输入文章内容')
    return
  }
  
  // 如果没有选择发布时间，自动设置为当前本地时间
  if (!form.value.publishedAt) {
    form.value.publishedAt = formatDateTime(new Date())
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  form.value.isPublished = true
  await saveArticle()
  ElMessage.success(isEdit.value ? '文章更新成功' : '文章发布成功')
  router.push('/admin/articles')
}

async function saveArticle() {
  loading.value = true
  try {
    const articleData = {
      title: form.value.title,
      content: editorType.value === 'markdown' ? form.value.markdownContent : form.value.content,
      htmlContent: editorType.value === 'markdown' ? '' : form.value.htmlContent,
      markdownContent: editorType.value === 'markdown' ? form.value.markdownContent : '',
      summary: form.value.summary,
      cover: form.value.cover,
      categoryId: form.value.categoryId === 'other' ? form.value.customCategory : form.value.categoryId,
      tags: form.value.tags,
      isPublished: form.value.isPublished,
      isTop: form.value.isTop,
      publishedAt: form.value.publishedAt || undefined,
      contentType: form.value.contentType
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
          markdownContent: article.markdownContent || '',
          summary: article.summary || '',
          cover: article.cover || '',
          categoryId: article.categoryId || '',
          customCategory: '',
          tags: article.tags || [],
          isPublished: article.isPublished || false,
          isTop: article.isTop || false,
          publishedAt: article.publishedAt ? formatDateTime(new Date(article.publishedAt)) : '',
          contentType: (article as any).contentType || 'html'
        }
        
        if (form.value.contentType === 'markdown' && article.markdownContent) {
          editorType.value = 'markdown'
        } else if (article.htmlContent && isHtmlContent(article.htmlContent)) {
          editorType.value = 'richtext'
        } else if (article.content && !isHtmlContent(article.content)) {
          editorType.value = 'markdown'
          form.value.markdownContent = article.content
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
  if (isEdit.value && route.params.id) {
    articleHash.value = route.params.id as string
  } else {
    articleHash.value = generateHash()
  }
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
    color: var(--text-primary);
  }

  .header-actions {
    display: flex;
    gap: 12px;
    align-items: center;

    .edit-tip {
      color: var(--text-tertiary);
      cursor: help;
    }
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
          color: var(--text-primary);

          &::placeholder {
            color: var(--text-placeholder);
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
      border: 1px solid var(--border-color);

      .wang-toolbar {
        border-bottom: 1px solid var(--border-color);
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
      border-bottom: 1px solid var(--border-color);
    }

    :deep(.el-card__body) {
      padding: 16px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
}

.cover-uploader {
  width: 100%;
  
  :deep(.el-upload) {
    width: 100%;
    height: 160px;
    border: 1px dashed var(--border-color);
    border-radius: var(--radius-lg);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.3s ease;

    &:hover {
      border-color: var(--brand-primary);
    }
  }

  .cover-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-uploader-icon {
    font-size: 28px;
    color: var(--text-placeholder);
  }
}

.stats-list {
  .stat-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: var(--text-tertiary);
      font-size: 13px;
    }

    .value {
      color: var(--text-primary);
      font-size: 13px;
      font-weight: 500;
    }
  }
}
@media (max-width: 768px) {
  .article-editor { height: auto; min-height: 100%; flex-direction: column; }
  .article-editor .main-editor { min-width: 0; }
  .article-editor .editor-header { align-items: flex-start; flex-direction: column; gap: var(--space-3); }
  .article-editor .header-actions { flex-wrap: wrap; }
  .article-editor .editor-card { min-height: 55vh; }
  .sidebar-settings { width: 100%; max-height: none; overflow: visible; }
  .wang-toolbar { overflow-x: auto; }
}
</style>
