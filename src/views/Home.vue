<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="hero-decoration">
        <div class="decoration-circle circle-1"></div>
        <div class="decoration-circle circle-2"></div>
        <div class="decoration-circle circle-3"></div>
        <div class="decoration-dots"></div>
      </div>
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">
            <span class="gradient-text">探索技术</span>
            <br />
            分享成长
          </h1>
          <p class="hero-description">
            记录学习历程，分享技术心得，与志同道合的朋友一起成长
          </p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="goToArticles">
              <el-icon><Reading /></el-icon>
              浏览文章
            </el-button>
            <el-button size="large" @click="goToAbout">
              <el-icon><InfoFilled /></el-icon>
              了解更多
            </el-button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.articleCount }}</div>
              <div class="stat-label">篇文章</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><FolderOpened /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.categoryCount }}</div>
              <div class="stat-label">个分类</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <el-icon><View /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.viewCount }}</div>
              <div class="stat-label">次浏览</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <div class="section-title">
          <div class="title-decoration"></div>
          <h2>最新文章</h2>
          <span class="section-subtitle">Latest Articles</span>
        </div>
        <el-button type="primary" link @click="goToArticles" class="more-btn">
          查看更多 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      
      <div class="article-grid">
        <el-card
          v-for="article in recentArticles"
          :key="article.id"
          shadow="hover"
          :class="['article-card', { 'article-card-no-cover': !article.cover }]"
          @click="goToArticle(article.id)"
        >
          <div class="article-cover" v-if="article.cover">
            <img :src="article.cover" :alt="article.title" />
            <div class="cover-overlay">
              <el-icon class="read-icon"><Reading /></el-icon>
            </div>
          </div>
          <div class="article-info">
            <div class="article-meta-top">
              <el-tag size="small" effect="plain" class="category-tag">
                <el-icon><Folder /></el-icon>
                {{ article.categoryName }}
              </el-tag>
              <span class="reading-time">
                <el-icon><Clock /></el-icon>
                {{ getReadingTime(article.content || article.summary) }} 分钟
              </span>
            </div>
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary }}</p>
            <div class="article-tags-position">
              <el-tag
                v-for="tag in (article.tags || []).slice(0, 3)"
                :key="tag"
                :color="getTagColor(article, tag)" 
                style="border: none; color: white;"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
          
          <template #footer>
            <div class="article-footer">
              <span class="footer-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(article.createTime) }}
              </span>
              <span class="footer-item">
                <el-icon><View /></el-icon>
                {{ article.viewCount }}
              </span>
            </div>
          </template>
        </el-card>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <div class="section-title">
          <div class="title-decoration"></div>
          <h2>分类导航</h2>
          <span class="section-subtitle">Categories</span>
        </div>
      </div>
      
      <div class="category-grid">
        <div
          v-for="category in displayCategories"
          :key="category.id"
          class="category-card"
          @click="goToCategory(category.id)"
        >
          <div class="category-icon" :style="{ background: category.color }">
            <el-icon :size="32"><component :is="category.icon" /></el-icon>
          </div>
          <el-tooltip :content="category.name" placement="top" :disabled="category.name.length <= 6">
            <div class="category-info">
              <h4>{{ category.name }}</h4>
              <p>{{ category.articleCount }} 篇文章</p>
            </div>
          </el-tooltip>
          <div class="category-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'

const router = useRouter()
const blogStore = useBlogStore()

const stats = ref({
  articleCount: 0,
  categoryCount: 0,
  viewCount: 0
})

const recentArticles = computed(() => blogStore.recentArticles)

const categoryStyles: Record<string, { color: string; icon: string }> = {
  '1': { color: 'linear-gradient(135deg, #409eff 0%, #337ecc 100%)', icon: 'Monitor' },
  '2': { color: 'linear-gradient(135deg, #67c23a 0%, #529b2e 100%)', icon: 'DataAnalysis' },
  '3': { color: 'linear-gradient(135deg, #e6a23c 0%, #c48a2e 100%)', icon: 'Coin' },
  '4': { color: 'linear-gradient(135deg, #909399 0%, #73767a 100%)', icon: 'Setting' },
  '5': { color: 'linear-gradient(135deg, #f56c6c 0%, #c45656 100%)', icon: 'More' }
}

const displayCategories = computed(() => {
  return blogStore.categories.map(cat => ({
    ...cat,
    color: categoryStyles[cat.id]?.color || 'linear-gradient(135deg, #409eff 0%, #337ecc 100%)',
    icon: categoryStyles[cat.id]?.icon || 'Folder'
  }))
})

function goToArticles() {
  router.push('/articles')
}

function goToAbout() {
  router.push('/about')
}

function goToArticle(id: string) {
  router.push(`/article/${id}`)
}

function getTagColor(article: any, tagName: string): string {
  if (article.tagColor && article.tagColor[tagName]) {
    return article.tagColor[tagName]
  }
  return 'var(--tag-default-color)'
}

function goToCategory(id: string) {
  router.push(`/category/${id}`)
}

function formatDate(date: string) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function getReadingTime(content: string): number {
  if (!content) return 1
  const text = content.replace(/<[^>]+>/g, '').replace(/[#*`_\[\]]/g, '')
  return Math.max(1, Math.ceil(text.length / 500))
}

onMounted(async () => {
  await blogStore.fetchArticles({ page: 1, pageSize: 4, sortBy: 'createTime', sortOrder: 'desc' })
  await blogStore.fetchCategories()
  stats.value = {
    articleCount: blogStore.articleCount,
    categoryCount: blogStore.categoryCount,
    viewCount: blogStore.articles.reduce((sum, article) => sum + article.viewCount, 0)
  }
})
</script>

<style scoped lang="scss">
.home-page {
  --home-bg: #f4f7f9;
  --home-text: #333333;
  --home-text-secondary: #606266;
  --home-text-muted: #909399;
  --home-border: #e4e7ed;
  --home-card-bg: #ffffff;
  --home-accent: var(--el-color-primary);
  --home-accent-light: rgba(64, 158, 255, 0.1);
  --home-accent-medium: rgba(64, 158, 255, 0.15);
  --home-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
  --home-shadow-md: 0 4px 16px rgba(0, 0, 0, 0.06);
  --home-shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.08);

  .hero-section {
    background: var(--home-card-bg);
    border-radius: 20px;
    padding: 60px 50px;
    margin-bottom: 48px;
    color: var(--home-text);
    border: 1px solid var(--home-border);
    position: relative;
    overflow: hidden;
    box-shadow: var(--home-shadow-md);

    .hero-decoration {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;

      .decoration-circle {
        position: absolute;
        border-radius: 50%;
        opacity: 0.6;
      }

      .circle-1 {
        width: 400px;
        height: 400px;
        background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(64, 158, 255, 0.02) 100%);
        top: -100px;
        right: -100px;
        animation: float 8s ease-in-out infinite;
      }

      .circle-2 {
        width: 200px;
        height: 200px;
        background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.02) 100%);
        bottom: -50px;
        left: 10%;
        animation: float 6s ease-in-out infinite reverse;
      }

      .circle-3 {
        width: 150px;
        height: 150px;
        background: linear-gradient(135deg, rgba(230, 162, 60, 0.1) 0%, rgba(230, 162, 60, 0.02) 100%);
        top: 30%;
        right: 20%;
        animation: float 7s ease-in-out infinite;
      }

      .decoration-dots {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 100px;
        height: 100px;
        background-image: radial-gradient(rgba(64, 158, 255, 0.15) 1px, transparent 1px);
        background-size: 12px 12px;
        opacity: 0.8;
      }
    }

    .hero-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .hero-text {
      max-width: 560px;

      .hero-title {
        font-size: 64px;
        font-weight: 800;
        line-height: 1.15;
        margin-bottom: 20px;
        color: var(--home-text);
        letter-spacing: -0.5px;

        .gradient-text {
          color: var(--home-accent);
        }
      }

      .hero-description {
        font-size: 17px;
        color: var(--home-text-secondary);
        margin-bottom: 32px;
        line-height: 1.7;
      }

      .hero-actions {
        display: flex;
        gap: 14px;

        .el-button {
          padding: 12px 28px;
          font-weight: 500;
          
          .el-icon {
            margin-right: 6px;
          }
        }
      }
    }

    .hero-stats {
      display: flex;
      gap: 20px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 20px 24px;
        background: var(--home-card-bg);
        border-radius: 16px;
        border: 1px solid var(--home-border);
        box-shadow: var(--home-shadow-sm);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--home-shadow-md);
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--home-accent-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--home-accent);
          font-size: 22px;
        }

        .stat-content {
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--home-text);
            line-height: 1.2;
          }

          .stat-label {
            font-size: 13px;
            color: var(--home-text-muted);
            margin-top: 2px;
          }
        }
      }
    }
  }

  .content-section {
    margin-bottom: 48px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 16px;

        .title-decoration {
          width: 4px;
          height: 28px;
          background: linear-gradient(180deg, var(--home-accent) 0%, #67c23a 100%);
          border-radius: 2px;
        }

        h2 {
          font-size: 26px;
          font-weight: 700;
          color: var(--home-text);
          margin: 0;
        }

        .section-subtitle {
          font-size: 14px;
          color: var(--home-text-muted);
          font-weight: 400;
          letter-spacing: 1px;
        }
      }

      .more-btn {
        font-weight: 500;
        
        .el-icon {
          margin-left: 4px;
          transition: transform 0.3s ease;
        }

        &:hover .el-icon {
          transform: translateX(4px);
        }
      }
    }
  }

  .article-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 28px;

    .article-card {
      cursor: pointer;
      transition: all 0.35s ease;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--home-border);

      &.article-card-no-cover {
        .article-info {
          padding: 24px;
        }
      }

      &:hover {
        transform: translateY(-6px);
        box-shadow: var(--home-shadow-lg);

        .article-cover .cover-overlay {
          opacity: 1;
        }

        .article-cover img {
          transform: scale(1.05);
        }
      }

      :deep(.el-card__body) {
        padding: 0;
        display: flex;
        flex-direction: column;
        flex: 1; 
      }

      .article-cover {
        height: 200px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%);
        position: relative;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .cover-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;

          .read-icon {
            font-size: 48px;
            color: white;
          }
        }

        &.article-cover-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--home-text-muted);
        }
      }

      .article-info {
        display: flex;
        flex-direction: column; 
        padding: 20px 24px;
        flex: 1;
        
        .article-meta-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;

          .category-tag {
            .el-icon {
              margin-right: 4px;
            }
          }

          .reading-time {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: var(--home-text-muted);

            .el-icon {
              font-size: 14px;
            }
          }
        }

        .article-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--home-text);
          margin: 0 0 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          line-height: 1.4;
        }

        .article-summary {
          font-size: 14px;
          color: var(--home-text-secondary);
          line-height: 1.7;
          margin: 0 0 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-tags-position {
          margin-top: auto;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 6px;
        }
      }

      :deep(.el-card__footer) {
        padding: 14px 24px;
        border-top: 1px solid var(--home-border);
        background: #fafbfc;

        .article-footer {
          display: flex;
          justify-content: space-between;
          width: 100%;

          .footer-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--home-text-muted);

            .el-icon {
              font-size: 14px;
            }
          }
        }
      }
    }
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--grid-category-min), 1fr));
    gap: 20px;

    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 20px;
      background: var(--home-card-bg);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.35s ease;
      border: 1px solid var(--home-border);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--home-accent);
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }

      &:hover {
        border-color: var(--home-accent);
        box-shadow: var(--home-shadow-md);
        transform: translateY(-4px);

        &::before {
          transform: scaleX(1);
        }

        .category-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .category-arrow {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .category-icon {
        width: 68px;
        height: 68px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 18px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.3s ease;
      }

      .category-info {
        text-align: center;
        width: 100%;

        h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--home-text);
          margin: 0 0 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        p {
          font-size: 13px;
          color: var(--home-text-muted);
          margin: 0;
        }
      }

      .category-arrow {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%) translateX(-8px);
        opacity: 0;
        transition: all 0.3s ease;
        color: var(--home-accent);
        font-size: 18px;
      }
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

@media (max-width: 1200px) {
  .home-page {
    .category-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}

@media (max-width: 992px) {
  .home-page {
    .category-grid {
      grid-template-columns: repeat(3, 1fr);
    }
    
    .hero-section {
      padding: 40px 30px;
      
      .hero-text .hero-title {
        font-size: 48px;
      }

      .hero-stats {
        gap: 12px;

        .stat-item {
          padding: 14px 18px;

          .stat-icon {
            width: 40px;
            height: 40px;
          }

          .stat-content .stat-value {
            font-size: 22px;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .home-page {
    .article-grid {
      grid-template-columns: 1fr;
    }
    
    .category-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .hero-section {
      padding: 30px 20px;
      
      .hero-content {
        flex-direction: column;
        text-align: center;
      }

      .hero-text {
        .hero-title {
          font-size: 36px;
        }

        .hero-actions {
          justify-content: center;
        }
      }
      
      .hero-stats {
        margin-top: 28px;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
        
        .stat-item {
          padding: 12px 16px;
        }
      }
    }
  }
}
</style>
