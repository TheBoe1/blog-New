<template>
  <div class="article-editor">
    <div class="editor-header">
      <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <div class="header-actions">
        <span v-if="localDraftStatus" class="draft-status" role="status" aria-live="polite">
          {{ localDraftStatus }}
        </span>
        <el-radio-group v-model="editorType" size="small" :disabled="isEdit">
          <el-radio-button value="markdown">Markdown</el-radio-button>
          <el-radio-button value="richtext">富文本</el-radio-button>
        </el-radio-group>
        <el-tooltip v-if="isEdit" content="编辑模式下不可切换编辑器类型" placement="top">
          <el-icon class="edit-tip"><InfoFilled /></el-icon>
        </el-tooltip>
        <el-button :loading="loading" @click="handleSaveDraft">
          <el-icon><Document /></el-icon>
          保存草稿
        </el-button>
        <el-button type="primary" :loading="loading" @click="handlePublish">
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
          <div v-if="editorReady" class="editor-wrapper">
            <MarkdownEditor
              v-if="editorType === 'markdown'"
              v-model="form.markdownContent"
              placeholder="开始编写你的文章..."
              :article-hash="articleHash"
              @save="handleSaveDraft"
            />
            <template v-else>
              <WangToolbar
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                mode="default"
                class="wang-toolbar"
              />
              <WangEditor
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
                <img
                  v-if="form.cover"
                  :src="form.cover"
                  alt="文章封面预览"
                  class="cover-preview"
                  width="640"
                  height="320"
                  decoding="async"
                />
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
import { ref, computed, defineAsyncComponent, nextTick, onMounted, onBeforeUnmount, shallowRef, markRaw, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { useBlogStore } from '@/stores/blog'
import { useUserStore } from '@/stores/user'
import { articleApi } from '@/api/article'
import { htmlToMarkdown, isHtmlContent } from '@/utils/markdown'
import type { ArticleEditorForm } from '@/types'
import {
  createArticleDraftKey,
  readArticleDraft,
  removeArticleDraft,
  writeArticleDraft,
  type ArticleEditorDraft,
  type ArticleEditorType
} from '@/composables/articleDraftStorage'

const MarkdownEditor = defineAsyncComponent(() => import('@/components/MarkdownEditor.vue'))

let wangEditorModule: Promise<typeof import('@wangeditor/editor-for-vue')> | undefined
async function loadWangEditor() {
  await import('@wangeditor/editor/dist/css/style.css')
  wangEditorModule ||= import('@wangeditor/editor-for-vue')
  return wangEditorModule
}

const WangToolbar = defineAsyncComponent(() => loadWangEditor().then(module => module.Toolbar))
const WangEditor = defineAsyncComponent(() => loadWangEditor().then(module => module.Editor))

const route = useRoute()
const router = useRouter()
const blogStore = useBlogStore()
const userStore = useUserStore()

const isEdit = computed(() => !!route.params.id)

const editorRef = shallowRef<IDomEditor>()
const formRef = ref<FormInstance>()
const loading = ref(false)
const editorType = ref<ArticleEditorType>('markdown')
const editorReady = ref(!isEdit.value)
const articleHash = ref('')
const localDraftStatus = ref('')
const draftStorageKey = ref('')
const baseFingerprint = ref('')
const draftReady = ref(false)
const allowLeave = ref(false)
const storageWarningShown = ref(false)
let autosaveTimer: number | undefined

const DRAFT_AUTOSAVE_DELAY = 900
const DRAFT_MAX_AGE = 30 * 24 * 60 * 60 * 1000

function generateHash(): string {
  return 'article_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
}

const form = ref<ArticleEditorForm>({
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

function createFingerprint(
  formValue: ArticleEditorForm = form.value,
  type: ArticleEditorType = editorType.value
): string {
  return JSON.stringify({ form: formValue, editorType: type })
}

const isDirty = computed(() => {
  return draftReady.value && createFingerprint() !== baseFingerprint.value
})

function getDraftStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isRestorableForm(value: unknown): value is ArticleEditorForm {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ArticleEditorForm>
  return typeof candidate.title === 'string'
    && typeof candidate.content === 'string'
    && typeof candidate.htmlContent === 'string'
    && typeof candidate.markdownContent === 'string'
    && typeof candidate.summary === 'string'
    && typeof candidate.cover === 'string'
    && typeof candidate.categoryId === 'string'
    && typeof candidate.customCategory === 'string'
    && Array.isArray(candidate.tags)
    && candidate.tags.every(tag => typeof tag === 'string')
    && typeof candidate.isPublished === 'boolean'
    && typeof candidate.isTop === 'boolean'
    && typeof candidate.publishedAt === 'string'
    && (candidate.contentType === 'markdown' || candidate.contentType === 'html')
}

function formatDraftTime(savedAt: number): string {
  return new Date(savedAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function warnStorageUnavailable() {
  localDraftStatus.value = '本机保留失败'
  if (storageWarningShown.value) return
  storageWarningShown.value = true
  ElMessage.warning('无法在此浏览器保留编辑进度，请使用“保存草稿”')
}

function clearLocalDraft(): boolean {
  const storage = getDraftStorage()
  if (!storage || !draftStorageKey.value) return false
  return removeArticleDraft(storage, draftStorageKey.value)
}

function flushLocalDraft(): boolean {
  if (autosaveTimer !== undefined) {
    window.clearTimeout(autosaveTimer)
    autosaveTimer = undefined
  }
  if (!draftReady.value || !isDirty.value) return true

  const storage = getDraftStorage()
  if (!storage || !draftStorageKey.value) {
    warnStorageUnavailable()
    return false
  }

  const draft: ArticleEditorDraft<ArticleEditorForm> = {
    version: 1,
    savedAt: Date.now(),
    articleHash: articleHash.value,
    editorType: editorType.value,
    baseFingerprint: baseFingerprint.value,
    form: JSON.parse(JSON.stringify(form.value)) as ArticleEditorForm
  }

  if (!writeArticleDraft(storage, draftStorageKey.value, draft)) {
    warnStorageUnavailable()
    return false
  }

  localDraftStatus.value = `本机已保留 ${formatDraftTime(draft.savedAt)}`
  return true
}

function scheduleLocalDraft() {
  if (!draftReady.value) return

  if (!isDirty.value) {
    if (autosaveTimer !== undefined) {
      window.clearTimeout(autosaveTimer)
      autosaveTimer = undefined
    }
    clearLocalDraft()
    localDraftStatus.value = ''
    return
  }

  if (autosaveTimer !== undefined) window.clearTimeout(autosaveTimer)
  autosaveTimer = window.setTimeout(flushLocalDraft, DRAFT_AUTOSAVE_DELAY)
}

async function restoreLocalDraft() {
  const storage = getDraftStorage()
  if (!storage || !draftStorageKey.value) return

  const draft = readArticleDraft<ArticleEditorForm>(storage, draftStorageKey.value)
  if (!draft) {
    removeArticleDraft(storage, draftStorageKey.value)
    return
  }

  if (Date.now() - draft.savedAt > DRAFT_MAX_AGE || !isRestorableForm(draft.form)) {
    removeArticleDraft(storage, draftStorageKey.value)
    return
  }

  if (createFingerprint(draft.form, draft.editorType) === baseFingerprint.value) {
    removeArticleDraft(storage, draftStorageKey.value)
    return
  }

  const serverChanged = draft.baseFingerprint !== baseFingerprint.value
  const message = serverChanged
    ? `此设备保存了 ${formatDraftTime(draft.savedAt)} 的未提交内容，但服务器版本已有变化。恢复后请检查差异。`
    : `此设备保存了 ${formatDraftTime(draft.savedAt)} 的未提交内容，是否恢复上次进度？`

  try {
    await ElMessageBox.confirm(message, '发现未保存的编辑进度', {
      confirmButtonText: '恢复进度',
      cancelButtonText: '放弃本机进度',
      type: serverChanged ? 'warning' : 'info',
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false
    })
    editorType.value = draft.editorType
    articleHash.value = draft.articleHash || articleHash.value
    form.value = { ...draft.form }
    await nextTick()
    localDraftStatus.value = `已恢复 ${formatDraftTime(draft.savedAt)} 的进度`
  } catch {
    removeArticleDraft(storage, draftStorageKey.value)
    localDraftStatus.value = ''
  }
}

function handlePageHide() {
  flushLocalDraft()
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') flushLocalDraft()
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) return
  flushLocalDraft()
  event.preventDefault()
  event.returnValue = ''
}

watch([form, editorType], scheduleLocalDraft, { deep: true })

watch(isDirty, (dirty) => {
  if (dirty) {
    window.addEventListener('beforeunload', handleBeforeUnload)
  } else {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
})

onBeforeRouteLeave(async () => {
  if (allowLeave.value || !isDirty.value) return true

  // 退出登录或令牌失效时不能把用户困在已失效的编辑页，尽力落本机草稿后直接离开。
  if (!userStore.isLoggedIn) {
    flushLocalDraft()
    return true
  }

  if (!flushLocalDraft()) {
    ElMessage.error('本机进度保留失败，请先手动保存草稿')
    return false
  }

  try {
    await ElMessageBox.confirm(
      '本次编辑已保留在此设备，离开后可在再次打开时恢复。',
      '有未保存的更改',
      {
        confirmButtonText: '保留进度并离开',
        cancelButtonText: '继续编辑',
        type: 'warning',
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false
      }
    )
    return true
  } catch {
    return false
  }
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
  markCurrentVersionSaved()
  ElMessage.success('草稿保存成功')
  await router.push('/admin/articles')
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
  markCurrentVersionSaved()
  ElMessage.success(isEdit.value ? '文章更新成功' : '文章发布成功')
  await router.push('/admin/articles')
}

function markCurrentVersionSaved() {
  if (autosaveTimer !== undefined) {
    window.clearTimeout(autosaveTimer)
    autosaveTimer = undefined
  }
  baseFingerprint.value = createFingerprint()
  allowLeave.value = true
  clearLocalDraft()
  localDraftStatus.value = ''
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
          contentType: article.contentType || 'html'
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
      editorReady.value = true
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

  const draftOwner = userStore.user?.id || userStore.user?.username || 'admin'
  draftStorageKey.value = createArticleDraftKey(
    isEdit.value ? route.params.id as string : undefined,
    draftOwner
  )

  window.addEventListener('pagehide', handlePageHide)
  document.addEventListener('visibilitychange', handleVisibilityChange)
  await Promise.all([loadData(), loadArticle()])
  await nextTick()
  baseFingerprint.value = createFingerprint()
  await restoreLocalDraft()
  draftReady.value = true
})

onBeforeUnmount(() => {
  if (autosaveTimer !== undefined) window.clearTimeout(autosaveTimer)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('pagehide', handlePageHide)
  document.removeEventListener('visibilitychange', handleVisibilityChange)

  const editor = editorRef.value
  if (editor != null) editor.destroy()
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

    .draft-status {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      white-space: nowrap;
    }

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
