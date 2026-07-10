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
                <div class="chart-actions">
                  <el-radio-group v-model="chartPeriod" size="small" @change="handlePeriodChange">
                    <el-radio-button value="week">本周</el-radio-button>
                    <el-radio-button value="month">本月</el-radio-button>
                    <el-radio-button value="year">本年</el-radio-button>
                  </el-radio-group>
                  <el-button size="small" @click="toggleChartView">
                    {{ chartView === 'trend' ? '地图视图' : '折线图' }}
                  </el-button>
                </div>
              </div>
            </template>
            <div class="chart-viewport">
              <transition name="chart-view-fade">
                <div v-show="chartView === 'trend'" class="trend-view">
                  <div class="trend-summary" v-if="blogStore.trendSummary">
                    <div
                      v-for="m in trendMetrics"
                      :key="m.key"
                      class="summary-item"
                      :class="{ active: chartMetric === m.key }"
                      @click="chartMetric = m.key"
                    >
                      <div class="summary-label">{{ m.label }}</div>
                      <div class="summary-value">{{ blogStore.trendSummary?.[m.totalKey] ?? 0 }}</div>
                      <div class="summary-meta">
                        <span class="summary-growth" :class="growthClass(m.growthKey)">{{ growthText(m.growthKey) }}</span>
                        <span class="summary-avg">日均 {{ blogStore.trendSummary?.[m.avgKey] ?? 0 }}</span>
                      </div>
                    </div>
                  </div>
                  <div ref="trendChartRef" class="trend-chart"></div>
                  <el-empty v-if="trendData.length === 0" description="暂无访问数据" />
                </div>
              </transition>
              <transition name="chart-view-fade">
                <div v-show="chartView === 'map'" class="location-view">
                  <div class="location-meta">覆盖 {{ provinceStats.length }} 个地区 · {{ locationLogs.length }} 条访问</div>
                  <div class="location-content">
                    <div ref="locationChartRef" class="location-chart" v-loading="mapLoading"></div>
                    <div class="location-rank">
                      <div
                        v-for="item in topProvinceStats"
                        :key="item.province"
                        class="location-rank-item"
                      >
                        <div class="rank-main">
                          <span class="rank-dot" :style="{ background: getProvinceColor(item.count) }"></span>
                          <span class="rank-name">{{ item.province }}</span>
                        </div>
                        <div class="rank-count">{{ item.count }} 次</div>
                      </div>
                      <el-empty v-if="topProvinceStats.length === 0" description="暂无属地数据" />
                    </div>
                  </div>
                </div>
              </transition>
            </div>
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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog'
import { statsApi } from '@/api/stats'
import * as echarts from 'echarts'
import type { VisitLog, VisitTrend } from '@/types'

const router = useRouter()
const blogStore = useBlogStore()

const loading = ref(true)
const chartPeriod = ref('week')
const trendData = ref<VisitTrend[]>([])
const chartMetric = ref<'pv' | 'uv' | 'ip'>('pv')
const chartView = ref<'trend' | 'map'>('trend')
const locationLogs = ref<VisitLog[]>([])
const mapLoading = ref(false)

const trendMetrics = [
  { key: 'pv' as const, label: '浏览量', totalKey: 'totalPV', avgKey: 'avgDailyPV', growthKey: 'pvGrowth' },
  { key: 'uv' as const, label: '访客数', totalKey: 'totalUV', avgKey: 'avgDailyUV', growthKey: 'uvGrowth' },
  { key: 'ip' as const, label: 'IP 数', totalKey: 'totalIP', avgKey: 'avgDailyIP', growthKey: 'ipGrowth' }
]

function growthClass(key: string): string {
  const val = blogStore.trendComparison?.[key] ?? 0
  if (val > 0) return 'growth-up'
  if (val < 0) return 'growth-down'
  return 'growth-flat'
}

function growthText(key: string): string {
  const val = blogStore.trendComparison?.[key] ?? 0
  if (val > 0) return `↑${val}%`
  if (val < 0) return `↓${Math.abs(val)}%`
  return '-'
}

// ECharts 趋势图
const trendChartRef = ref<HTMLElement | null>(null)
const locationChartRef = ref<HTMLElement | null>(null)
let trendChart: echarts.ECharts | null = null
let locationChart: echarts.ECharts | null = null
let trendResizeObserver: ResizeObserver | null = null
let locationResizeObserver: ResizeObserver | null = null
let trendRenderTimer: number | null = null
let locationRenderTimer: number | null = null

const seriesColors: Record<string, string> = { pv: '#667eea', uv: '#14b8a6', ip: '#f59e0b' }
const CHINA_MAP_NAME = 'chinaVisitorMap'

function resolvePublicAsset(path: string): string {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${path.replace(/^\/+/, '')}`
}

const CHINA_MAP_URL = resolvePublicAsset('maps/china.json')
const provinceCoordinates: Record<string, [number, number]> = {
  北京: [116.40, 39.90],
  天津: [117.20, 39.12],
  河北: [114.52, 38.05],
  山西: [112.55, 37.87],
  内蒙古: [111.75, 40.84],
  辽宁: [123.43, 41.80],
  吉林: [125.32, 43.82],
  黑龙江: [126.64, 45.75],
  上海: [121.47, 31.23],
  江苏: [118.78, 32.04],
  浙江: [120.15, 30.28],
  安徽: [117.28, 31.86],
  福建: [119.30, 26.08],
  江西: [115.86, 28.68],
  山东: [117.00, 36.65],
  河南: [113.62, 34.75],
  湖北: [114.30, 30.59],
  湖南: [112.98, 28.20],
  广东: [113.27, 23.13],
  广西: [108.32, 22.82],
  海南: [110.35, 20.02],
  重庆: [106.55, 29.56],
  四川: [104.06, 30.67],
  贵州: [106.71, 26.57],
  云南: [102.71, 25.04],
  西藏: [91.13, 29.65],
  陕西: [108.94, 34.34],
  甘肃: [103.83, 36.06],
  青海: [101.78, 36.62],
  宁夏: [106.23, 38.49],
  新疆: [87.62, 43.82],
  香港: [114.17, 22.28],
  澳门: [113.55, 22.20],
  台湾: [121.56, 25.04]
}
let visitorMapRegistered = false

function buildChartOption(): echarts.EChartsOption {
  const mk = (key: 'pv' | 'uv' | 'ip', label: string) => ({
    name: label,
    type: 'line' as const,
    smooth: true,
    data: trendData.value.map(d => [d.date, d[key]]),
    itemStyle: { color: seriesColors[key] },
    lineStyle: { width: chartMetric.value === key ? 3 : 2, opacity: chartMetric.value === key ? 1 : 0.45 }
  })
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params : [params]
        const date = p[0]?.value?.[0] ?? ''
        let html = `${date}`
        p.forEach((item: any) => {
          html += `<br/>${item.seriesName}: ${item.value[1]}`
        })
        return html
      }
    },
    legend: {
      data: ['浏览量', '访客数', 'IP 数'],
      top: 0,
      left: 'center',
      textStyle: { fontSize: 12 }
    },
    grid: { left: 40, right: 20, top: 44, bottom: 20 },
    xAxis: {
      type: 'time',
      axisLabel: {
        fontSize: 11,
        hideOverlap: true,
        formatter: (value: number) => {
          const d = new Date(value)
          if (chartPeriod.value === 'year') return `${d.getMonth() + 1}月`
          return `${d.getMonth() + 1}/${d.getDate()}`
        }
      }
    },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { fontSize: 11 } },
    series: [mk('pv', '浏览量'), mk('uv', '访客数'), mk('ip', 'IP 数')]
  }
}

function hasUsableChartSize(el: HTMLElement | null): el is HTMLElement {
  if (!el) return false
  const rect = el.getBoundingClientRect()
  return rect.width >= 120 && rect.height >= 120
}

function scheduleTrendRender() {
  if (trendRenderTimer !== null) {
    window.clearTimeout(trendRenderTimer)
  }
  trendRenderTimer = window.setTimeout(() => {
    trendRenderTimer = null
    if (!trendChart || !hasUsableChartSize(trendChartRef.value)) return
    trendChart.resize()
    updateChart()
  }, 80)
}

function scheduleLocationRender() {
  if (locationRenderTimer !== null) {
    window.clearTimeout(locationRenderTimer)
  }
  locationRenderTimer = window.setTimeout(() => {
    locationRenderTimer = null
    if (!locationChart || !hasUsableChartSize(locationChartRef.value)) return
    locationChart.resize()
    updateLocationChart()
  }, 80)
}

function updateChart() {
  if (!trendChart) return
  if (!hasUsableChartSize(trendChartRef.value)) {
    scheduleTrendRender()
    return
  }
  if (trendData.value.length === 0) {
    trendChart.clear()
    return
  }
  trendChart.resize()
  trendChart.setOption(buildChartOption(), true)
}

function handleResize() {
  scheduleTrendRender()
  scheduleLocationRender()
}

function toggleChartView() {
  chartView.value = chartView.value === 'trend' ? 'map' : 'trend'
  nextTick(() => {
    if (chartView.value === 'trend') {
      scheduleTrendRender()
    } else {
      scheduleLocationRender()
    }
  })
}

const categoryProgressColors = ['#667eea', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

function normalizeProvince(value?: string): string {
  if (!value) return ''
  return value
    .replace(/省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区/g, '')
    .trim()
}

function getMapProvinceName(province: string): string {
  const suffixMap: Record<string, string> = {
    北京: '北京市',
    天津: '天津市',
    上海: '上海市',
    重庆: '重庆市',
    内蒙古: '内蒙古自治区',
    广西: '广西壮族自治区',
    西藏: '西藏自治区',
    宁夏: '宁夏回族自治区',
    新疆: '新疆维吾尔自治区',
    香港: '香港特别行政区',
    澳门: '澳门特别行政区'
  }
  return suffixMap[province] || `${province}省`
}

function normalizeMapProvinceName(value?: string): string {
  return normalizeProvince(value)
}

const provinceStats = computed(() => {
  const stats = new Map<string, { province: string; count: number; ips: Set<string>; cities: Set<string> }>()
  locationLogs.value.forEach(log => {
    const province = normalizeProvince(log.province)
    if (!province || !provinceCoordinates[province]) return
    if (!stats.has(province)) {
      stats.set(province, { province, count: 0, ips: new Set(), cities: new Set() })
    }
    const item = stats.get(province)!
    item.count += 1
    if (log.ip) item.ips.add(log.ip)
    if (log.city) item.cities.add(log.city)
  })
  return Array.from(stats.values())
    .map(item => ({
      province: item.province,
      count: item.count,
      ipCount: item.ips.size,
      cityCount: item.cities.size
    }))
    .sort((a, b) => b.count - a.count)
})

const topProvinceStats = computed(() => provinceStats.value.slice(0, 6))

const maxProvinceCount = computed(() => Math.max(...provinceStats.value.map(item => item.count), 1))

function getProvinceColor(count: number): string {
  const ratio = Math.min(count / maxProvinceCount.value, 1)
  if (ratio >= 0.75) return '#ef4444'
  if (ratio >= 0.45) return '#f59e0b'
  if (ratio >= 0.2) return '#14b8a6'
  return '#667eea'
}

async function ensureVisitorMapRegistered() {
  if (visitorMapRegistered) return
  mapLoading.value = true
  try {
    const response = await fetch(CHINA_MAP_URL)
    if (!response.ok) {
      throw new Error(`Failed to load China map from ${CHINA_MAP_URL}: ${response.status}`)
    }
    const chinaGeoJson = await response.json()
    echarts.registerMap(CHINA_MAP_NAME, chinaGeoJson)
    visitorMapRegistered = true
  } finally {
    mapLoading.value = false
  }
}

function buildLocationOption(): echarts.EChartsOption {
  const regions = provinceStats.value.map(stat => ({
      name: getMapProvinceName(stat.province),
      itemStyle: {
        areaColor: getProvinceColor(stat.count)
      }
    }))
  const points = provinceStats.value.map(item => ({
    name: item.province,
    value: [...provinceCoordinates[item.province], item.count],
    ipCount: item.ipCount,
    cityCount: item.cityCount
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data || {}
        const value = Array.isArray(data.value) ? data.value[2] : params.value || 0
        return `${params.name}<br/>访问 ${value || 0} 次<br/>IP ${data.ipCount || 0} 个<br/>城市 ${data.cityCount || 0} 个`
      }
    },
    geo: {
      map: CHINA_MAP_NAME,
      roam: true,
      zoom: 1.16,
      scaleLimit: { min: 0.9, max: 6 },
      top: 8,
      bottom: 4,
      label: {
        show: false,
        fontSize: 10,
        color: 'var(--text-secondary)'
      },
      itemStyle: {
        areaColor: 'rgba(102, 126, 234, 0.10)',
        borderColor: 'rgba(102, 126, 234, 0.34)',
        borderWidth: 1
      },
      emphasis: {
        label: {
          show: true,
          color: 'var(--text-primary)',
          formatter: (params: any) => normalizeMapProvinceName(params.name)
        },
        itemStyle: { areaColor: 'rgba(102, 126, 234, 0.42)' }
      },
      regions
    },
    series: [
      {
        name: 'IP 属地',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: points,
        symbolSize: (value: number[]) => Math.max(9, Math.min(26, value[2] * 4)),
        rippleEffect: {
          brushType: 'stroke',
          scale: 3
        },
        itemStyle: {
          color: '#0ea5e9',
          shadowBlur: 12,
          shadowColor: 'rgba(14, 165, 233, 0.45)'
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          fontSize: 11,
          color: 'var(--text-primary)'
        }
      }
    ]
  }
}

async function updateLocationChart() {
  if (!locationChart) return
  if (!hasUsableChartSize(locationChartRef.value)) {
    scheduleLocationRender()
    return
  }
  try {
    await ensureVisitorMapRegistered()
    locationChart.resize()
    locationChart.setOption(buildLocationOption(), true)
  } catch (error) {
    console.error('Failed to render location map:', error)
    return
  }
}

const stats = computed(() => {
  const dashboardStats = blogStore.dashboardStats
  return [
    {
      title: '文章总数',
      value: dashboardStats?.articleCount ?? blogStore.articles.length,
      icon: 'Document',
      color: 'var(--brand-primary)'
    },
	{
	  title: '分类数',
	  value: dashboardStats?.categoryCount ?? blogStore.categories.length,
	  icon: 'Folder',
	  color: 'var(--brand-primary)'
	},
    {
      title: '累计访客',
      value: dashboardStats?.totalVisitors ?? 0,
      icon: 'DataAnalysis',
      color: 'var(--brand-primary)'
    },
    {
      title: '今日访问',
      value: dashboardStats?.todayPV ?? 0,
      icon: 'View',
      color: 'var(--brand-primary)'
    },
    {
      title: '今日访客',
      value: dashboardStats?.todayUV ?? 0,
      icon: 'User',
      color: 'var(--brand-primary)'
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
    return dashboardStats.categoryStats.map((cat, index) => ({
      ...cat,
      percentage: total > 0 ? Math.round((cat.count / total) * 100) : 0,
      color: categoryProgressColors[index % categoryProgressColors.length]
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
  
  return Array.from(categoryMap.values()).map((cat, index) => ({
    ...cat,
    percentage: Math.round((cat.count / total) * 100),
    color: categoryProgressColors[index % categoryProgressColors.length]
  }))
})

const quickActions = ref([
  { title: '新建文章', icon: 'Edit', color: 'var(--brand-primary)', path: '/admin/article/create' },
  { title: '分类管理', icon: 'Folder', color: 'var(--brand-primary)', path: '/admin/categories' },
  { title: '标签管理', icon: 'PriceTag', color: 'var(--brand-primary)', path: '/admin/tags' },
  { title: '系统设置', icon: 'Setting', color: 'var(--brand-primary)', path: '/admin/settings' }
])

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function handleViewArticle(id: string) {
  router.push(`/admin/article/edit/${id}`)
}

function handleAction(path: string) {
  router.push(path)
}

function getDateRange(period: string): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = formatLocalDate(now)
  let startDate = ''
  
  if (period === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    startDate = formatLocalDate(weekAgo)
  } else if (period === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    startDate = formatLocalDate(monthAgo)
  } else {
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    startDate = formatLocalDate(yearAgo)
  }
  
  return { startDate, endDate }
}

async function handlePeriodChange() {
  const { startDate, endDate } = getDateRange(chartPeriod.value)
  const granularity = chartPeriod.value === 'year' ? 'month' : 'day'

  try {
    const [data] = await Promise.all([
      blogStore.fetchVisitTrend(startDate, endDate, granularity),
      fetchLocationLogs(startDate, endDate)
    ])
    trendData.value = data
  } catch (error) {
    console.error('Failed to fetch trend data:', error)
    trendData.value = []
  }
}

async function fetchLocationLogs(startDate: string, endDate: string) {
  const data = await statsApi.getVisitLogs({
    pageNum: 1,
    pageSize: 500,
    'params[beginTime]': startDate,
    'params[endTime]': `${endDate} 23:59:59`
  })
  locationLogs.value = data.rows || []
}

async function loadDashboardData() {
  loading.value = true
  try {
    const { startDate, endDate } = getDateRange(chartPeriod.value)
    const granularity = chartPeriod.value === 'year' ? 'month' : 'day'
    const results = await Promise.all([
      blogStore.fetchDashboardStats(),
      blogStore.fetchArticles({}),
      blogStore.fetchCategories(),
      blogStore.fetchVisitTrend(startDate, endDate, granularity),
      fetchLocationLogs(startDate, endDate)
    ])
    trendData.value = results[3] || []
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
      trendResizeObserver = new ResizeObserver(scheduleTrendRender)
      trendResizeObserver.observe(trendChartRef.value)
      window.addEventListener('resize', handleResize)
      scheduleTrendRender()
    }
    if (locationChartRef.value) {
      locationChart = echarts.init(locationChartRef.value)
      locationResizeObserver = new ResizeObserver(scheduleLocationRender)
      locationResizeObserver.observe(locationChartRef.value)
      scheduleLocationRender()
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (trendRenderTimer !== null) {
    window.clearTimeout(trendRenderTimer)
    trendRenderTimer = null
  }
  if (locationRenderTimer !== null) {
    window.clearTimeout(locationRenderTimer)
    locationRenderTimer = null
  }
  trendResizeObserver?.disconnect()
  trendResizeObserver = null
  locationResizeObserver?.disconnect()
  locationResizeObserver = null
  trendChart?.dispose()
  trendChart = null
  locationChart?.dispose()
  locationChart = null
})

watch([trendData, chartMetric], () => {
  scheduleTrendRender()
}, { deep: true })

watch(provinceStats, () => {
  scheduleLocationRender()
}, { deep: true })
</script>

<style scoped lang="scss">
.dashboard {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
        color: var(--text-on-brand);
      }

      .stat-info {
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-title {
          font-size: 14px;
          color: var(--text-tertiary);
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
      gap: 12px;
    }

    .chart-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .chart-viewport {
      position: relative;
      height: 430px;
      overflow: hidden;
    }

    .trend-view,
    .location-view {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }

    .chart-view-fade-enter-active,
    .chart-view-fade-leave-active {
      transition: opacity 0.22s ease, transform 0.22s ease;
    }

    .chart-view-fade-enter-from,
    .chart-view-fade-leave-to {
      opacity: 0;
      transform: translateY(8px);
    }

    .trend-summary {
      display: flex;
      flex: 0 0 auto;
      gap: 12px;
      margin-bottom: 16px;

      .summary-item {
        flex: 1;
        padding: 12px 14px;
        border-radius: 8px;
        background: var(--bg-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        border: 2px solid transparent;

        &:hover {
          background: var(--bg-hover);
        }

        &.active {
          border-color: var(--brand-primary);
          background: var(--brand-tint);
        }

        .summary-label {
          font-size: 12px;
          color: var(--text-tertiary);
          margin-bottom: 4px;
        }

        .summary-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .summary-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 12px;

          .summary-growth {
            font-weight: 600;

            &.growth-up { color: #67c23a; }
            &.growth-down { color: #f56c6c; }
            &.growth-flat { color: var(--text-tertiary); }
          }

          .summary-avg {
            color: var(--text-tertiary);
          }
        }
      }
    }

    .trend-chart {
      flex: 1;
      min-height: 0;
      width: 100%;
    }

    .location-meta {
      flex: 0 0 auto;
      margin-bottom: 10px;
      font-size: 12px;
      color: var(--text-tertiary);
      text-align: right;
    }

    .location-content {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 180px;
      gap: 16px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
    }

    .location-chart {
      height: 100%;
      min-width: 0;
      border-radius: 8px;
      background: linear-gradient(180deg, var(--bg-secondary), transparent);
    }

    .location-rank {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 4px 0;
      min-height: 0;
      overflow-y: auto;

      .location-rank-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--bg-secondary);
      }

      .rank-main {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .rank-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex: 0 0 auto;
      }

      .rank-name {
        font-size: 13px;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rank-count {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        white-space: nowrap;
      }
    }
  }

  .recent-card {
    height: 100%;
	  :deep(.el-card__body) {
	    height: calc(100% - 57px);
	  }
    .recent-list {
     height: 100%;
      overflow-y: auto;

      .recent-item {
        padding: 12px 0;
        border-bottom: 1px solid var(--border-color);
        cursor: pointer;
        transition: background 0.3s ease;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background: var(--bg-secondary);
          margin: 0 -16px;
          padding: 12px 16px;
        }

        .article-title {
          font-size: 14px;
          color: var(--text-primary);
          margin-bottom: 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .article-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: var(--text-tertiary);
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
        color: var(--text-primary);
        margin-bottom: 8px;
      }

      .category-count {
        font-size: 12px;
        color: var(--text-tertiary);
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
      background: var(--bg-secondary);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: var(--brand-tint);
        transform: translateY(-2px);
      }

      .action-title {
        font-size: 13px;
        color: var(--text-secondary);
      }
    }
  }

  @media (max-width: 960px) {
    .chart-card {
      .card-header {
        align-items: flex-start;
        flex-direction: column;
      }

      .location-content {
        grid-template-columns: 1fr;
      }

      .location-chart {
        min-height: 260px;
      }
    }
  }
}
</style>
