<template>
  <div class="maintenance">
    <header class="page-heading">
      <h1>MySQL 备份与定时任务</h1>
      <p>关联 ECS 上现有的 root cron 脚本、备份执行日志和本地备份记录。</p>
    </header>

    <el-card shadow="never" v-loading="loading">
      <div class="section-heading">
        <h2>MySQL 备份概览</h2>
        <el-button type="primary" :loading="loading" @click="loadData">刷新</el-button>
      </div>
      <el-alert v-if="loadError" title="运维数据读取失败，请检查网络、权限或服务后重试。" type="error" :closable="false" show-icon />
      <template v-else-if="snapshot">
        <dl class="backup-summary">
          <dt>最近执行结果</dt><dd><el-tag :type="outcomeType">{{ outcomeLabel }}</el-tag><span class="inline-time">{{ formatTime(snapshot.backup.latestOutcome.at) }}</span></dd>
          <dt>执行日志</dt><dd class="outcome-message">{{ snapshot.backup.latestOutcome.message }}</dd>
          <dt>本地目录</dt><dd>{{ snapshot.backup.directory }}</dd>
          <dt>本地保留策略</dt><dd>{{ snapshot.backup.localRetentionDays === null ? '脚本未声明' : `脚本设定 ${snapshot.backup.localRetentionDays} 天，实际清理由原脚本执行` }}</dd>
          <dt>OSS 目标</dt><dd v-if="snapshot.backup.destination">oss://{{ snapshot.backup.destination.bucket }}/{{ snapshot.backup.destination.prefix }} · {{ snapshot.backup.destination.storageClass }}</dd><dd v-else>脚本未声明可读取的归档目标</dd>
          <dt>服务器时区</dt><dd>{{ snapshot.timezone }}（cron 表达式按服务器时区执行）</dd>
          <dt>快照更新时间</dt><dd>{{ formatTime(snapshot.fetchedAt) }}</dd>
        </dl>
        <div class="log-actions">
          <el-button @click="openLog('mysql-backup')">查看备份日志</el-button>
          <el-button @click="openLog('mysql')">查看 MySQL 运行日志</el-button>
          <el-button @click="openLog('cron', true)">查看 cron 调度日志</el-button>
        </div>
        <p class="hint">只读接入现有脚本，不读取 SQL 内容或数据库密码，不执行备份、恢复、删除或修改计划。执行结果来自日志，当前 OSS 对象状态未重新核验。</p>
      </template>
    </el-card>

    <template v-if="snapshot && !loadError">
      <el-card shadow="never">
        <h2>现有定时任务</h2>
        <el-alert v-for="task in warningTasks" :key="task.id" :title="`${task.name}日志存在异常`" :description="task.logWarning || ''" type="warning" :closable="false" show-icon />
        <el-alert v-if="!snapshot.cronAvailable" title="无法读取 root crontab；下方不应视为完整任务配置。" type="warning" :closable="false" />
        <div class="admin-table-scroll">
          <el-table :data="snapshot.tasks" row-key="id" empty-text="暂无可读取的定时任务">
            <el-table-column prop="name" label="任务" min-width="180" />
            <el-table-column label="cron 表达式" min-width="150"><template #default="{ row }"><span class="mono">{{ row.schedules.join('；') || '未配置' }}</span></template></el-table-column>
            <el-table-column label="配置状态" width="120"><template #default="{ row }"><el-tag :type="row.configured && row.scriptAvailable ? 'success' : 'warning'" size="small">{{ !row.configured ? '未配置' : row.scriptAvailable ? '已配置' : '脚本不可用' }}</el-tag></template></el-table-column>
            <el-table-column prop="script" label="关联脚本" min-width="260" show-overflow-tooltip />
            <el-table-column label="日志更新时间" width="185"><template #default="{ row }">{{ formatTime(row.logUpdatedAt) }}</template></el-table-column>
            <el-table-column label="执行日志" width="110" fixed="right"><template #default="{ row }"><el-button v-if="row.logSource" type="primary" link @click="openLog(row.logSource)">查看日志</el-button><span v-else>未集中记录</span></template></el-table-column>
          </el-table>
        </div>
        <p class="hint">“已配置”表示在 root crontab 中找到对应脚本，不等于正在运行或执行成功。日志更新时间不是任务开始时间；不包含其他用户或 systemd timer 的任务。</p>
      </el-card>

      <el-card shadow="never">
        <h2>本地备份文件</h2>
        <el-alert v-if="!snapshot.backup.available" title="本地备份目录不存在或不可读取。" type="warning" :closable="false" />
        <el-alert v-if="snapshot.backup.limited" title="文件数量超过展示上限，当前只显示扫描范围内最新的 100 条记录。" type="warning" :closable="false" />
        <div class="admin-table-scroll">
          <el-table :data="snapshot.backup.records" row-key="name" empty-text="暂无本地备份文件">
            <el-table-column prop="name" label="文件名" min-width="300" show-overflow-tooltip />
            <el-table-column label="大小" width="120"><template #default="{ row }">{{ formatBytes(row.bytes) }}</template></el-table-column>
            <el-table-column label="更新时间" min-width="190"><template #default="{ row }">{{ formatTime(row.modifiedAt) }}</template></el-table-column>
            <el-table-column label="本地文件状态" width="130"><template #default="{ row }"><el-tag :type="row.partial ? 'warning' : 'info'" size="small">{{ row.partial ? '临时文件' : '已生成' }}</el-tag></template></el-table-column>
          </el-table>
        </div>
        <p class="hint">只展示文件元数据。文件“已生成”不代表当前归档对象已核验或一定可恢复；恢复验证须另行执行。</p>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { logsApi } from '@/api/logs'
import type { MaintenanceSnapshot, ServerLogSource } from '@/types/logs'

const router = useRouter()
const snapshot = ref<MaintenanceSnapshot | null>(null)
const loading = ref(false)
const loadError = ref(false)
const outcomeLabel = computed(() => ({ success: '日志报告成功', failed: '日志报告失败', unknown: '结果未知' })[snapshot.value?.backup.latestOutcome.status || 'unknown'])
const outcomeType = computed(() => ({ success: 'success', failed: 'danger', unknown: 'info' } as const)[snapshot.value?.backup.latestOutcome.status || 'unknown'])
const warningTasks = computed(() => (snapshot.value?.tasks || []).filter(task => task.logWarning))
let active = true

async function loadData() {
  if (loading.value) return
  loading.value = true
  loadError.value = false
  try {
    const result = await logsApi.getMaintenance()
    if (active) snapshot.value = result
  } catch {
    if (active) {
      snapshot.value = null
      loadError.value = true
    }
  } finally {
    if (active) loading.value = false
  }
}

function openLog(source: ServerLogSource, ecs = false) {
  void router.push({ path: ecs ? '/admin/ecs-logs' : '/admin/server-logs', query: { source } })
}

function formatTime(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN') : '尚无记录'
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`
}

onMounted(() => { void loadData() })
onBeforeUnmount(() => { active = false })
</script>

<style scoped lang="scss">
.maintenance { display: grid; gap: var(--space-6); min-width: 0; }
.page-heading {
  h1 { margin: 0 0 var(--space-2); color: var(--text-primary); font-size: var(--font-size-2xl); font-weight: var(--font-weight-semibold); }
  p { margin: 0; color: var(--text-secondary); line-height: var(--line-height-relaxed); }
}
h2 { margin: 0 0 var(--space-4); color: var(--text-primary); font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); }
.section-heading { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-4); h2 { margin: 0; } }
.backup-summary { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: var(--space-3) var(--space-6); margin: 0; line-height: var(--line-height-relaxed); dt { color: var(--text-secondary); } dd { margin: 0; color: var(--text-primary); overflow-wrap: anywhere; } }
.inline-time { margin-left: var(--space-3); }
.log-actions { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-top: var(--space-6); :deep(.el-button + .el-button) { margin-left: 0; } }
.hint { margin: var(--space-4) 0 0; color: var(--text-secondary); font-size: var(--font-size-sm); line-height: var(--line-height-relaxed); }
@media (max-width: 767px) { .backup-summary { grid-template-columns: minmax(0, 1fr); gap: var(--space-2); dd { margin-bottom: var(--space-3); } } }
</style>
