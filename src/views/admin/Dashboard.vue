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
                <div class="header-title">
                  <span>访问趋势</span>
                  <span class="range-text">{{ rangeText }} · {{ granularityText }}</span>
                </div>
                <div class="chart-actions">
                  <el-radio-group v-model="chartPeriod" size="small" @change="handlePeriodChange">
                    <el-radio-button value="week">本周</el-radio-button>
                    <el-radio-button value="month">本月</el-radio-button>
                    <el-radio-button value="year">本年</el-radio-button>
                  </el-radio-group>
                  <el-date-picker
                    v-model="pickerValue"
                    :type="granularity === 'month' ? 'monthrange' : 'daterange'"
                    size="small"
                    unlink-panels
                    range-separator="至"
                    value-format="YYYY-MM-DD"
                    :start-placeholder="granularity === 'month' ? '开始月份' : '开始日期'"
                    :end-placeholder="granularity === 'month' ? '结束月份' : '结束日期'"
                    :disabled-date="disableFutureDate"
                    :clearable="false"
                    :editable="false"
                    class="range-picker"
                  />
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
                        <span class="summary-avg">{{ avgLabel }} {{ blogStore.trendSummary?.[m.avgKey] ?? 0 }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="trend-chart-wrap">
                    <div class="trend-range-hint">{{ rangeText }} · {{ granularityText }}</div>
                    <el-button
                      class="range-nav range-nav-prev"
                      size="small"
                      circle
                      :title="stepLabel(-1)"
                      :disabled="trendLoading"
                      @click="shiftRange(-1)"
                    >
                      <el-icon><ArrowLeft /></el-icon>
                    </el-button>
                    <div ref="trendChartRef" class="trend-chart"></div>
                    <el-button
                      class="range-nav range-nav-next"
                      size="small"
                      circle
                      :title="stepLabel(1)"
                      :disabled="trendLoading || !canGoNext"
                      @click="shiftRange(1)"
                    >
                      <el-icon><ArrowRight /></el-icon>
                    </el-button>
                    <el-empty v-if="trendData.length === 0" class="trend-empty" description="暂无访问数据" />
                  </div>
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
import dayjs from 'dayjs'
import type { ManipulateType } from 'dayjs'
import { useBlogStore } from '@/stores/blog'
import { statsApi } from '@/api/stats'
import * as echarts from 'echarts/core'
import { EffectScatterChart, LineChart } from 'echarts/charts'
import {
  GeoComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsCoreOption as EChartsOption } from 'echarts/core'
import { buildLabelInk, resolveThemeColor } from '@/utils/chartColor'

echarts.use([
  LineChart,
  EffectScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GeoComponent,
  GridComponent,
  CanvasRenderer,
])
import type { VisitLog, VisitTrend } from '@/types'

const router = useRouter()
const blogStore = useBlogStore()

const loading = ref(true)
const chartPeriod = ref<PeriodPreset>('week')
const trendData = ref<VisitTrend[]>([])
const chartMetric = ref<'pv' | 'uv' | 'ip'>('pv')
const chartView = ref<'trend' | 'map'>('trend')
const locationLogs = ref<VisitLog[]>([])
const mapLoading = ref(false)
const trendLoading = ref(false)

/**
 * 日期范围模型：图表的一切取数都落在这个区间上，而不是"本周/本月/本年"这种一次性常量。
 *
 * 原来 getDateRange() 用「今天往前推 N 天」算区间，于是"本月"实际是滚动 30 天（会跨到上个月）、
 * "本年"是滚动 365 天（会跨到去年）——x 轴自然就出现了用户以为不该出现的月份和重复的月份号。
 * 现在改成「自然周期 + 可平移」：预设只决定起点和步长，< > 按步长整体平移，粒度始终跟随区间跨度。
 */
type PeriodPreset = 'week' | 'month' | 'year'
type Granularity = 'day' | 'month'
type RangeStep = { value: number; unit: ManipulateType }
const DATE_FMT = 'YYYY-MM-DD'
/** 跨度超过这个天数就改用月粒度，否则一天一个点会密到没法看 */
const MONTH_GRANULARITY_DAYS = 92

const PERIODS: Record<PeriodPreset, {
  granularity: Granularity
  step: RangeStep
  startOf: (today: dayjs.Dayjs) => dayjs.Dayjs
  shiftName: string
}> = {
  week: {
    granularity: 'day',
    step: { value: 7, unit: 'day' },
    // 自然周从周一开始;dayjs 默认 locale 的 startOf('week') 是周日,手动对齐周一。
    // 之前是 subtract(6,'day') 滚动窗口,周二时"本周"会跨到上周,与月/年的自然周期语义不一致
    startOf: t => t.subtract((t.day() + 6) % 7, 'day'),
    shiftName: '周'
  },
  month: { granularity: 'day', step: { value: 1, unit: 'month' }, startOf: t => t.startOf('month'), shiftName: '月' },
  year: { granularity: 'month', step: { value: 1, unit: 'year' }, startOf: t => t.startOf('year'), shiftName: '年' }
}

const granularity = ref<Granularity>('day')
const rangeStart = ref('')
const rangeEnd = ref('')
const rangeStep = ref<RangeStep>(PERIODS.week.step)
/** 自定义范围时失去"周/月/年"语义，< > 与文案退化成"区间" */
const isCustomRange = ref(false)

const granularityText = computed(() => (granularity.value === 'month' ? '按月' : '按天'))
const avgLabel = computed(() => (granularity.value === 'month' ? '月均' : '日均'))
const rangeText = computed(() => `${rangeStart.value} ~ ${rangeEnd.value}`)
/** 未来没有数据，右箭头到"今天"为止 */
const canGoNext = computed(() => dayjs(rangeEnd.value).isBefore(dayjs(), 'day'))

function stepLabel(dir: -1 | 1): string {
  const dirName = dir < 0 ? '上' : '下'
  if (isCustomRange.value) return `${dirName}一区间`
  return `${dirName}一${PERIODS[chartPeriod.value].shiftName}`
}

function disableFutureDate(date: Date): boolean {
  return dayjs(date).isAfter(dayjs(), 'day')
}

const pickerValue = computed<string[]>({
  get: () => (rangeStart.value ? [rangeStart.value, rangeEnd.value] : []),
  set: value => {
    if (!Array.isArray(value) || value.length !== 2 || !value[0] || !value[1]) return
    applyCustomRange(dayjs(value[0]), dayjs(value[1]))
  }
})

function setPresetRange(preset: PeriodPreset) {
  const today = dayjs().startOf('day')
  const conf = PERIODS[preset]
  granularity.value = conf.granularity
  rangeStart.value = conf.startOf(today).format(DATE_FMT)
  rangeEnd.value = today.format(DATE_FMT)
  rangeStep.value = conf.step
  isCustomRange.value = false
}

function applyCustomRange(start: dayjs.Dayjs, end: dayjs.Dayjs) {
  const today = dayjs().startOf('day')
  let s = start.startOf('day')
  let e = end.startOf('day')
  const useMonth = e.diff(s, 'day') + 1 > MONTH_GRANULARITY_DAYS
  if (useMonth) {
    s = s.startOf('month')
    e = e.endOf('month')
  }
  if (e.isAfter(today)) e = today
  if (s.isAfter(e)) s = e

  granularity.value = useMonth ? 'month' : 'day'
  rangeStart.value = s.format(DATE_FMT)
  rangeEnd.value = e.format(DATE_FMT)
  // 自定义区间的平移量就是它自己的跨度，单位与粒度一致：日粒度按天挪，月粒度按月挪
  rangeStep.value = useMonth
    ? { value: Math.max(e.diff(s, 'month') + 1, 1), unit: 'month' }
    : { value: Math.max(e.diff(s, 'day') + 1, 1), unit: 'day' }
  isCustomRange.value = true
  fetchTrend()
}

const trendMetrics = [
  { key: 'pv' as const, label: '浏览量', totalKey: 'totalPV', avgKey: 'avgDailyPV', growthKey: 'pvGrowth' },
  { key: 'uv' as const, label: '访客数', totalKey: 'totalUV', avgKey: 'avgDailyUV', growthKey: 'uvGrowth' },
  { key: 'ip' as const, label: 'IP 数', totalKey: 'totalIP', avgKey: 'avgDailyIP', growthKey: 'ipGrowth' }
]

const currentMetricLabel = computed(
  () => trendMetrics.find(m => m.key === chartMetric.value)?.label ?? '浏览量'
)

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
/** 散点 series 的固定 id：缩放时只按 id 局部更新这个系列，避免整图重绘把 geo 的漫游状态冲掉 */
const MAP_SERIES_ID = 'visitorLocation'
/** 地图初始缩放，同时作为散点尺寸缩放的基准（散点随缩放同步变化，基准必须是同一个常量） */
const MAP_BASE_ZOOM = 1.16

/**
 * 访问量分档配色。
 * dot  —— 右侧排行榜小圆点用，饱和度高，小块面积上要够醒目；
 * area —— 地图区块用，带透明度、呈粉彩色，给上面的地名文字留出对比空间。
 * 两者分开是为了不让"区块颜色"和"地名文字颜色"抢同一个色域。
 */
const PROVINCE_LEVELS = [
  { minRatio: 0.75, dot: '#ef4444', area: 'rgba(239, 68, 68, 0.58)' },
  { minRatio: 0.45, dot: '#f59e0b', area: 'rgba(245, 158, 11, 0.58)' },
  { minRatio: 0.2, dot: '#14b8a6', area: 'rgba(20, 184, 166, 0.54)' },
  { minRatio: 0, dot: '#667eea', area: 'rgba(102, 126, 234, 0.48)' }
]

function getProvinceLevel(count: number) {
  const ratio = Math.min(count / maxProvinceCount.value, 1)
  return PROVINCE_LEVELS.find(level => ratio >= level.minRatio) ?? PROVINCE_LEVELS[PROVINCE_LEVELS.length - 1]
}

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
let locationMapZoom = MAP_BASE_ZOOM
/** 用户拖动后的地图中心，回写进 option，保证后续整图重绘不会把视野弹回初始位置 */
let locationMapCenter: [number, number] | null = null

function buildChartOption(): EChartsOption {
  const mk = (key: 'pv' | 'uv' | 'ip', label: string) => ({
    name: label,
    type: 'line' as const,
    smooth: true,
    data: trendData.value.map(d => d[key]),
    itemStyle: { color: seriesColors[key] },
    lineStyle: { width: chartMetric.value === key ? 3 : 2, opacity: chartMetric.value === key ? 1 : 0.45 }
  })
  // 数据是离散桶(日/月),用 category 轴让标签与数据点一一对齐;
  // time 轴会在数据点之间任意取刻度,产生幽灵月份/乱序标签,且切换周期后需交互才重排
  const isMonth = granularity.value === 'month'
  // 区间跨年时月份号/月日会重复,轴标签补上年份消歧
  const crossYear = new Set(trendData.value.map(d => d.date.slice(0, 4))).size > 1
  const axisLabels = trendData.value.map(d => {
    const point = dayjs(d.date)
    if (isMonth) return crossYear ? point.format('YY年M月') : point.format('M月')
    return crossYear ? point.format('YY/M/D') : point.format('M/D')
  })
  // tooltip 永远给完整日期,轴标签为了密度被压缩的信息在这里补齐
  const fullLabels = trendData.value.map(d =>
    isMonth ? dayjs(d.date).format('YYYY年M月') : dayjs(d.date).format(DATE_FMT)
  )
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'line' },
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params : [params]
        let html = `${fullLabels[p[0]?.dataIndex] ?? p[0]?.axisValueLabel ?? ''}`
        p.forEach((item: any) => {
          html += `<br/>${item.seriesName}: ${item.value}`
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
    // 左右留出 < > 导航钮的位置,避免按钮压住首尾数据点
    // 固定边距 + 不用 containLabel:y 轴数字位数随周期变(周个位数/年上千),containLabel 按标签实测宽度挪绘图区,切周期时整图左右漂移
    grid: { left: 84, right: 56, top: 60, bottom: 30 },
    xAxis: {
      type: 'category',
      data: axisLabels,
      // boundaryGap:true(默认)让首尾数据点居中在自己的槽里,两侧留出半个槽位;
      // false 会把第一个点顶到左边缘、最后一个点顶到右边缘,首尾标签被裁掉一半,整图像"偏移"了
      boundaryGap: true,
      axisTick: { alignWithLabel: true },
      axisLabel: { fontSize: 11, hideOverlap: true }
    },
    yAxis: {
      type: 'value',
      min: 0,
      minInterval: 1,
      // 轴名跟着当前指标走:三条线共用一根 y 轴,不标名字根本看不出在数什么
      name: `${currentMetricLabel.value}（次）`,
      nameLocation: 'end',
      nameGap: 10,
      nameTextStyle: {
        fontSize: 11,
        color: resolveThemeColor('--text-tertiary'),
        align: 'left'
      },
      axisLabel: { fontSize: 11 }
    },
    series: [mk('pv', '浏览量'), mk('uv', '访客数'), mk('ip', 'IP 数')]
  }
}

/**
 * 月粒度补齐空缺月份。
 * 后端 selectMonthlyStats 直接 group by 有数据的月份,没有数据的月份整条不返回,
 * x 轴就会"跳过"那几个月——既少了点,也让相邻月份在视觉上被当成连续区间。
 */
function fillMonthlyBuckets(rows: VisitTrend[]): VisitTrend[] {
  const byMonth = new Map(rows.map(row => [row.date.slice(0, 7), row]))
  const buckets: VisitTrend[] = []
  const last = dayjs(rangeEnd.value).startOf('month')
  let cursor = dayjs(rangeStart.value).startOf('month')
  while (!cursor.isAfter(last)) {
    const key = cursor.format('YYYY-MM')
    const hit = byMonth.get(key)
    buckets.push(hit ?? { date: cursor.format(DATE_FMT), pv: 0, uv: 0, ip: 0 })
    cursor = cursor.add(1, 'month')
  }
  return buckets
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

function readGeoOption(): any {
  if (!locationChart) return null
  const option = locationChart.getOption() as any
  const geo = Array.isArray(option?.geo) ? option.geo[0] : option?.geo
  return geo || null
}

/**
 * 读取并记录 geo 当前的漫游状态（缩放 + 中心）。
 * 返回值表示 zoom 是否变化 —— 只有 zoom 变了才需要重算散点尺寸。
 */
function syncGeoRoamState(): boolean {
  const geo = readGeoOption()
  if (!geo) return false

  let zoomChanged = false
  const zoom = Number(geo.zoom)
  if (Number.isFinite(zoom) && zoom > 0 && Math.abs(zoom - locationMapZoom) > 1e-4) {
    locationMapZoom = zoom
    zoomChanged = true
  }

  const center = geo.center
  if (Array.isArray(center) && center.length === 2) {
    const lng = Number(center[0])
    const lat = Number(center[1])
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      locationMapCenter = [lng, lat]
    }
  }

  return zoomChanged
}

/**
 * 同步刷新散点尺寸：只按 id 局部 merge series，不碰 geo。
 *
 * 原实现是 `georoam -> 80ms 定时器 -> setOption(整图, notMerge)`，两个问题：
 *   1. 异步：滚轮连滚时地图已经换了缩放矩阵，散点还按旧矩阵画，于是"小蓝点偏移"；
 *   2. notMerge 全量重绘会重建 geo 的漫游状态（尤其 center），来回拉扯进一步放大偏移。
 * 改成同步 + 局部 merge 后，地图与散点由 ECharts 在同一次渲染里一起更新，天然对齐。
 */
function applyGeoScatterScale() {
  if (!locationChart) return
  locationChart.setOption({
    series: [{ id: MAP_SERIES_ID, symbolSize: getProvinceSymbolSize }]
  })
}

function handleGeoRoam() {
  if (syncGeoRoamState()) {
    applyGeoScatterScale()
  }
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
  return getProvinceLevel(count).dot
}

function getProvinceAreaColor(count: number): string {
  return getProvinceLevel(count).area
}

function getProvinceSymbolSize(value: number[]): number {
  const count = Math.max(Number(value?.[2]) || 0, 0)
  const maxCount = maxProvinceCount.value
  const normalized = maxCount > 0 ? Math.sqrt(count / maxCount) : 0
  const zoomFactor = Math.min(Math.max(locationMapZoom / MAP_BASE_ZOOM, 0.82), 1.35)
  return Math.round((5 + normalized * 7) * zoomFactor)
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

function buildLocationOption(): EChartsOption {
  // Canvas 渲染器读不了 CSS 变量，这里统一解析成真实色值 + 一圈反差描边 + 投影，
  // 让地名压在任何区块颜色上都清晰，不会和地图底色糊在一起。
  const labelInk = buildLabelInk('--text-primary', 3)
  const regions = provinceStats.value.map(stat => ({
      name: getMapProvinceName(stat.province),
      itemStyle: {
        areaColor: getProvinceAreaColor(stat.count)
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
      zoom: locationMapZoom,
      // 漫游后的中心回写，避免 resize / 切周期重绘时视野被重置
      ...(locationMapCenter ? { center: locationMapCenter } : {}),
      scaleLimit: { min: 0.9, max: 6 },
      top: 8,
      bottom: 4,
      label: {
        show: false,
        fontSize: 10,
        ...labelInk
      },
      itemStyle: {
        areaColor: 'rgba(102, 126, 234, 0.10)',
        borderColor: 'rgba(102, 126, 234, 0.34)',
        borderWidth: 1
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 11,
          fontWeight: 'bold',
          ...labelInk,
          formatter: (params: any) => normalizeMapProvinceName(params.name)
        },
        itemStyle: { areaColor: 'rgba(102, 126, 234, 0.42)' }
      },
      regions
    },
    series: [
      {
        id: MAP_SERIES_ID,
        name: 'IP 属地',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        geoIndex: 0,
        data: points,
        symbolSize: getProvinceSymbolSize,
        rippleEffect: {
          brushType: 'stroke',
          scale: 1.8,
          period: 4
        },
        itemStyle: {
          color: '#0ea5e9',
          shadowBlur: 6,
          shadowColor: 'rgba(14, 165, 233, 0.28)'
        },
        // 只标有访问量的省份，数量有限，不会糊成一片
        labelLayout: { hideOverlap: true },
        emphasis: {
          scale: 1.25,
          label: {
            show: true,
            fontWeight: 'bold'
          }
        },
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          distance: 6,
          fontSize: 11,
          fontWeight: 600,
          ...labelInk
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

function handleViewArticle(id: string) {
  router.push(`/admin/article/edit/${id}`)
}

function handleAction(path: string) {
  router.push(path)
}

async function fetchTrend() {
  trendLoading.value = true
  try {
    const [data] = await Promise.all([
      blogStore.fetchVisitTrend(rangeStart.value, rangeEnd.value, granularity.value),
      fetchLocationLogs(rangeStart.value, rangeEnd.value)
    ])
    // 取数失败时 data 是空数组,这时不要补零——补了会把"没数据"画成一条真实的 0 线
    trendData.value = granularity.value === 'month' && data.length ? fillMonthlyBuckets(data) : data
  } catch (error) {
    console.error('Failed to fetch trend data:', error)
    trendData.value = []
  } finally {
    trendLoading.value = false
  }
}

function handlePeriodChange(preset: string | number | boolean | undefined) {
  setPresetRange((preset as PeriodPreset) || 'week')
  fetchTrend()
}

/**
 * < > 平移：步长由当前周期决定（周→7 天，月→1 月，年→1 年，自定义→自身跨度），粒度始终保持不变。
 *
 * 预设周期平移后要把终点重算成该周期的自然终点（上周=完整 7 天、上月=整个月、上年=整年），
 * 不能把 rangeEnd 原样平移——rangeEnd 是"今天"，本周期只过了几天就被一起挪回去，
 * 过往周期会被截成同样的几天（周三看"上周"只剩 3 天）。只有落在当前周期时才截断到今天。
 * 自定义区间保持"整体平移自身跨度"（Google Analytics 的 previous period 同款语义）。
 */
function shiftRange(dir: -1 | 1) {
  const { value, unit } = rangeStep.value
  const today = dayjs().startOf('day')
  const start = dayjs(rangeStart.value).add(dir * value, unit)
  let end: dayjs.Dayjs
  if (isCustomRange.value) {
    end = dayjs(rangeEnd.value).add(dir * value, unit)
  } else {
    end = start.add(value, unit).subtract(1, 'day')
  }
  if (end.isAfter(today)) end = today
  if (start.isAfter(end)) return
  rangeStart.value = start.format(DATE_FMT)
  rangeEnd.value = end.format(DATE_FMT)
  fetchTrend()
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
  setPresetRange(chartPeriod.value)
  try {
    await Promise.all([
      blogStore.fetchDashboardStats(),
      blogStore.fetchArticles({}),
      blogStore.fetchCategories(),
      fetchTrend()
    ])
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
      locationChart.on('georoam', handleGeoRoam)
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
      flex-wrap: wrap;
    }

    .header-title {
      display: flex;
      align-items: baseline;
      gap: 10px;
      min-width: 0;
    }

    /* 周期按钮只表达"跨度",< > 和日期选择器改的是真实区间,所以这里必须把区间原文显示出来 */
    .range-text {
      font-size: 12px;
      color: var(--text-tertiary);
      white-space: nowrap;
    }

    .chart-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .range-picker {
      width: 250px;
      flex: 0 0 auto;
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

    .trend-chart-wrap {
      position: relative;
      flex: 1;
      min-height: 0;
    }

    .trend-chart {
      height: 100%;
      width: 100%;
    }

    /* 图例下方的区间提示:头部 range-text 离图太远,看图时目光不该来回跳 */
    .trend-range-hint {
      position: absolute;
      top: 26px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      font-size: 12px;
      color: var(--text-tertiary);
      white-space: nowrap;
      pointer-events: none;
    }

    /* 空状态浮在图表区内,不参与 flex 占位。
       放在 wrap 外面时,el-empty 一出现就会挤压 flex:1 的图表区,
       top:50% 的 < > 按钮跟着从"左侧居中"跑到"左上角" */
    .trend-empty {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-primary);
      pointer-events: none;
    }

    /* < > 贴在图表左右两侧;grid 已预留左右留白,不会压住数据点。
       白卡上白按钮天然低对比,必须靠描边+投影撑出层次,否则用户根本发现不了可以平移 */
    .range-nav {
      position: absolute;
      top: 50%;
      /* 用独立 translate 属性做垂直居中,与 transform 解耦:
         hover 只写 scale 即可,不必重复 translateY(-50%),
         任何规则覆盖 transform 都不会破坏居中 */
      translate: 0 -50%;
      z-index: 2;
      width: 34px;
      height: 34px;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
      /* 不用 transition: all:会把 left/right/top 一起过渡,容器尺寸变化时按钮会"滑行" */
      transition: transform 0.2s ease, color 0.2s ease, border-color 0.2s ease, background 0.2s ease;

      &:hover:not(.is-disabled) {
        color: var(--brand-primary);
        border-color: var(--brand-primary);
        background: var(--brand-tint);
        transform: scale(1.06);
      }

      &.range-nav-prev { left: 4px; }
      &.range-nav-next { right: 4px; }
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
