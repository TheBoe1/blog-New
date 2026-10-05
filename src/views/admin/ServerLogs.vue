<template>
  <div class="server-logs">
    <header class="page-heading">
      <h1>服务器日志</h1>
      <p>只读查看后端运行日志与 Nginx 请求、错误日志，保留原始行与异常堆栈。</p>
    </header>

    <el-card shadow="never">
      <el-form class="filter-form" label-position="top" @submit.prevent="loadData">
        <el-form-item label="日志来源">
          <el-select v-model="source" aria-label="日志来源">
            <el-option v-for="item in sources" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="最近行数">
          <el-select v-model="lineLimit" aria-label="最近行数">
            <el-option v-for="count in lineLimits" :key="count" :label="`最近 ${count} 行`" :value="count" />
          </el-select>
        </el-form-item>
        <el-form-item label="筛选当前快照" class="keyword-filter">
          <el-input v-model="keyword" placeholder="关键词，例如 ERROR、接口路径" clearable />
        </el-form-item>
        <div class="filter-actions">
          <el-button type="primary" native-type="submit" :loading="loading">刷新</el-button>
          <el-switch v-model="autoRefresh" active-text="每 10 秒刷新" aria-label="自动刷新" />
        </div>
      </el-form>
      <p class="hint">关键词仅匹配本次读取的最近日志，不搜索全部历史。常见敏感字段已脱敏；此页面不提供删除或执行命令。</p>
    </el-card>

    <el-card shadow="never" v-loading="loading" class="log-card">
      <div class="log-summary" aria-live="polite">
        <span>{{ sourceLabel }} · 读取 {{ snapshot?.lines.length ?? 0 }} 行<span v-if="keyword.trim()"> · 匹配 {{ filteredLines.length }} 行</span></span>
        <span>更新时间：{{ updatedAt }}</span>
      </div>
      <template v-if="loadError">
        <el-alert title="服务器日志读取失败" :description="loadError" type="error" :closable="false" show-icon />
        <el-button class="retry-button" @click="loadData">重试</el-button>
      </template>
      <template v-else>
        <el-alert v-if="snapshot?.truncated" class="limit-alert" title="日志超过安全读取上限，当前仅显示末尾可读取的内容。" type="warning" :closable="false" />
        <pre v-if="filteredLines.length" class="log-output" tabindex="0" :aria-label="`${sourceLabel}内容`"><code>{{ filteredLines.join('\n') }}</code></pre>
        <el-empty v-else-if="!loading" :description="keyword.trim() ? '当前快照没有匹配的日志行' : '暂无可读取的日志'" />
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { logsApi } from '@/api/logs'
import type { ServerLogLineLimit, ServerLogSnapshot, ServerLogSource } from '@/types/logs'

const sources: { value: ServerLogSource; label: string }[] = [
  { value: 'carbon', label: '后端运行日志' },
  { value: 'nginx-access', label: 'Nginx 访问日志' },
  { value: 'nginx-error', label: 'Nginx 错误日志' }
]
const lineLimits: ServerLogLineLimit[] = [100, 200, 500, 1000]
const source = ref<ServerLogSource>('carbon')
const lineLimit = ref<ServerLogLineLimit>(200)
const keyword = ref('')
const autoRefresh = ref(false)
const loading = ref(false)
const loadError = ref('')
const snapshot = ref<ServerLogSnapshot | null>(null)
const sourceLabel = computed(() => sources.find(item => item.value === source.value)?.label || '')
const filteredLines = computed(() => {
  const needle = keyword.value.trim().toLowerCase()
  return (snapshot.value?.lines || []).filter(line => !needle || line.toLowerCase().includes(needle))
})
const updatedAt = computed(() => snapshot.value ? new Date(snapshot.value.fetchedAt).toLocaleString('zh-CN') : '尚未读取')
let timer: ReturnType<typeof setTimeout> | undefined
let latestRequest = 0
let active = true

function clearTimer() {
  if (timer !== undefined) clearTimeout(timer)
  timer = undefined
}

function scheduleRefresh() {
  clearTimer()
  if (active && autoRefresh.value && !document.hidden && !loading.value) {
    timer = setTimeout(() => { void loadData() }, 10000)
  }
}

async function loadData() {
  clearTimer()
  const requestId = ++latestRequest
  loading.value = true
  loadError.value = ''
  try {
    const result = await logsApi.getServerTail(source.value, lineLimit.value)
    if (active && requestId === latestRequest) snapshot.value = result
  } catch {
    if (active && requestId === latestRequest) {
      snapshot.value = null
      loadError.value = '请检查网络、管理员权限或服务器日志服务，然后重试。自动刷新已暂停。'
      autoRefresh.value = false
    }
  } finally {
    if (active && requestId === latestRequest) {
      loading.value = false
      scheduleRefresh()
    }
  }
}

function handleVisibility() {
  if (document.hidden) clearTimer()
  else if (autoRefresh.value && !loading.value) void loadData()
}

watch([source, lineLimit], () => {
  snapshot.value = null
  void loadData()
})
watch(autoRefresh, scheduleRefresh)
onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibility)
  void loadData()
})
onBeforeUnmount(() => {
  active = false
  latestRequest++
  clearTimer()
  document.removeEventListener('visibilitychange', handleVisibility)
})
</script>

<style scoped lang="scss">
.server-logs { display: grid; gap: var(--space-6); }
.page-heading {
  h1 { margin: 0 0 var(--space-2); color: var(--text-primary); font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
  p { margin: 0; color: var(--text-secondary); line-height: var(--line-height-relaxed); }
}
.filter-form { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: flex-end; }
.filter-form :deep(.el-form-item) { flex: 1 1 180px; margin-bottom: 0; min-width: 0; }
.filter-form :deep(.el-select) { width: 100%; }
.filter-form :deep(.keyword-filter) { flex-basis: 280px; }
.filter-actions { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: center; }
.hint { margin: var(--space-4) 0 0; font-size: var(--font-size-sm); color: var(--text-secondary); line-height: var(--line-height-relaxed); }
.log-card { min-width: 0; }
.log-summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: var(--space-2); margin-bottom: var(--space-4); color: var(--text-secondary); font-size: var(--font-size-sm); }
.log-output {
  margin: 0;
  padding: var(--space-4);
  height: clamp(280px, 55vh, 640px);
  overflow: auto;
  background: var(--surface-sunken);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  white-space: pre;
  tab-size: 4;
  &:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }
}
.retry-button, .limit-alert { margin-top: var(--space-4); }
.limit-alert { margin-bottom: var(--space-4); }
@media (max-width: 767px) {
  .filter-form :deep(.el-form-item) { flex-basis: 100%; }
  .filter-actions { width: 100%; justify-content: space-between; }
}
</style>
