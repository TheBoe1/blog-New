<template>
  <aside class="column column-right">
    <slot name="top" />

    <template v-if="showDefaultWidgets">
      <div class="card widget">
        <div class="card-content">
          <h3 class="widget-title">最新文章</h3>
          <el-skeleton :loading="isLoading" animated>
            <template #template>
              <div v-for="i in 5" :key="i" class="widget-post">
                <el-skeleton-item variant="text" style="width: 60px; margin-bottom: 6px;" />
                <el-skeleton-item variant="text" style="width: 92%; margin-bottom: 6px;" />
                <el-skeleton-item variant="text" style="width: 50px;" />
              </div>
            </template>
            <article v-for="article in recentArticles" :key="article.id" class="widget-post">
              <p class="widget-post-date">{{ formatDate(article.createTime) }}</p>
              <router-link :to="`/article/${article.slug || article.id}`" class="widget-post-title">
                {{ article.title }}
              </router-link>
              <p v-if="article.categoryName" class="widget-post-category">
                <router-link :to="`/category/${article.categoryId}`">{{ article.categoryName }}</router-link>
              </p>
            </article>
          </el-skeleton>
        </div>
      </div>

      <div v-if="categories.length" class="card widget">
        <div class="card-content">
          <h3 class="widget-title">分类</h3>
          <ul class="menu-list">
            <li v-for="cat in categories" :key="cat.id">
              <router-link :to="`/category/${cat.id}`" class="level is-mobile">
                <span class="level-start">
                  <span class="level-item">{{ cat.name }}</span>
                </span>
                <span class="level-end">
                  <span class="level-item tag">{{ cat.articleCount }}</span>
                </span>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBlogStore } from '@/stores/blog'

withDefaults(defineProps<{ showDefaultWidgets?: boolean }>(), { showDefaultWidgets: true })

const blogStore = useBlogStore()

const recentArticles = computed(() => blogStore.recentArticles.slice(0, 5))
const categories = computed(() => blogStore.categories)
const isLoading = computed(() => blogStore.loading && recentArticles.value.length === 0)

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-')
}
</script>

<style scoped lang="scss">
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

.widget-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-2);
}

.widget-post {
  padding: var(--space-2) 0;

  .widget-post-date {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    margin-bottom: 2px;
  }

  .widget-post-title {
    display: block;
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    text-decoration: none;
    line-height: 1.4;
    margin-bottom: 2px;

    &:hover { color: var(--brand-primary); }
  }

  .widget-post-category a {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
    text-decoration: none;
    &:hover { color: var(--brand-primary); }
  }
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
  line-height: 1.25;

  li ul {
    border-left: 1px solid var(--border-color);
    margin: 0.75em;
    padding-left: 0.75em;
  }

  .level {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    margin-bottom: 0;
    border-radius: 2px;
    padding: 0.5em 0.75em 0.5em 1.25em;
    color: var(--text-secondary);
    text-decoration: none;
    border-left: 3px solid transparent;
    transition: all 0.3s ease;

    &::before {
      content: '▸';
      position: absolute;
      left: 0.25em;
      opacity: 0;
      color: var(--brand-primary);
      transition: all 0.3s ease;
    }

    .level-start,
    .level-end {
      display: flex;
      align-items: center;
      flex-shrink: 1;
    }

    .level-item {
      align-items: center;
      display: flex;
      justify-content: center;
      font-size: var(--font-size-sm);
      transition: color 0.3s ease;
    }

    .level-end .level-item.tag {
      background: var(--bg-tertiary);
      color: var(--text-tertiary);
      border-radius: 4px;
      font-size: 0.75rem;
      height: 2em;
      padding: 0 0.75em;
      line-height: 1.5;
      transition: all 0.3s ease;
    }

    &:hover {
      background: var(--brand-tint-hover);
      border-left: 2px solid var(--brand-primary);
      color: var(--brand-primary);
      transform: translateX(10px);

      &::before {
        opacity: 1;
        left: 0.4em;
      }
    }

    &.is-active {
      background: var(--brand-tint);
      border-left: 2px solid var(--brand-primary);
      color: var(--brand-primary);
      transform: translateX(10px);

      &::before {
        opacity: 1;
        left: 0.4em;
      }
    }
  }
}

// ── Reduced motion: kill the selected-state shift + arrow slide ──
@media (prefers-reduced-motion: reduce) {
  .menu-list .level,
  .menu-list .level::before {
    transition: none !important;
  }

  .menu-list .level {
    transform: none !important;
  }
}
</style>
