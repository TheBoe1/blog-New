<template>
  <div class="home-page">
    <BlogLayout3Col>
      <!-- 加载中：骨架屏（给后端反应时间，避免首屏闪现“还没有文章”） -->
      <template v-if="loading && !recentArticles.length">
        <div
          v-for="i in 3"
          :key="`skeleton-${i}`"
          class="card skeleton-card"
        >
          <div class="card-content">
            <el-skeleton animated>
              <template #template>
                <el-skeleton-item variant="h3" style="width: 62%; margin-bottom: 16px;" />
                <div class="skeleton-meta">
                  <el-skeleton-item variant="text" style="width: 88px" />
                  <el-skeleton-item variant="text" style="width: 64px" />
                  <el-skeleton-item variant="text" style="width: 96px" />
                </div>
                <el-skeleton-item variant="text" style="width: 100%; margin-top: 20px;" />
                <el-skeleton-item variant="text" style="width: 94%; margin-top: 12px;" />
                <el-skeleton-item variant="text" style="width: 76%; margin-top: 12px;" />
                <div class="skeleton-footer">
                  <el-skeleton-item variant="text" style="width: 120px" />
                  <el-skeleton-item variant="rect" style="width: 92px; height: 22px; border-radius: 4px;" />
                </div>
              </template>
            </el-skeleton>
          </div>
        </div>
      </template>

      <article
        v-for="article in recentArticles"
        :key="article.id"
        class="card article-card stagger-item"
      >
        <div class="card-content">
          <h2 class="article-title">
            <router-link :to="`/article/${article.slug || article.id}`">
              <i class="fas fa-angle-double-right"></i>{{ article.title }}
            </router-link>
          </h2>
          <div class="article-meta">
            <span class="meta-item">
              <i class="far fa-calendar-alt"></i>
              <time>{{ formatDate(article.createTime) }}</time>
            </span>
            <span v-if="article.categoryName" class="meta-item">
              <router-link :to="`/category/${article.categoryId}`" class="meta-link">
                {{ article.categoryName }}
              </router-link>
            </span>
            <span class="meta-item">{{ getReadingTime(article.content || article.summary) }} 分钟读完</span>
          </div>
          <div class="article-content">
            <p v-if="article.summary">{{ article.summary }}</p>
            <img
              v-if="article.cover"
              v-lazy-img="article.cover"
              :alt="article.title"
              class="article-cover"
            />
          </div>
          <hr class="article-divider" />
          <div class="article-footer">
            <div v-if="article.tags?.length" class="article-tags">
              <i class="fas fa-tags"></i>
              <router-link
                v-for="tag in article.tags.slice(0, 3)"
                :key="tag"
                to="/articles"
                class="article-tag"
              >{{ tag }}</router-link>
            </div>
            <router-link :to="`/article/${article.slug || article.id}`" class="article-more">
              <i class="fas fa-book-reader"></i>阅读更多
            </router-link>
          </div>
        </div>
      </article>

      <div v-if="!loading && !recentArticles.length" class="card empty-card">
        <div class="card-content">
          <p class="empty-text">还没有文章。</p>
        </div>
      </div>

      <nav v-if="hasMore" class="pagination stagger-item">
        <router-link to="/articles" class="pagination-next">下一页 →</router-link>
      </nav>
    </BlogLayout3Col>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useBlogStore } from '@/stores/blog'
import BlogLayout3Col from '@/components/BlogLayout3Col.vue'

const blogStore = useBlogStore()

const recentArticles = computed(() => blogStore.recentArticles)
const hasMore = computed(() => blogStore.articles.length >= 6)

// 首屏列表加载态：独立于 store.loading（后者在 categories/tags 请求间会反复跳变）
const loading = ref(true)

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}

function getReadingTime(content: string): number {
  if (!content) return 1
  const text = content.replace(/<[^>]+>/g, '').replace(/[#*`_\[\]]/g, '')
  return Math.max(1, Math.ceil(text.length / 500))
}

onMounted(async () => {
  // 辅助数据（分类/标签）与文章列表并行，不阻塞首屏骨架→内容的切换
  const auxiliary = Promise.allSettled([
    blogStore.fetchCategories(),
    blogStore.fetchTags()
  ])
  try {
    await blogStore.fetchArticles({ page: 1, pageSize: 6, sortBy: 'createTime', sortOrder: 'desc' })
  } finally {
    loading.value = false
  }
  await auxiliary
})
</script>

<style scoped lang="scss">
.home-page {
  padding-bottom: var(--space-12);
}

.card {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  color: var(--text-secondary);
  overflow: hidden;
}

.card + .card {
  margin-top: var(--space-6);
}

.card-content {
  padding: var(--space-6);
}

.article-title {
  position: relative;
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  font-family: 'Ubuntu', 'PingFang SC', 'Noto Sans SC', sans-serif;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 30%, transparent) 100%);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  &:hover::after {
    width: 100%;
  }

  a {
    color: var(--text-primary);
    text-decoration: none;
    transition: color 0.3s ease;

    .fas {
      display: inline-block;
      margin-right: var(--space-2);
      color: var(--brand-primary);
      font-size: 0.85em;
      transition: transform 0.3s ease, color 0.3s ease;
    }

    &:hover {
      color: var(--brand-primary);

      .fas {
        transform: translateX(5px);
      }
    }
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
  margin-bottom: var(--space-4);

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    .fas, .far {
      opacity: 0.7;
      transition: transform 0.3s ease, color 0.3s ease;
    }

    &:hover .fas,
    &:hover .far {
      transform: rotate(360deg);
      color: var(--brand-primary);
      opacity: 1;
    }
  }

  .meta-link {
    color: var(--text-tertiary);
    text-decoration: none;
    &:hover { color: var(--brand-primary); }
  }
}

.article-content {
  font-size: var(--font-size-base);
  line-height: 1.7;
  color: var(--text-secondary);

  p {
    margin-bottom: var(--space-3);
  }
}

.article-cover {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  margin: var(--space-3) 0;
}

.article-divider {
  border: none;
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.article-tags {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  line-height: 1.4;
  color: var(--text-tertiary);
  text-transform: uppercase;

  > .fas {
    opacity: 0.6;
  }
}

.article-tag {
  display: inline-block;
  position: relative;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--gradient-brand);
    transition: width 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    color: var(--brand-primary);

    &::before { width: 100%; }
  }
}

.article-more {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  line-height: 1.6;
  color: var(--text-secondary);
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-tertiary);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--text-primary) 15%, transparent), transparent);
    transition: left 0.5s ease;
    pointer-events: none;
  }

  i {
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);

    &::before { left: 100%; }
    i { transform: translateX(3px); }
  }

  &:visited {
    color: var(--text-secondary);
  }
}

.empty-card .empty-text {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-tertiary);
}

.skeleton-card {
  .skeleton-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .skeleton-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    margin-top: 20px;
    padding-top: 14px;
    border-top: 1px solid var(--border-color);
  }
}

.pagination {
  margin-top: var(--space-6);
  text-align: center;

  .pagination-next {
    display: inline-block;
    padding: 6px 16px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    color: var(--text-secondary);
    text-decoration: none;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;

    &:hover {
      background: var(--brand-primary);
      border-color: var(--brand-primary);
      color: var(--text-on-brand);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
  }
}

@media (max-width: 768px) {
  .article-title { font-size: 1.25rem; }
}

@media (prefers-reduced-motion: reduce) {
  .article-title::after,
  .article-title a,
  .article-title a .fas,
  .article-meta .meta-item .fas,
  .article-meta .meta-item .far,
  .article-tag,
  .article-tag::before,
  .article-more,
  .article-more::before,
  .article-more i,
  .pagination-next {
    transition: none !important;
    transform: none !important;
    animation: none !important;
  }
}
</style>
