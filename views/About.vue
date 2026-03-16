<template>
  <div class="page-about">
    <div class="content-wrapper">
      <div class="about-header">
        <h2 class="page-title">关于本系统</h2>
        <p class="page-subtitle">助力技术成长与沉淀的数字化实验室</p>
      </div>
      
      <div class="about-grid">
        <!-- System Intro Card -->
        <section class="section-card intro-card">
          <div class="card-header">
            <span class="icon">✨</span>
            <span class="label">项目愿景</span>
          </div>
          <p class="intro-text">
            <strong>怜言语记</strong> 个人博客系统是一个为开发者量身定制的轻量级、高性能内容管理平台。
            采用 <strong>Vue 3 组合式 API</strong> 开发，致力于在极简的视觉交互中提供极致的性能体验。
          </p>
        </section>

        <!-- Tech Stack Card -->
        <section class="section-card tech-stack">
          <div class="card-header">
            <span class="icon">🛠️</span>
            <span class="label">技术栈 (Tech Stack)</span>
          </div>
          <div class="stack-list">
            <div class="stack-item">
              <span class="stack-name">核心框架</span>
              <span class="stack-val">Vue 3.4 / Vite 5</span>
            </div>
            <div class="stack-item">
              <span class="stack-name">状态管理</span>
              <span class="stack-val">Vue Composition API</span>
            </div>
            <div class="stack-item">
              <span class="stack-name">路由系统</span>
              <span class="stack-val">Vue Router 4 (History Mode)</span>
            </div>
            <div class="stack-item">
              <span class="stack-name">UI 风格</span>
              <span class="stack-val">Clean & Modern UI (Ant Design Based)</span>
            </div>
          </div>
        </section>

        <!-- Version Info Card -->
        <section class="section-card version-card">
          <div class="card-header">
            <span class="icon">📦</span>
            <span class="label">版本信息</span>
          </div>
          <div class="version-content">
            <div class="version-main">
              <span class="v-num">v1.2.0</span>
              <span class="v-status">Stable</span>
            </div>
            <ul class="changelog">
              <li>🚀 全站 UI 扁平化风格重构</li>
              <li>⚡ 引入服务器实时监控仪表盘</li>
              <li>📱 适配移动端响应式布局</li>
              <li>🔍 优化子路由详情跳转逻辑</li>
            </ul>
          </div>
        </section>

        <!-- Author/Contact Card -->
        <section class="section-card contact-card">
          <div class="card-header">
            <span class="icon">📧</span>
            <span class="label">联系与反馈</span>
          </div>
          <div class="contact-links">
            <a href="https://github.com/TheBoe1/LianLab-content" class="contact-link" target="_blank" rel="noopener noreferrer">GitHub仓库</a>
            <a href="https://github.com/TheBoe1/terminal/issues" class="contact-link" target="_blank" rel="noopener noreferrer">问题反馈 (Issues)</a>
            <a href="https://github.com/TheBoe1" class="contact-link" target="_blank" rel="noopener noreferrer">开发者主页</a>
          </div>
          <p class="copyright">© 2026 怜言语记. Open sourced under MIT License.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
// Logic-free for now, purely informational
</script>

<style scoped>
.page-about {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

.about-header {
  padding: 20px 0;
  border-bottom: 1px solid #f1f1f1;
  margin-bottom: 24px;
}

.page-title {
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.page-subtitle {
  color: #999;
  font-size: 0.9rem;
  margin: 0;
}

.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

@media (max-width: 640px) {
  .about-grid {
    grid-template-columns: 1fr;
  }
}

.section-card {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
  transition: all 0.2s ease;
}

.section-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  border-color: #1890ff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.card-header .icon {
  font-size: 1.2rem;
}

.card-header .label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.intro-text {
  color: #666;
  line-height: 1.8;
  font-size: 1rem;
}

.intro-text strong {
  color: #1890ff;
}

/* Tech Stack Styles */
.stack-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stack-item {
  display: flex;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
}

.stack-name {
  color: #999;
  font-size: 0.9rem;
  font-weight: 600;
}

.stack-val {
  color: #333;
  font-weight: 700;
}

/* Version Styles */
.version-main {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.v-num {
  font-size: 1.5rem;
  font-weight: 800;
  color: #52c41a;
}

.v-status {
  background: #f6ffed;
  color: #52c41a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid #b7eb8f;
}

.changelog {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.changelog li {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Contact Styles */
.contact-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.contact-link {
  color: #1890ff;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 8px 16px;
  background: #f0f7ff;
  border-radius: 4px;
  border: 1px solid #bae7ff;
  transition: all 0.2s;
}

.contact-link:hover {
  background: #1890ff;
  color: #fff;
  transform: translateY(-2px);
}

.copyright {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
}
</style>
