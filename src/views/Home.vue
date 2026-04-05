<template>
  <div class="home-page">
    <div class="hero-section">
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
              浏览文章
            </el-button>
            <el-button size="large" @click="goToAbout">
              了解更多
            </el-button>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-value">{{ stats.articleCount }}</div>
            <div class="stat-label">篇文章</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.categoryCount }}</div>
            <div class="stat-label">个分类</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.viewCount }}</div>
            <div class="stat-label">次浏览</div>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <h2>最新文章</h2>
        <el-button type="primary" link @click="goToArticles">
          查看更多 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      
      <div class="article-grid">
        <el-card
          v-for="article in recentArticles"
          :key="article.id"
          shadow="hover"
          class="article-card"
          @click="goToArticle(article.id)"
        >
          <div class="article-cover" v-if="article.cover">
            <img :src="article.cover" :alt="article.title" />
          </div>
          <div class="article-info">
            <div class="article-category">
              <el-tag size="small" effect="plain">{{ article.categoryName }}</el-tag>
            </div>
            <h3 class="article-title">{{ article.title }}</h3>
            <p class="article-summary">{{ article.summary }}</p>
            <div class="article-tags-position">
              <el-tag
                v-for="tag in (article.tags || []).slice(0, 3)"
                :key="tag"
              >
                {{ tag }}
              </el-tag>
            			</div>
          </div>
		  
		  <template #footer class="article-meta">
              <span><el-icon><Calendar /></el-icon> {{ formatDate(article.createTime) }}</span>
			  &nbsp;&nbsp;&nbsp;
              <span><el-icon><View /></el-icon> {{ article.viewCount }}</span>
			</template>
        </el-card>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <h2>分类导航</h2>
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
          <div class="category-info">
            <h4>{{ category.name }}</h4>
            <p>{{ category.articleCount }} 篇文章</p>
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

// 为分类添加颜色和图标
const categoryStyles: Record<string, { color: string; icon: string }> = {
  '1': { color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: 'Monitor' },
  '2': { color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: 'DataAnalysis' },
  '3': { color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: 'Coin' },
  '4': { color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: 'Setting' },
  '5': { color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: 'More' }
}

const displayCategories = computed(() => {
  return blogStore.categories.map(cat => ({
    ...cat,
    color: categoryStyles[cat.id]?.color || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    icon: categoryStyles[cat.id]?.icon || 'Folder'
  }))
})

// 定义路由跳转方法
function goToArticles() {
  router.push('/articles')
}

function goToAbout() {
  router.push('/about')
}

function goToArticle(id: string) {
  router.push(`/article/${id}`)
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

onMounted(async () => {
  // 获取文章数据
  await blogStore.fetchArticles({ page: 1, pageSize: 4, sortBy: 'createTime', sortOrder: 'desc' })
  
  // 获取分类数据
  await blogStore.fetchCategories()
  
  // 获取统计数据
  stats.value = {
    articleCount: blogStore.articleCount,
    categoryCount: blogStore.categoryCount,
    viewCount: blogStore.articles.reduce((sum, article) => sum + article.viewCount, 0)
  }
})
</script>

<style scoped lang="scss">
.home-page {
  .hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 60px 40px;
    margin-bottom: 40px;
    color: white;

    .hero-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .hero-text {
      max-width: 600px;

      .hero-title {
        font-size: 48px;
        font-weight: 700;
        line-height: 1.2;
        margin-bottom: 20px;

        .gradient-text {
          background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }

      .hero-description {
        font-size: 18px;
        opacity: 0.9;
        margin-bottom: 30px;
        line-height: 1.6;
      }

      .hero-actions {
        display: flex;
        gap: 16px;
      }
    }

    .hero-stats {
      display: flex;
      gap: 40px;

      .stat-item {
        text-align: center;

        .stat-value {
          font-size: 36px;
          font-weight: 700;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.8;
          margin-top: 4px;
        }
      }
    }
  }

  .content-section {
    margin-bottom: 40px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin: 0;
      }
    }
  }

  .article-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;

    .article-card {
      cursor: pointer;
      transition: all 0.3s ease;
      /* 确保卡片是纵向 flex 布局 */
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-4px);
      }

      /* 深度作用选择器：让 el-card 的主体部分高度自动撑满 */
      :deep(.el-card__body) {
        padding: 0;
        display: flex;
        flex-direction: column;
        flex: 1; 
      }

      .article-cover {
        height: 180px;
        flex-shrink: 0;
        background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .article-info {
        display: flex;
        flex-direction: column; 
        padding: 20px;
        flex: 1; /* 撑开中间区域 */
        
        .article-category {
          margin-bottom: 12px;
        }

        .article-title {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .article-summary {
          font-size: 14px;
          color: #606266;
          line-height: 1.6;
          margin: 0 0 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-tags-position {
          margin-top: auto;        /* 关键：自动顶到父容器最底部 */
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end; /* 水平靠右 */
          gap: 6px;
          padding-top: 10px;       /* 增加一点间距防止粘连文字 */
        }
      }

      /* 修正 footer 的样式显示 */
      :deep(.el-card__footer) {
        padding: 12px 20px;
        border-top: 1px solid #ebeef5;
        font-size: 13px;
        color: #909399;
        display: flex;
        align-items: center;
      }
    }
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;

    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      background: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid #e4e7ed;

      &:hover {
        border-color: #667eea;
        box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
        transform: translateY(-4px);
      }

      .category-icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 16px;
      }

      .category-info {
        text-align: center;

        h4 {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 4px;
        }

        p {
          font-size: 13px;
          color: #909399;
          margin: 0;
        }
      }
    }
  }
}
</style>