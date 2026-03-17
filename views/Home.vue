<template>
  <div class="page-home">
    <div class="dashboard-content">
      <header class="dashboard-header section-card">
        <div class="header-left">
          <h2 class="section-title">
            <span class="status-indicator" :class="server.status.toLowerCase().replace(' ', '-')"></span>
            服务器实时监控4
            <span class="status-badge">{{ server.status }}</span>
          </h2>
          <p class="meta-info">运行时间: {{ stats.uptime }} | 记录总数: {{ stats.logsCount }}</p>
        </div>
        <div class="header-right">
          <div class="refresh-pill">
            <span class="pulse-dot"></span>
            数据刷新中 ({{ refreshSeconds }}s)
          </div>
        </div>
      </header>

      <!-- Main Monitor Grid -->
      <div class="monitor-grid">
        <!-- CPU Usage -->
        <div class="monitor-card section-card">
          <div class="card-header">
            <span class="icon">💻</span>
            <span class="label">CPU 使用率</span>
          </div>
          <div class="card-body">
            <div class="gauge-wrapper">
              <svg viewBox="0 0 100 100" class="gauge-svg">
                <circle class="gauge-track" cx="50" cy="50" r="42" />
                <circle class="gauge-fill cpu" cx="50" cy="50" r="42" :style="{ 'stroke-dashoffset': 263.8 * (1 - server.cpu / 100) }" />
                <text x="50" y="58" class="gauge-text">{{ server.cpu }}%</text>
              </svg>
            </div>
          </div>
          <div class="card-footer">当前负载: {{ (server.cpu * 0.8).toFixed(1) }}%</div>
        </div>

        <!-- Memory Usage -->
        <div class="monitor-card section-card">
          <div class="card-header">
            <span class="icon">🧠</span>
            <span class="label">内存使用率</span>
          </div>
          <div class="card-body">
            <div class="gauge-wrapper">
              <svg viewBox="0 0 100 100" class="gauge-svg">
                <circle class="gauge-track" cx="50" cy="50" r="42" />
                <circle class="gauge-fill memory" cx="50" cy="50" r="42" :style="{ 'stroke-dashoffset': 263.8 * (1 - server.memory / 100) }" />
                <text x="50" y="58" class="gauge-text">{{ server.memory }}%</text>
              </svg>
            </div>
          </div>
          <div class="card-footer">可用: {{ server.memFree || (16 * (1 - server.memory / 100)).toFixed(1) }} GB / 总计: {{ server.memTotal || 16 }} GB</div>
        </div>

        <!-- Network Traffic -->
        <div class="monitor-card section-card network-wide">
          <div class="card-header">
            <span class="icon">🌐</span>
            <span class="label">网络流量</span>
          </div>
          <div class="card-body network-body">
            <div class="network-stats">
              <div class="stat-box down">
                <span class="dir">下载</span>
                <span class="val">{{ server.netIn.toFixed(2) }} MB/s</span>
              </div>
              <div class="stat-box up">
                <span class="dir">上传</span>
                <span class="val">{{ server.netOut.toFixed(2) }} MB/s</span>
              </div>
            </div>
            <div class="network-chart">
              <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#1890ff" stop-opacity="0.2" />
                    <stop offset="100%" stop-color="#1890ff" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path class="chart-area" :d="netAreaPath" fill="url(#netGrad)" />
                <polyline class="chart-line" :points="netLinePoints" fill="none" stroke="#1890ff" stroke-width="2" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Disk Storage -->
        <div class="monitor-card section-card">
          <div class="card-header">
            <span class="icon">💾</span>
            <span class="label">磁盘空间</span>
          </div>
          <div class="card-body disk-body">
            <div class="disk-info">
              <span class="partition">系统盘 (/)</span>
              <span class="percent">{{ server.disk }}%</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar" :style="{ width: server.disk + '%' }"></div>
            </div>
            <p class="disk-meta">已用 {{ server.diskUsed || '128GB' }} / 总共 {{ server.diskTotal || '512GB' }}</p>
          </div>
        </div>
      </div>

      <!-- Logs Section -->
      <section class="logs-section section-card">
        <div class="card-header">
          <span class="icon">📋</span>
          <span class="label">实时运行日志</span>
        </div>
        <div class="log-container">
          <div v-for="(log, idx) in server.logs" :key="idx" class="log-line">
            <span class="log-time">[{{ log.time }}]</span>
            <span class="log-lvl" :class="log.level.toLowerCase()">{{ log.level }}</span>
            <span class="log-msg">{{ log.msg }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { getSystemStats } from '../main/mockData.js';

// 获取真实数据的函数
const fetchRealServerData = async () => {
  try {
    // 尝试调用后端框架的真实监控接口
    // 注意：博客项目和后台管理系统通常部署在同一域名下，通过 Nginx 转发 /prod-api
    const response = await fetch('/prod-api/monitor/server', {
      headers: {
        // 如果需要鉴权，可以从管理系统的存储中尝试获取 token
        'Authorization': 'Bearer ' + (localStorage.getItem('Admin-Token') || '')
      }
    });
    const res = await response.json();
    if (res.code === 200 && res.data) {
      const data = res.data;
      // 映射后端数据到前端展示结构
      server.value.cpu = data.cpu.used;
      server.value.memory = data.mem.usage;
      
      // 更新内存详细信息
      server.value.memTotal = data.mem.total;
      server.value.memUsed = data.mem.used;
      server.value.memFree = data.mem.free;
      
      // 更新磁盘详细信息
      if (data.sysFiles && data.sysFiles.length > 0) {
        const disk = data.sysFiles[0];
        server.value.disk = parseFloat(disk.usage);
        server.value.diskTotal = disk.total;
        server.value.diskUsed = disk.used;
      }
      
      server.value.status = 'Online';
      
      // 真实日志模拟：从后端系统信息中提取一些关键点作为日志
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0') + ':' + now.getSeconds().toString().padStart(2, '0');
      
      const realLogs = [
        { time: timeStr, level: 'INFO', msg: `系统运行正常: CPU ${server.value.cpu}%, 内存 ${server.value.memory}%` },
        { time: timeStr, level: 'INFO', msg: `服务器 IP: ${data.sys.computerIp} (${data.sys.osName})` },
        { time: timeStr, level: 'INFO', msg: `JVM 内存: ${data.jvm.total}MB 已用 / ${data.jvm.free}MB 剩余` }
      ];
      
      // 保持日志滚动
      server.value.logs = [...realLogs, ...server.value.logs.slice(0, 7)];
    }
  } catch (error) {
    console.error('无法获取真实监控数据，切换回模拟模式:', error);
    // 失败时保持模拟增长逻辑
    simulateGrowth();
  }
};

const simulateGrowth = () => {
  server.value.cpu = Math.floor(20 + Math.random() * 60);
  server.value.memory = Math.floor(40 + Math.random() * 40);
  server.value.netIn = 0.5 + Math.random() * 3;
  server.value.netOut = 0.2 + Math.random() * 1.5;
  netHistory.value.push(Math.floor(20 + Math.random() * 70));
  if (netHistory.value.length > 15) netHistory.value.shift();
  server.value.status = server.value.cpu > 80 ? 'High Load' : 'Online';
};

const stats = ref(getSystemStats());
const server = ref(stats.value.server);
const refreshSeconds = ref(3);

// Network chart simulation
const netHistory = ref([45, 30, 50, 60, 40, 55, 65, 50, 70, 60]);
const netLinePoints = computed(() => {
  const w = 200, h = 60, max = 100;
  return netHistory.value.map((v, i) => {
    const x = (i / (netHistory.value.length - 1)) * w;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(' ');
});

const netAreaPath = computed(() => {
  const w = 200, h = 60;
  return `M0,${h} ${netLinePoints.value} L${w},${h} Z`;
});

let refreshTimer;
onMounted(() => {
  // 首次加载
  fetchRealServerData();
  
  refreshTimer = setInterval(() => {
    if (refreshSeconds.value > 1) {
      refreshSeconds.value--;
    } else {
      refreshSeconds.value = 3;
      // 定时获取真实数据
      fetchRealServerData();
    }
  }, 1000);
});

onUnmounted(() => clearInterval(refreshTimer));
</script>

<style scoped>
.page-home {
  min-height: 100%;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 仿美团卡片容器 */
.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.status-indicator.online { background: #52c41a; }
.status-indicator.high-load { background: #faad14; }

.status-badge {
  font-size: 0.75rem;
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
  padding: 2px 8px;
  border-radius: 4px;
}

.meta-info {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}

.refresh-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f7ff;
  color: #1890ff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #1890ff;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.network-wide {
  grid-column: span 1;
}
@media (min-width: 1024px) {
  .network-wide { grid-column: span 2; }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.card-header .label {
  font-weight: 600;
  color: #666;
  font-size: 0.95rem;
}

.gauge-wrapper {
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.gauge-track {
  fill: none;
  stroke: #f5f5f5;
  stroke-width: 8;
}

.gauge-fill {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.5s ease;
  stroke-dasharray: 263.8;
}

.gauge-fill.cpu { stroke: #1890ff; }
.gauge-fill.memory { stroke: #52c41a; }

.gauge-text {
  fill: #333;
  font-size: 1.2rem;
  font-weight: 700;
  text-anchor: middle;
}

.card-footer {
  margin-top: 20px;
  text-align: center;
  font-size: 0.85rem;
  color: #999;
}

.network-body {
  display: flex;
  gap: 40px;
  align-items: center;
}

.network-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat-box {
  display: flex;
  flex-direction: column;
}

.stat-box .dir {
  font-size: 0.75rem;
  color: #999;
}

.stat-box .val {
  font-size: 1.2rem;
  font-weight: 700;
  color: #333;
}

.network-chart {
  flex: 1;
  height: 80px;
}

.chart-line {
  filter: drop-shadow(0 2px 4px rgba(24, 144, 255, 0.2));
}

/* 磁盘样式 */
.disk-body { display: flex; flex-direction: column; gap: 16px; }
.disk-info { display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; color: #333; }
.progress-container { height: 10px; background: #f5f5f5; border-radius: 10px; overflow: hidden; }
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #722ed1);
  border-radius: 10px;
  transition: width 1s ease;
}
.disk-meta { font-size: 0.85rem; color: #999; margin: 0; }

/* 日志样式 */
.logs-section { padding: 24px; }
.log-container {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  height: 200px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.85rem;
  border: 1px solid #f1f1f1;
}
.log-line { display: flex; gap: 12px; margin-bottom: 8px; line-height: 1.6; }
.log-time { color: #999; min-width: 85px; }
.log-lvl { font-weight: 700; text-transform: uppercase; min-width: 45px; }
.log-lvl.info { color: #52c41a; }
.log-lvl.warn { color: #faad14; }
.log-msg { color: #666; }
</style>