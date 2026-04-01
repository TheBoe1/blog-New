<template>
  <div class="dashboard" v-loading="loading">
    <div class="stats-grid">
      <el-card v-for="stat in stats" :key="stat.title" shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon :size="24"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-title">{{ stat.title }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="dashboard-content">
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>访问趋势</span>
                <el-radio-group v-model="chartPeriod" size="small" @change="handlePeriodChange">
                  <el-radio-button value="week">本周</el-radio-button>
                  <el-radio-button value="month">本月</el-radio-button>
                  <el-radio-button value="year">本年</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div class="chart-placeholder" v-if="trendData.length > 0">
              <div class="chart-bars">
                <div 
                  v-for="(item, index) in trendData" 
                  :key="index" 
                  class="chart-bar"
                  :style="{ height: getBarHeight(item.pv) + '%' }"
                >
                  <span class="bar-value">{{ item.pv }}</span>
                  <span class="bar-label">{{ formatTrendLabel(item.date) }}</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无访问数据" />
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card shadow="never" class="recent-card">
            <template #header>
              <span>最新文章</span>
            </template>
            <div class="recent-list">
              <div 
                v-for="article in recentArticles" 
                :key="article.id" 
                class="recent-item"
                @click="handleViewArticle(article.id)"
              >
                <div class="article-title">{{ article.title }}</div>
                <div class="article-meta">
                  <span>{{ article.viewCount }} 阅读</span>
                  <span>{{ formatDate(article.createTime) }}</span>
                </div>
              </div>
              <el-empty v-if="recentArticles.length === 0" description="暂无文章" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <span>分类统计</span>
            </template>
            <div class="category-stats">
              <div v-for="cat in categoryStats" :key="cat.categoryId" class="category-item">
                <div class="category-name">{{ cat.categoryName }}</div>
                <el-progress 
                  :percentage="cat.percentage" 
                  :color="cat.color"
                  :stroke-width="10"
                />
                <div class="category-count">{{ cat.count }} 篇</div>
              </div>
              <el-empty v-if="categoryStats.length === 0" description="暂无分类数据" />
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <span>快捷操作</span>
            </template>
            <div class="quick-actions">
              <div 
                v-for="action in quickActions" 
                :key="action.title"
                class="action-item"
                @click="handleAction(action.path)"
              >
                <el-icon :size="32" :style="{ color: action.color }">
                  <component :is="action.icon" />
                </el-icon>
                <span class="action-title">{{ action.title }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import type { VisitTrend } from '@/types'

const router = useRouter()
const blogStore = useBlogStore()

const loading = ref(true)
const chartPeriod = ref('week')
const trendData = ref<VisitTrend[]>([])
const maxPv = ref(100)

const stats = computed(() => {
  const dashboardStats = blogStore.dashboardStats
  return [
    { 
      title: '文章总数', 
      value: dashboardStats?.articleCount ?? blogStore.articles.length, 
      icon: 'Document', 
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    },
    { 
      title: '今日访问', 
      value: dashboardStats?.todayPV ?? 0, 
      icon: 'View', 
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' 
    },
    { 
      title: '今日访客', 
      value: dashboardStats?.todayUV ?? 0, 
      icon: 'User', 
      color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' 
    },
    { 
      title: '分类数', 
      value: dashboardStats?.categoryCount ?? blogStore.categories.length, 
      icon: 'Folder', 
      color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' 
    }
  ]
})

const recentArticles = computed(() => {
  const dashboardStats = blogStore.dashboardStats
  if (dashboardStats?.recentArticles && dashboardStats.recentArticles.length > 0) {
    return dashboardStats.recentArticles
  }
  return [...blogStore.articles]
    .sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
    .slice(0, 5)
})

const categoryStats = computed(() => {
  const dashboardStats = blogStore.dashboardStats
  if (dashboardStats?.categoryStats && dashboardStats.categoryStats.length > 0) {
    const total = dashboardStats.categoryStats.reduce((sum, c) => sum + c.count, 0)
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']
    return dashboardStats.categoryStats.map((cat, index) => ({
      ...cat,
      percentage: total > 0 ? Math.round((cat.count / total) * 100) : 0,
      color: colors[index % colors.length]
    }))
  }
  
  const total = blogStore.articles.length
  if (total === 0) return []
  
  const categoryMap = new Map<string, { categoryId: string; categoryName: string; count: number }>()
  
  blogStore.articles.forEach(article => {
    const key = article.categoryId
    if (categoryMap.has(key)) {
      categoryMap.get(key)!.count++
    } else {
      categoryMap.set(key, {
        categoryId: article.categoryId,
        categoryName: article.categoryName,
        count: 1
      })
    }
  })
  
  const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b']
  
  return Array.from(categoryMap.values()).map((cat, index) => ({
    ...cat,
    percentage: Math.round((cat.count / total) * 100),
    color: colors[index % colors.length]
  }))
})

const quickActions = ref([
  { title: '新建文章', icon: 'Edit', color: '#667eea', path: '/admin/article/create' },
  { title: '分类管理', icon: 'Folder', color: '#764ba2', path: '/admin/categories' },
  { title: '标签管理', icon: 'PriceTag', color: '#f093fb', path: '/admin/tags' },
  { title: '系统设置', icon: 'Setting', color: '#4facfe', path: '/admin/settings' }
])

function getBarHeight(pv: number): number {
  if (maxPv.value === 0) return 0
  return Math.max(10, Math.round((pv / maxPv.value) * 100))
}

function formatTrendLabel(date: string): string {
  const d = new Date(date)
  if (chartPeriod.value === 'year') {
    return `${d.getMonth() + 1}月`
  } else if (chartPeriod.value === 'month') {
    return `第${Math.ceil(d.getDate() / 7)}周`
  }
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[d.getDay()]
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function handleViewArticle(id: string) {
  router.push(`/admin/article/edit/${id}`)
}

function handleAction(path: string) {
  router.push(path)
}

function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString().split('T')[0]
  let startDate = ''
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate = weekAgo.toISOString().split('T')[0]
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    startDate = monthAgo.toISOString().split('T')[0]
  } else {
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    startDate = yearAgo.toISOString().split('T')[0]
  }
  
  return { startDate, endDate }
}

async function handlePeriodChange() {
  const { startDate, endDate } = getDateRange(chartPeriod.value)
  const granularity = chartPeriod.value === 'year' ? 'month' : chartPeriod.value === 'month' ? 'week' : 'day'
  
  try {
    const data = await blogStore.fetchVisitTrend(startDate, endDate, granularity)
    trendData.value = data
    if (data.length > 0) {
      maxPv.value = Math.max(...data.map(d => d.pv), 1)
    }
  } catch (error) {
    console.error('Failed to fetch trend data:', error)
    trendData.value = []
  }
}

async function loadDashboardData() {
  loading.value = true
  try {
    await Promise.all([
      blogStore.fetchDashboardStats(),
      blogStore.fetchArticles({}),
      blogStore.fetchCategories()
    ])
    
    const { startDate, endDate } = getDateRange(chartPeriod.value)
    const data = await blogStore.fetchVisitTrend(startDate, endDate, 'day')
    trendData.value = data
    if (data.length > 0) {
      maxPv.value = Math.max(...data.map(d => d.pv), 1)
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped lang="scss">
.dashboard {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
        }

        .stat-title {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }

  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-placeholder {
      height: 300px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 20px;
      
      .chart-bars {
        display: flex;
        align-items: flex-end;
        gap: 16px;
        height: 100%;
        width: 100%;
        
        .chart-bar {
          flex: 1;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px 8px 0 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 12px 8px;
          min-height: 60px;
          transition: all 0.3s ease;
          
          &:hover {
            opacity: 0.8;
          }
          
          .bar-value {
            font-size: 14px;
            font-weight: 600;
            color: white;
            margin-bottom: 8px;
          }
          
          .bar-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }
    }
  }

  .recent-card {
    height: 100%;

    .recent-list {
      max-height: 300px;
      overflow-y: auto;

      .recent-item {
        padding: 12px 0;
        border-bottom: 1px solid #f0f2f5;
        cursor: pointer;
        transition: background 0.3s ease;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: #f5f7fa;
          margin: 0 -16px;
          padding: 12px 16px;
        }

        .article-title {
          font-size: 14px;
          color: #303133;
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .article-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .category-stats {
    .category-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .category-name {
        font-size: 14px;
        color: #303133;
        margin-bottom: 8px;
      }

      .category-count {
        font-size: 12px;
        color: #909399;
        text-align: right;
        margin-top: 4px;
      }
    }
  }

  .quick-actions {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 20px;
      border-radius: 12px;
      background: #f5f7fa;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
        transform: translateY(-2px);
      }

      .action-title {
        font-size: 13px;
        color: #606266;
      }
    }
  }
}
</style>
