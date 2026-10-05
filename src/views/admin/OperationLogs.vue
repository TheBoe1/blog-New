<template>
  <div class="operation-logs">
    <header class="page-heading">
      <h1>操作日志</h1>
      <p>查看管理操作的执行时间、操作人和结果。</p>
    </header>

    <el-card shadow="never">
      <el-form class="filter-form" label-position="top" @submit.prevent="handleSearch">
        <el-form-item label="操作模块">
          <el-input v-model="filters.title" placeholder="例如：文章管理" clearable />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="filters.operName" placeholder="用户账号" clearable />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="filters.businessType" placeholder="全部类型" clearable>
            <el-option v-for="(label, value) in businessTypes" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行结果">
          <el-select v-model="filters.status" placeholder="全部结果" clearable>
            <el-option label="成功" :value="0" />
            <el-option label="失败" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作日期" class="date-filter">
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <div class="filter-actions">
          <el-button type="primary" native-type="submit" :disabled="loading">查询</el-button>
          <el-button :disabled="loading" @click="handleReset">重置</el-button>
          <el-button :loading="loading" @click="loadData">刷新</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" v-loading="loading">
      <el-alert v-if="loadError" title="日志加载失败，请检查网络后重试。" type="error" :closable="false" show-icon />
      <div v-else class="admin-table-scroll">
        <el-table :data="rows" row-key="operId" stripe empty-text="暂无符合条件的操作日志">
          <el-table-column prop="operTime" label="操作时间" width="180" />
          <el-table-column prop="title" label="操作模块" min-width="150" show-overflow-tooltip />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">{{ businessTypes[row.businessType] || '其他' }}</template>
          </el-table-column>
          <el-table-column prop="operName" label="操作人" width="130" show-overflow-tooltip />
          <el-table-column prop="operIp" label="IP 地址" width="160" show-overflow-tooltip />
          <el-table-column prop="operUrl" label="请求路径" min-width="220" show-overflow-tooltip />
          <el-table-column label="结果" width="90">
            <template #default="{ row }"><el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">{{ row.status === 0 ? '成功' : '失败' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="详情" width="90" fixed="right">
            <template #default="{ row }"><el-button type="primary" link @click="selectedLog = row">查看</el-button></template>
          </el-table-column>
        </el-table>
      </div>
      <div class="pagination" v-if="!loadError">
        <el-pagination v-model:current-page="pageNum" v-model:page-size="pageSize" :page-sizes="[20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next" background @size-change="handleSizeChange" @current-change="loadData" />
      </div>
      <el-button v-else class="retry-button" @click="loadData">重试</el-button>
    </el-card>

    <el-dialog :model-value="selectedLog !== null" title="操作详情" width="min(720px, 92vw)" @update:model-value="selectedLog = null">
      <dl v-if="selectedLog" class="log-detail">
        <dt>日志编号</dt><dd>{{ selectedLog.operId }}</dd>
        <dt>操作模块</dt><dd>{{ selectedLog.title }}</dd>
        <dt>操作类型</dt><dd>{{ businessTypes[selectedLog.businessType] || '其他' }}</dd>
        <dt>操作人</dt><dd>{{ selectedLog.operName || '—' }}</dd>
        <dt>操作时间</dt><dd>{{ selectedLog.operTime }}</dd>
        <dt>执行结果</dt><dd>{{ selectedLog.status === 0 ? '成功' : '失败' }}</dd>
        <dt>来源 IP</dt><dd>{{ selectedLog.operIp || '—' }}</dd>
        <dt>来源地点</dt><dd>{{ selectedLog.operLocation || '—' }}</dd>
        <dt>请求方式</dt><dd>{{ selectedLog.requestMethod }}</dd>
        <dt>请求路径</dt><dd>{{ selectedLog.operUrl }}</dd>
        <dt>处理方法</dt><dd>{{ selectedLog.method || '—' }}</dd>
        <template v-if="selectedLog.errorMsg"><dt>错误信息</dt><dd class="error-message">{{ selectedLog.errorMsg }}</dd></template>
      </dl>
      <template #footer><el-button @click="selectedLog = null">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { logsApi } from '@/api/logs'
import type { OperationLog, OperationLogQuery, OperationStatus } from '@/types/logs'

const businessTypes: Record<number, string> = {
  0: '其他', 1: '新增', 2: '修改', 3: '删除', 4: '授权',
  5: '导出', 6: '导入', 7: '强退', 8: '生成代码', 9: '清空数据'
}
const filters = reactive({ title: '', operName: '', businessType: undefined as number | undefined | '', status: undefined as OperationStatus | undefined | '' })
const dateRange = ref<[string, string] | null>(null)
const pageNum = ref(1)
const pageSize = ref(20)
const rows = ref<OperationLog[]>([])
const total = ref(0)
const loading = ref(false)
const loadError = ref(false)
const selectedLog = ref<OperationLog | null>(null)
let latestRequest = 0
let appliedFilters: Omit<OperationLogQuery, 'pageNum' | 'pageSize'> = {}

async function loadData() {
  const requestId = ++latestRequest
  loading.value = true
  loadError.value = false
  try {
    const result = await logsApi.getOperations({ ...appliedFilters, pageNum: pageNum.value, pageSize: pageSize.value })
    if (requestId !== latestRequest) return
    rows.value = result.rows
    total.value = result.total
  } catch {
    if (requestId !== latestRequest) return
    rows.value = []
    total.value = 0
    loadError.value = true
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

function handleSearch() {
  appliedFilters = {}
  if (filters.title.trim()) appliedFilters.title = filters.title.trim()
  if (filters.operName.trim()) appliedFilters.operName = filters.operName.trim()
  // 现有 mapper 的 businessType != '' 会把 0 当空值；数组分支可精确筛选“其他”。
  if (filters.businessType === 0) appliedFilters['businessTypes[0]'] = 0
  else if (typeof filters.businessType === 'number') appliedFilters.businessType = filters.businessType
  if (typeof filters.status === 'number') appliedFilters.status = filters.status
  if (dateRange.value) {
    appliedFilters['params[beginTime]'] = dateRange.value[0]
    appliedFilters['params[endTime]'] = dateRange.value[1]
  }
  pageNum.value = 1
  void loadData()
}

function handleReset() {
  Object.assign(filters, { title: '', operName: '', businessType: undefined, status: undefined })
  dateRange.value = null
  handleSearch()
}

function handleSizeChange() {
  pageNum.value = 1
  void loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.operation-logs { display: grid; gap: var(--space-6); }
.page-heading {
  h1 { margin: 0; font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); color: var(--text-primary); }
  p { margin: var(--space-2) 0 0; font-size: var(--font-size-sm); color: var(--text-secondary); }
}
.filter-form { display: flex; flex-wrap: wrap; align-items: end; gap: var(--space-4); }
.filter-form :deep(.el-form-item) { margin: 0; flex: 1 1 10rem; min-width: 0; }
.filter-form :deep(.el-select) { width: 100%; }
.filter-form :deep(.date-filter) { flex-basis: 20rem; }
.filter-form :deep(.el-date-editor) { width: 100%; min-width: 0; }
.filter-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.filter-actions :deep(.el-button + .el-button) { margin-left: 0; }
.pagination { display: flex; justify-content: end; margin-top: var(--space-6); overflow-x: auto; }
.retry-button { margin-top: var(--space-4); }
.log-detail { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--space-3) var(--space-6); margin: 0; }
.log-detail dt { color: var(--text-secondary); }
.log-detail dd { margin: 0; color: var(--text-primary); overflow-wrap: anywhere; white-space: pre-wrap; }
.log-detail .error-message { color: var(--color-danger); }
@media (max-width: 768px) {
  .filter-actions { width: 100%; }
  .pagination { justify-content: start; }
}
</style>
