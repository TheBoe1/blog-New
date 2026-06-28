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
          <MdPreview
            v-if="isMarkdown"
            :editorId="editorId"
            :modelValue="articleContent"
            :theme="theme"
            previewTheme="github"
            codeTheme="github"
          />
          <div v-else v-html="article.htmlContent"></div>
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

    <div v-if="loading && !article.id" class="card">
      <div class="card-content">
        <p class="loading-text">加载中...</p>
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
import { ElMessage } from 'element-plus'
import { MdPreview, MdCatalog } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { useBlogStore } from '@/stores/blog'
import { articleApi } from '@/api/article'
import { isHtmlContent, htmlToMarkdown } from '@/utils/markdown'
import BlogLayout3Col from '@/components/BlogLayout3Col.vue'

const route = useRoute()
const blogStore = useBlogStore()

const editorId = 'article-md-preview'
const scrollElement = document.documentElement

const theme = ref('light')
const loading = ref(false)

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
    color: '#ffffff',
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
  await blogStore.fetchTags()
  await blogStore.fetchCategories()
  await blogStore.fetchArticles({ page: 1, pageSize: 50, sortBy: 'createTime', sortOrder: 'desc' })
  const identifier = route.params.slug as string
  if (identifier) {
    await loadArticle(identifier)
  }
})
</script>

<style scoped lang="scss">
// ── Gradient tokens (lexburner signature: #667eea → #764ba2 → #f093fb) ──
$grad-brand: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
$grad-brand-h: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
$grad-brand-soft: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
$grad-brand-soft-h: linear-gradient(135deg, rgba(102, 126, 234, 0.18) 0%, rgba(240, 147, 251, 0.18) 100%);

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
    font-size: var(--text-3xl);
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
      transition: transform 0.3s ease, color 0.3s ease;
    }

    &:hover .fas {
      transform: translateX(5px);
      color: var(--brand-primary);
    }
  }

  .article-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    font-size: var(--text-xs);
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
        transition: transform 0.3s ease, color 0.3s ease;
      }

      &:hover .far,
      &:hover .fas {
        transform: rotate(360deg);
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

// ── Article content (lexburner gradient typography) ─────
.article-content {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-primary);
  animation: fadeInUp 0.6s ease-out 0.3s both;

  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    scroll-margin-top: 80px;
    position: relative;
    padding-left: 1rem;
  }

  :deep(h1)::before,
  :deep(h2)::before,
  :deep(h3)::before,
  :deep(h4)::before,
  :deep(h5)::before,
  :deep(h6)::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: $grad-brand;
    border-radius: 2px;
  }

  :deep(h2) {
    font-size: 1.5em;
    font-weight: 600;
    margin: var(--space-8) 0 var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-color);
  }

  :deep(h3) {
    font-size: 1.25em;
    font-weight: 600;
    margin: var(--space-6) 0 var(--space-3);
  }

  :deep(h4) {
    font-size: 1.125em;
    font-weight: 600;
    margin: var(--space-5) 0 var(--space-3);
  }

  :deep(h5) {
    font-size: 1em;
    font-weight: 600;
    margin: var(--space-4) 0 var(--space-2);
  }

  :deep(p) {
    margin: var(--space-4) 0;
  }

  // Gradient text links with animated underline
  :deep(a) {
    background: $grad-brand-h;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
    transition: all 0.3s ease;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: $grad-brand-h;
      transition: width 0.3s ease;
    }

    &:hover::after { width: 100%; }
  }

  // Inline code: gradient bg + hover scale
  :deep(code) {
    font-family: 'Source Code Pro', 'Consolas', monospace;
    font-size: 0.9em;
    background: $grad-brand-soft;
    color: #667eea;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-weight: 500;
    border: 1px solid rgba(102, 126, 234, 0.2);
    transition: all 0.3s ease;

    &:hover {
      background: $grad-brand-soft-h;
      transform: scale(1.05);
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
    }
  }

  :deep(pre) {
    margin: var(--space-4) 0;
    padding: var(--space-4);
    background: #1e1e1e;
    border-radius: var(--radius-lg);
    overflow-x: auto;
    font-size: 0.85em;

    code {
      background: transparent;
      padding: 0;
      color: #d4d4d4;
      font-size: 1em;
      -webkit-text-fill-color: #d4d4d4;
      border: none;

      &:hover {
        background: transparent;
        transform: none;
        box-shadow: none;
      }
    }
  }

  // Blockquote: gradient bg + 5px border + quote mark
  :deep(blockquote) {
    background: $grad-brand-soft;
    border-left: 5px solid #667eea;
    padding: var(--space-4) var(--space-5);
    margin: var(--space-4) 0;
    border-radius: var(--radius-sm);
    position: relative;
    color: var(--text-secondary);

    &::before {
      content: '"';
      position: absolute;
      top: -10px;
      left: 10px;
      font-size: 3rem;
      color: rgba(102, 126, 234, 0.3);
      font-family: Georgia, serif;
      line-height: 1;
    }

    p { margin: var(--space-1) 0; }
  }

  // Images: load animation + hover zoom
  :deep(img) {
    max-width: 100%;
    border-radius: var(--radius-md);
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    animation: imageLoad 0.5s ease-out;

    &:hover {
      transform: scale(1.02) translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.12);
      filter: brightness(1.02);
      z-index: 10;
      position: relative;
    }
  }

  :deep(ul),
  :deep(ol) {
    margin: var(--space-4) 0;
    padding-left: var(--space-6);
  }

  :deep(li) {
    margin: var(--space-2) 0;
  }

  // Tables: gradient header + hover row
  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: var(--space-4) 0;
    border-radius: var(--radius-lg);
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    thead tr {
      background: $grad-brand;

      th {
        color: #fff;
        font-weight: 600;
        padding: var(--space-3) var(--space-4);
        text-align: left;
        border: none;
      }
    }

    tbody tr {
      transition: all 0.3s ease;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);

      &:hover {
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.05) 100%);
        transform: scale(1.01);
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
      }

      td {
        padding: 0.75rem 1rem;
        border: none;
      }

      &:nth-child(even) {
        background-color: rgba(0, 0, 0, 0.02);
      }
    }
  }
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
  transition: transform 0.3s ease, border-left-color 0.3s ease, background 0.3s ease;

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
    transform: translateX(5px);
    border-left-color: var(--brand-primary);
    background: var(--bg-tertiary);
  }

  .licensing-title {
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-3);
    border-bottom: 1px dashed var(--border-color);

    .licensing-name {
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-1);
    }

    .licensing-link {
      font-size: var(--text-xs);
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
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: var(--space-1);
        font-weight: 600;
      }

      p {
        font-size: var(--text-sm);
        color: var(--text-primary);
        margin: 0;
      }

      .licensing-icons {
        display: flex;
        gap: var(--space-2);
        font-size: var(--text-lg);
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

// ── Tags: gradient underline on hover ───────────────────
.article-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-5);
  font-size: var(--text-xs);
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
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  text-decoration: none;
  background: var(--bg-tertiary);
  position: relative;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #ff6b6b, #f06595, #cc5de8, #845ef7, #5c7cfa, #339af0);
    transition: width 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    color: var(--brand-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }

  &:hover::before { width: 100%; }
}

.article-actions {
  display: flex;
  gap: var(--space-3);

  :deep(.el-button) {
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }

    .el-icon {
      transition: transform 0.3s ease;
    }

    &:hover .el-icon {
      transform: translateX(3px);
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
    font-size: var(--text-sm);
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
// ▸ arrow slide-in + gradient bg + 3px left border + translateX.
.widget-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-color);
}

.toc {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  font-size: var(--text-sm);

  :deep(ol) {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }

  :deep(li) {
    margin: var(--space-1) 0;
  }

  :deep(a) {
    display: block;
    position: relative;
    padding: 0.5em 0.75em 0.5em 1.25em;
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: 2px;
    border-left: 3px solid transparent;
    transition: color 0.3s ease, border-left-color 0.3s ease, transform 0.3s ease, background 0.3s ease;
    -webkit-text-fill-color: var(--text-secondary);

    // ▸ arrow — slides in from left on hover/active (same as SidebarRight .menu-list)
    &::before {
      content: '▸';
      position: absolute;
      left: 0.25em;
      opacity: 0;
      color: var(--brand-primary);
      transition: left 0.3s ease, opacity 0.3s ease;
    }

    &:hover {
      color: var(--brand-primary);
      background: linear-gradient(90deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
      border-left-color: var(--brand-primary);
      transform: translateX(6px);
      -webkit-text-fill-color: var(--brand-primary);

      &::before {
        opacity: 1;
        left: 0.4em;
      }
    }
  }

  // Active (current heading in viewport) — same visual as hover
  :deep(.md-editor-catalog-active > a),
  :deep(a.md-editor-catalog-active),
  :deep(.md-editor-catalog-active) {
    color: var(--brand-primary) !important;
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%) !important;
    border-left-color: var(--brand-primary) !important;
    font-weight: 600;
    transform: translateX(6px);
    -webkit-text-fill-color: var(--brand-primary) !important;

    &::before {
      opacity: 1 !important;
      left: 0.4em !important;
    }
  }

  :deep(.level-2) {
    font-weight: 600;
  }

  :deep(.level-3) {
    padding-left: var(--space-4);
    font-size: 0.9em;
  }

  :deep(.level-4) {
    padding-left: var(--space-6);
    font-size: 0.85em;
  }
}

.loading-text {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-tertiary);
}

// ── Keyframes (lexburner signature) ─────────────────────
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
  .article-header .article-title { font-size: var(--text-2xl); }
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
  .article-content :deep(img) {
    transition: none !important;
    transform: none !important;
  }
}
</style>
