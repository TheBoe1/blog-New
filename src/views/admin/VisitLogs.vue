<template>
  <div class="visit-logs">
    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-bar">
        <el-input
          v-model="filters.ip"
          placeholder="IP 搜索"
          clearable
          style="width: 160px"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="filters.path"
          placeholder="路径搜索"
          clearable
          style="width: 180px"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="filters.deviceType" placeholder="设备" clearable style="width: 120px">
          <el-option label="PC" value="pc" />
          <el-option label="移动端" value="mobile" />
          <el-option label="平板" value="tablet" />
        </el-select>
        <el-select v-model="filters.isValid" placeholder="有效性" clearable style="width: 120px">
          <el-option label="有效" :value="true" />
          <el-option label="无效(去重)" :value="false" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        style="width: 100%"
        :default-sort="{ prop: 'createTime', order: 'descending' }"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-detail">
              <p><span class="detail-label">访客ID:</span> {{ row.visitorId }}</p>
              <p><span class="detail-label">会话ID:</span> {{ row.sessionId }}</p>
              <p><span class="detail-label">UA:</span> {{ row.userAgent }}</p>
              <p><span class="detail-label">来源:</span> {{ row.referer || '直接访问' }}</p>
              <p><span class="detail-label">完整URL:</span> {{ row.url }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>

        <el-table-column prop="ip" label="IP / 定位" width="200">
          <template #default="{ row }">
            <div class="ip-cell">
              <span class="ip-addr">{{ row.ip }}</span>
              <span class="ip-loc" v-if="row.province || row.city">
                {{ [row.province, row.city].filter(Boolean).join(' ') }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="path" label="访问路径" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="path-cell">
              <span class="path-url">{{ row.path }}</span>
              <span class="path-title" v-if="row.title">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="browser" label="浏览器" width="100">
          <template #default="{ row }">
            {{ row.browser || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="os" label="系统" width="90">
          <template #default="{ row }">
            {{ row.os || '-' }}
          </template>
        </el-table-column>

        <el-table-column prop="deviceType" label="设备" width="80">
          <template #default="{ row }">
            <el-tag :type="deviceTagType(row.deviceType)" size="small">
              {{ deviceLabel(row.deviceType) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="stayDuration" label="停留" width="80" sortable>
          <template #default="{ row }">
            {{ formatDuration(row.stayDuration) }}
          </template>
        </el-table-column>

        <el-table-column label="标记" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.isBot" type="danger" size="small">爬虫</el-tag>
            <el-tag
              v-else
              :type="row.isValid ? 'success' : 'info'"
              size="small"
            >
              {{ row.isValid ? '有效' : '去重' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { statsApi } from '@/api/stats'
import type { VisitLog } from '@/types'

const loading = ref(false)
const tableData = ref<VisitLog[]>([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)

const filters = reactive({
  ip: '',
  path: '',
  deviceType: '',
  isValid: null as boolean | null
})
const dateRange = ref<[string, string] | null>(null)

async function loadData() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    if (filters.ip) params.ip = filters.ip
    if (filters.path) params.path = filters.path
    if (filters.deviceType) params.deviceType = filters.deviceType
    if (filters.isValid !== null) params.isValid = filters.isValid
    if (dateRange.value && dateRange.value.length === 2) {
      params['params[beginTime]'] = dateRange.value[0]
      params['params[endTime]'] = dateRange.value[1]
    }
    const data = await statsApi.getVisitLogs(params)
    tableData.value = data.rows || []
    total.value = data.total || 0
  } catch (error) {
    console.error('Failed to fetch visit logs:', error)
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  loadData()
}

function handleReset() {
  filters.ip = ''
  filters.path = ''
  filters.deviceType = ''
  filters.isValid = null
  dateRange.value = null
  pageNum.value = 1
  loadData()
}

function formatTime(time: string): string {
  if (!time) return '-'
  const d = new Date(time)
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDuration(sec: number): string {
  if (!sec || sec === 0) return '-'
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m${s > 0 ? s + 's' : ''}`
}

function deviceLabel(type: string): string {
  const map: Record<string, string> = { pc: 'PC', mobile: '移动', tablet: '平板' }
  return map[type] || type || '-'
}

function deviceTagType(type: string): 'primary' | 'success' | 'warning' {
  if (type === 'mobile') return 'success'
  if (type === 'tablet') return 'warning'
  return 'primary'
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.visit-logs {
  .filter-card {
    margin-bottom: 16px;

    .filter-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }
  }

  .table-card {
    .expand-detail {
      padding: 12px 24px;

      p {
        margin: 6px 0;
        font-size: 13px;
        color: var(--text-secondary);
        word-break: break-all;
      }

      .detail-label {
        color: var(--text-tertiary);
        margin-right: 8px;
      }
    }

    .ip-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .ip-addr {
        font-family: var(--font-mono, monospace);
        font-size: 13px;
        color: var(--text-primary);
      }

      .ip-loc {
        font-size: 12px;
        color: var(--text-tertiary);
      }
    }

    .path-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .path-url {
        font-size: 13px;
        color: var(--text-primary);
      }

      .path-title {
        font-size: 12px;
        color: var(--text-tertiary);
      }
    }

    .pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}
</style>
