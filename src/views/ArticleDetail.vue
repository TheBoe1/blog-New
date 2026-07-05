<template>
  <BlogLayout3Col :show-sidebar-widgets="false">
    <template #top>
      <div v-if="isMarkdown && hasToc" class="card widget">
        <div class="card-content">
          <h3 class="widget-title">目录</h3>
          <MdCatalog
            :editorId="editorId"
            :modelValue="articleContent"
            :scrollElement="scrollElement"
            :theme="theme"
            class="toc"
          />
        </div>
      </div>
    </template>

    <article v-if="article.id" class="card article-detail">
      <div class="card-content">
        <header class="article-header">
          <h1 class="article-title">
            <i class="fas fa-angle-double-right"></i>
            <span>{{ article.title }}</span>
          </h1>
          <div class="article-meta">
            <span class="meta-item">
              <i class="far fa-calendar-alt"></i>
              <time>{{ formatDate(article.createTime) }}</time>
            </span>
            <span v-if="article.updateTime && article.updateTime !== article.createTime" class="meta-item is-hidden-mobile">
              <i class="far fa-calendar-check"></i>
              <time>{{ formatDate(article.updateTime) }}</time>
            </span>
            <span v-if="article.categoryName" class="meta-item">
              <router-link :to="`/category/${article.categoryId}`" class="meta-link">
                {{ article.categoryName }}
              </router-link>
            </span>
            <span class="meta-item">
              <i class="far fa-eye"></i>
              {{ article.viewCount }} 阅读
            </span>
            <span class="meta-item">{{ readingTime }} 分钟读完 (大约{{ wordCount }}个字)</span>
          </div>
        </header>

        <div class="article-content">
          <div class="markdown-content" v-if="isMarkdown">
            <MdPreview
              :editorId="editorId"
              :modelValue="articleContent"
              :theme="theme"
              previewTheme="github"
              codeTheme="github"
            />
          </div>
          <div class="markdown-content" v-else v-html="article.htmlContent"></div>
        </div>

        <footer class="article-footer">
          <div class="article-licensing">
            <div class="licensing-title">
              <p class="licensing-name">{{ article.title }}</p>
              <a class="licensing-link" :href="permalink" target="_blank" rel="noopener">{{ permalink }}</a>
            </div>
            <div class="licensing-meta">
              <div class="meta-block">
                <h6>作者</h6>
                <p>{{ article.author || article.authorName || '佚名' }}</p>
              </div>
              <div class="meta-block">
                <h6>发布于</h6>
                <p>{{ formatDate(article.createTime) }}</p>
              </div>
              <div class="meta-block">
                <h6>更新于</h6>
                <p>{{ formatDate(article.updateTime) }}</p>
              </div>
              <div class="meta-block">
                <h6>许可协议</h6>
                <p class="licensing-icons">
                  <i class="fab fa-creative-commons" title="Creative Commons"></i>
                  <i class="fab fa-creative-commons-by" title="Attribution"></i>
                  <i class="fab fa-creative-commons-nc" title="Noncommercial"></i>
                </p>
              </div>
            </div>
          </div>

          <hr class="article-divider" />

          <div v-if="article.tags?.length" class="article-tags">
            <i class="fas fa-tags"></i>
            <router-link
              v-for="tag in article.tags"
              :key="tag"
              to="/articles"
              class="article-tag"
              :style="tagStyle(tag)"
            >{{ tag }}</router-link>
          </div>

          <div class="article-actions">
            <el-button @click="handleShare">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>
        </footer>
      </div>
    </article>

    <nav v-if="prevArticle || nextArticle" class="post-navigation">
      <router-link v-if="prevArticle" :to="`/article/${prevArticle.slug || prevArticle.id}`" class="nav-link nav-prev">
        <i class="fas fa-chevron-left"></i>
        <span>{{ prevArticle.title }}</span>
      </router-link>
      <router-link v-if="nextArticle" :to="`/article/${nextArticle.slug || nextArticle.id}`" class="nav-link nav-next">
        <span>{{ nextArticle.title }}</span>
        <i class="fas fa-chevron-right"></i>
      </router-link>
    </nav>

    <!-- 加载中：基于文章容器的骨架屏（非全局遮罩） -->
    <div v-if="loading && !article.id" class="card article-detail">
      <div class="card-content">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="h1" style="width: 62%; margin-bottom: 18px;" />
            <div class="skeleton-meta">
              <el-skeleton-item variant="text" style="width: 96px" />
              <el-skeleton-item variant="text" style="width: 72px" />
              <el-skeleton-item variant="text" style="width: 64px" />
              <el-skeleton-item variant="text" style="width: 120px" />
            </div>
            <el-skeleton-item variant="text" style="width: 100%; margin-top: 28px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-top: 14px;" />
            <el-skeleton-item variant="text" style="width: 94%; margin-top: 14px;" />
            <el-skeleton-item variant="text" style="width: 97%; margin-top: 14px;" />
            <el-skeleton-item variant="text" style="width: 88%; margin-top: 14px;" />
            <el-skeleton-item variant="text" style="width: 100%; margin-top: 14px;" />
            <el-skeleton-item variant="text" style="width: 70%; margin-top: 14px;" />
          </template>
        </el-skeleton>
      </div>
    </div>

    <div v-if="!loading && !article.id" class="card">
      <div class="card-content">
        <p class="loading-text">文章不存在或已删除。</p>
      </div>
    </div>
  </BlogLayout3Col>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { MdPreview, MdCatalog } from 'md-editor-v3'
import { useBlogStore } from '@/stores/blog'
import { useThemeStore } from '@/stores/theme'
import { articleApi } from '@/api/article'
import { isHtmlContent, htmlToMarkdown } from '@/utils/markdown'
import BlogLayout3Col from '@/components/BlogLayout3Col.vue'

const route = useRoute()
const blogStore = useBlogStore()

const editorId = 'article-md-preview'
const scrollElement = document.documentElement

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
// md-editor-v3 预览主题跟随站点暗色模式（写死 light 会导致暗色下正文不可读）
const theme = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'))
const loading = ref(true)

const article = ref<any>({
  id: '',
  title: '',
  categoryName: '',
  categoryId: '',
  tags: [],
  tagColor: {},
  htmlContent: '',
  markdownContent: '',
  content: '',
  contentType: 'markdown',
  createTime: '',
  updateTime: '',
  viewCount: 0,
  author: '',
  authorName: ''
})

const permalink = computed(() => {
  if (typeof window === 'undefined') return ''
  return window.location.href
})

const isMarkdown = computed(() => {
  return article.value.contentType === 'markdown' ||
    (article.value.markdownContent && article.value.markdownContent.trim()) ||
    (article.value.content && !isHtmlContent(article.value.content))
})

const articleContent = computed(() => {
  if (article.value.markdownContent && article.value.markdownContent.trim()) {
    return article.value.markdownContent
  }
  if (article.value.content && !isHtmlContent(article.value.content)) {
    return article.value.content
  }
  if (article.value.htmlContent && isHtmlContent(article.value.htmlContent)) {
    return htmlToMarkdown(article.value.htmlContent)
  }
  return ''
})

const wordCount = computed(() => {
  const text = (articleContent.value || article.value.summary || '')
    .replace(/<[^>]+>/g, '')
    .replace(/[#*`_\[\]()\-!]/g, '')
    .replace(/\s+/g, '')
  return text.length
})

const readingTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 500)))

const hasToc = computed(() => /(^|\n)#{1,4}\s/.test(articleContent.value))

const prevArticle = computed(() => findSibling(-1))
const nextArticle = computed(() => findSibling(1))

function findSibling(direction: 1 | -1): any | null {
  const list = blogStore.articles
  if (!list.length || !article.value.id) return null
  const idx = list.findIndex(a => a.id === article.value.id)
  if (idx === -1) return null
  const target = list[idx + direction]
  return target || null
}

function tagStyle(tagName: string): Record<string, string> {
  const colorMap: Record<string, string> = article.value.tagColor || {}
  const color = colorMap[tagName]
  if (!color) return {}
  return {
    color: 'var(--text-on-brand)',
    backgroundColor: color,
    borderColor: color
  }
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}

function handleShare() {
  navigator.clipboard.writeText(window.location.href)
  ElMessage.success('链接已复制')
}

async function loadArticle(identifier: string) {
  if (!identifier) return
  loading.value = true
  // 重置 article，确保切换文章时也显示骨架（loading && !article.id 命中）
  article.value = { id: '', tags: [], tagColor: {} } as any

  let result: any = null

  const looksLikeId = /^[0-9a-f-]{8,}$/i.test(identifier)
  if (!looksLikeId) {
    try {
      const slugResult = await articleApi.getBySlug(identifier)
      if (slugResult && slugResult.id) result = slugResult
    } catch {
      // slug lookup failed — fall through to id lookup
    }
  }

  if (!result) {
    try {
      result = await articleApi.getById(identifier)
    } catch (e) {
      console.error('Failed to fetch article:', e)
      result = null
    }
  }

  if (result && result.id) {
    article.value = {
      ...result,
      contentType: result.contentType || (isHtmlContent(result.content || '') ? 'html' : 'markdown')
    }
  } else {
    article.value = { id: '', tags: [], tagColor: {} } as any
  }

  loading.value = false
}

watch(() => route.params.slug, (val) => {
  if (val) loadArticle(val as string)
})

onMounted(async () => {
  const identifier = route.params.slug as string
  // 辅助数据（标签/分类/列表，供上下篇导航与标签色用）与正文并行，不阻塞首屏
  const auxiliary = Promise.allSettled([
    blogStore.fetchTags(),
    blogStore.fetchCategories(),
    blogStore.fetchArticles({ page: 1, pageSize: 50, sortBy: 'createTime', sortOrder: 'desc' })
  ])
  if (identifier) {
    await loadArticle(identifier)
  } else {
    loading.value = false
  }
  await auxiliary
})
</script>

<style scoped lang="scss">
/* Editorial Blue single-color tokens (DESIGN.md compliant, 过渡值) */
$grad-brand: var(--brand-primary);
$grad-brand-h: var(--brand-primary);
$grad-brand-soft: var(--brand-tint);
$grad-brand-soft-h: var(--brand-tint-hover);

// ── Card frame ──────────────────────────────────────────
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  color: var(--text-secondary);
  overflow: visible;
  border: 1px solid transparent;
  animation: fadeInUp 0.6s ease-out both;
}

.card + .card,
.post-navigation {
  margin-top: var(--space-6);
}

.card-content {
  padding: var(--space-6);
}

// ── Article header ──────────────────────────────────────
.article-header {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
  border-bottom: 1px solid var(--border-color);

  .article-title {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    font-size: var(--font-size-3xl);
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    position: relative;
    padding-bottom: var(--space-3);
    animation: fadeInUp 0.6s ease-out 0.1s both;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 3px;
      background: $grad-brand-h;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    &:hover::after { width: 100%; }

    .fas {
      color: var(--text-primary);
      font-size: 0.85em;
      transition: color 0.3s ease;
    }

    &:hover .fas {
      color: var(--brand-primary);
    }
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    animation: fadeInUp 0.6s ease-out 0.2s both;

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.3s ease;

      .far, .fas {
        opacity: 0.7;
        transition: color 0.3s ease;
      }

      &:hover .far,
      &:hover .fas {
        color: var(--brand-primary);
      }
    }

    .meta-link {
      color: var(--text-tertiary);
      text-decoration: none;
      &:hover { color: var(--brand-primary); }
    }

    .is-hidden-mobile { display: inline-flex; }
  }
}

// ── Article content (markdown 渲染交给全局 .markdown-content, 见 styles/markdown.scss) ──
.article-content {
  animation: fadeInUp 0.6s ease-out 0.3s both;
}

// ── Article footer ──────────────────────────────────────
.article-footer {
  margin-top: var(--space-12);
}

.article-licensing {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-left: 3px solid transparent;
  border-radius: var(--radius-md);
  padding: var(--space-5);
  position: relative;
  overflow: hidden;
  transition: border-left-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: $grad-brand;
    z-index: 0;
  }

  &::after {
    content: '\f25e';
    position: absolute;
    right: -40px;
    top: -60px;
    font-size: 200px;
    font-family: 'Font Awesome 5 Brands';
    opacity: 0.08;
    z-index: 0;
    pointer-events: none;
    color: var(--text-secondary);
    line-height: 1;
  }

  > * { position: relative; z-index: 1; }

  &:hover {
    border-left-color: var(--brand-primary);
    background: var(--bg-tertiary);
    box-shadow: var(--shadow-sm);
  }

  .licensing-title {
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px dashed var(--border-color);

    .licensing-name {
      font-size: var(--font-size-base);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .licensing-link {
      font-size: var(--font-size-xs);
      color: var(--text-tertiary);
      text-decoration: none;
      word-break: break-all;
      &:hover { color: var(--brand-primary); }
    }
  }

  .licensing-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--space-3);

    .meta-block {
      h6 {
        font-size: var(--font-size-xs);
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: var(--space-1);
        font-weight: 600;
      }

      p {
        font-size: var(--font-size-sm);
        color: var(--text-primary);
        margin: 0;
      }

      .licensing-icons {
        display: flex;
        gap: var(--space-2);
        font-size: var(--font-size-lg);
        color: var(--text-secondary);
      }
    }
  }
}

.article-divider {
  border: none;
  height: 1px;
  background: var(--border-color);
  margin: var(--space-5) 0;
}

// ── Tags: Editorial Blue underline on hover ───────────
.article-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;

  > .fas {
    color: var(--text-tertiary);
    opacity: 0.7;
  }
}

.article-tag {
  display: inline-block;
  padding: 2px 10px;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  text-decoration: none;
  background: var(--bg-tertiary);
  position: relative;
  transition: color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--brand-primary);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }

  &:hover {
    color: var(--brand-primary);
    border-color: var(--brand-primary);
    box-shadow: var(--shadow-sm);
  }

  &:hover::before { transform: scaleX(1); }
}

.article-actions {
  display: flex;
  gap: var(--space-3);

  :deep(.el-button) {
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: var(--shadow-sm);
    }
  }
}

// ── Post navigation (no inner wrapper — links sit directly in <nav>) ──
.post-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  color: var(--text-tertiary);
  flex-wrap: wrap;
  animation: fadeInUp 0.6s ease-out 0.4s both;

  .nav-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;
    padding: var(--space-3) var(--space-4);
    color: var(--text-tertiary);
    text-decoration: none;
    font-size: var(--font-size-sm);
    line-height: 1.4;
    transition: color 0.3s ease;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fas {
      color: var(--text-tertiary);
      transition: transform 0.3s ease, color 0.3s ease;
      flex-shrink: 0;
    }

    &:hover {
      color: var(--brand-primary);

      .fas { color: var(--brand-primary); }
    }

    &.nav-prev:hover .fas {
      transform: translateX(-5px);
    }

    &.nav-next {
      justify-content: flex-end;
      text-align: right;

      &:hover .fas {
        transform: translateX(5px);
      }
    }
  }
}

// ── TOC widget (right sidebar) ──────────────────────────
// Mirrors SidebarRight .menu-list .level animation:
// ▸ arrow slide-in + tint bg + 2px left border.
.widget-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
}

.toc {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  font-size: var(--font-size-sm);

  // 嵌套子目录缩进
  :deep(.md-editor-catalog-wrapper) {
    padding-left: var(--space-3);
  }

  // 目录项 = .md-editor-catalog-link > span（md-editor-v3 实际 DOM 结构）
  :deep(.md-editor-catalog-link) {
    > span {
      display: block;
      position: relative;
      padding: 0.4em 0.75em 0.4em 1.25em;
      color: var(--text-secondary);
      border-radius: 2px;
      border-left: 2px solid transparent;
      transition: color 0.2s ease, border-left-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
      cursor: pointer;
      line-height: 1.4;

      // ▸ 箭头滑入（同 SidebarRight .menu-list .level）
      &::before {
        content: '▸';
        position: absolute;
        left: 0.25em;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0;
        color: var(--brand-primary);
        transition: left 0.3s ease, opacity 0.3s ease;
      }

      // 覆盖 md-editor-v3 默认绿色 hover (#73d13d)
      &:hover {
        color: var(--brand-primary);
      }
    }

    &:hover > span {
      color: var(--brand-primary);
      background: var(--brand-tint);
      border-left-color: var(--brand-primary);
      transform: translateX(10px);

      &::before {
        opacity: 1;
        left: 0.4em;
      }
    }
  }

  // 当前滚动位置对应的标题 — 覆盖 md-editor-v3 默认绿色 active (#73d13d)
  :deep(.md-editor-catalog-active) > span {
    color: var(--brand-primary) !important;
    background: var(--brand-tint) !important;
    border-left-color: var(--brand-primary) !important;
    font-weight: 600;
    transform: translateX(10px);

    &::before {
      opacity: 1 !important;
      left: 0.4em !important;
    }
  }

  // 左侧滚动指示条 — 移除 md-editor-v3 默认绿色指示条
  :deep(.md-editor-catalog-indicator) {
    display: none !important;
  }
}

.skeleton-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: 4px;
}

.loading-text {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-tertiary);
}

// ── Keyframes (Editorial Blue accent, DESIGN.md compliant) ─────────
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes imageLoad {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// ── Responsive ──────────────────────────────────────────
@media (max-width: 768px) {
  .article-header .article-title { font-size: var(--font-size-2xl); }
  .article-header .article-meta .is-hidden-mobile { display: none; }

  .post-navigation {
    flex-direction: column;

    .nav-end { text-align: left; }

    .nav-link, &.nav-next {
      flex-direction: row;
      width: 100%;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .article-title,
  .article-meta,
  .article-content,
  .post-navigation {
    animation: none !important;
  }

  .article-title .fas,
  .article-tag,
  .nav-link,
  .article-content :deep(img),
  .article-content :deep(code),
  .article-content :deep(table tbody tr),
  .article-licensing,
  .toc :deep(.md-editor-catalog-link) > span {
    transition: none !important;
    transform: none !important;
  }
}
</style>
