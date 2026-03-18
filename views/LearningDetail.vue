<template>
  <div class="learning-detail">
    <div class="content-wrapper">
      <nav class="detail-nav">
        <button @click="goBack" class="back-btn">
          <span class="arrow">←</span> 返回列表
        </button>
      </nav>

      <div v-if="detail" class="detail-main">
        <div class="section-card detail-container">
          <header class="detail-header">
            <div class="header-meta">
              <span class="category-pill">{{ detail.bigName }} / {{ detail.techName }} / {{ detail.themeName }}</span>
              <span class="date-text">发布于 {{ detail.date }}</span>
              <span v-if="Array.isArray(detail.tags) && detail.tags.length" class="tag-row">
                <span class="tag" v-for="t in detail.tags" :key="t">{{ t }}</span>
              </span>
            </div>
            <h2 class="detail-title">{{ detail.topic }}</h2>
          </header>

          <main class="detail-body" ref="contentContainer">
            <section class="content-section">
              <div v-if="detail?.content" class="article-content" v-html="processedContent"></div>
              <div v-else class="placeholder-content">
                <p class="empty-hint">（详情内容正在持续更新中...）</p>
              </div>
            </section>
          </main>

          <footer class="detail-footer">
            <div class="footer-divider"></div>
            <p class="last-updated">最后更新于: {{ detail.date }}</p>
          </footer>
        </div>

        <aside v-if="showOutline" class="outline-sidebar">
          <div class="outline-card">
            <h3 class="outline-title">📋 教程大纲</h3>
            <div class="outline-list">
              <div 
                v-for="(item, index) in outlineItems" 
                :key="index"
                class="outline-item"
                :class="{ active: activeIndex === index }"
                @click="scrollToSection(index)"
              >
                <div class="step-left">
                  <div class="outline-num">{{ index + 1 }}</div>
                  <div v-if="index < outlineItems.length - 1" class="step-connector"></div>
                </div>
                <div class="step-content">
                  <div class="outline-text">{{ item }}</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getLearningArticleByRoute, getLearningArticleById } from '../main/mockData.js';

const route = useRoute();
const router = useRouter();
const detail = ref(null);
const contentContainer = ref(null);
const activeIndex = ref(0);

const outlineItemsMap = {
  14: [
    '选择合适的云服务器',
    '通过 SSH 远程连接服务器',
    '服务器初始化配置',
    '安装 Nginx Web 服务器',
    '配置 Nginx 托管静态网站',
    '购买域名与配置 DNS 解析',
    '配置 SSL 证书开启 HTTPS',
    '配置 Webhook 实现自动部署'
  ],
  15: [
    'Git 安装与配置',
    '创建与初始化本地仓库',
    '添加文件到暂存区',
    '提交到本地仓库',
    '查看提交历史与差异',
    '关联远程仓库',
    '推送与拉取代码',
    '分支管理与合并'
  ]
};

const outlineItems = computed(() => {
  return outlineItemsMap[detail.value?.id] || [];
});

const showOutline = computed(() => {
  return detail.value?.id === 14 || detail.value?.id === 15;
});

const sectionsMap = {
  14: [
    '第一步：选择合适的云服务器',
    '第二步：通过 SSH 远程连接服务器',
    '第三步：服务器初始化配置',
    '第四步：安装 Nginx Web 服务器',
    '第五步：配置 Nginx 托管静态网站',
    '第六步：购买域名与配置 DNS 解析',
    '第七步：配置 SSL 证书开启 HTTPS',
    '第八步：配置 Webhook 实现自动部署'
  ],
  15: [
    '第一步：Git 安装与配置',
    '第二步：创建与初始化本地仓库',
    '第三步：添加文件到暂存区',
    '第四步：提交到本地仓库',
    '第五步：查看提交历史与差异',
    '第六步：关联远程仓库',
    '第七步：推送与拉取代码',
    '第八步：分支管理与合并'
  ]
};

const processedContent = computed(() => {
  if (!detail.value?.content) return '';
  
  let content = detail.value.content;
  
  content = content.replace(/```(\w+)?\s*([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    const languageLabel = getLanguageLabel(language);
    const trimmedCode = code.trim();
    return `
      <div class="code-container">
        <div class="code-header">
          <span class="code-lang">${languageLabel}</span>
          <button class="copy-btn" onclick="copyCode(this)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            复制
          </button>
        </div>
        <pre class="code-block"><code class="language-${language}">${trimmedCode}</code></pre>
      </div>
    `;
  });
  
  const sections = sectionsMap[detail.value?.id];
  if (sections) {
    sections.forEach((title, index) => {
      content = content.replace(
        new RegExp('## ' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        `<div id="chapter-${index}" class="section-wrapper"><h2 class="section-title">## ${title}</h2>`
      );
    });
  }
  
  return content;
});

const getLanguageLabel = (lang) => {
  const labels = {
    'bash': 'Bash',
    'sh': 'Shell',
    'javascript': 'JavaScript',
    'js': 'JavaScript',
    'python': 'Python',
    'py': 'Python',
    'css': 'CSS',
    'html': 'HTML',
    'json': 'JSON',
    'yaml': 'YAML',
    'yml': 'YAML',
    'sql': 'SQL'
  };
  return labels[lang?.toLowerCase()] || 'Code';
};

const scrollToSection = (index) => {
  activeIndex.value = index;
  const element = document.getElementById('chapter-' + index);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const handleScroll = () => {
  if (!contentContainer.value) return;
  
  const sections = document.querySelectorAll('.section-wrapper');
  const containerRect = contentContainer.value.getBoundingClientRect();
  
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i];
    const rect = section.getBoundingClientRect();
    
    if (rect.top <= containerRect.top + 150) {
      const id = section.id;
      const idx = parseInt(id.split('-')[1]);
      if (idx >= 0 && idx < outlineItems.length) {
        activeIndex.value = idx;
      }
      break;
    }
  }
};

watchEffect(() => {
  if (detail.value) {
    document.title = detail.value.topic;
  }
});

onMounted(() => {
  nextTick(() => {
    if (contentContainer.value && showOutline.value) {
      contentContainer.value.addEventListener('scroll', handleScroll);
    }
  });
  
  window.copyCode = (btn) => {
    const codeContainer = btn.closest('.code-container');
    const codeElement = codeContainer.querySelector('code');
    const code = codeElement.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
      const originalText = btn.innerHTML;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> 已复制`;
      btn.style.color = '#52c41a';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
      }, 2000);
    }).catch(err => {
      console.error('复制失败:', err);
    });
  };
});

onUnmounted(() => {
  document.title = '文章分类';
  if (contentContainer.value) {
    contentContainer.value.removeEventListener('scroll', handleScroll);
  }
});

const routePath = computed(() => {
  const id = route.params.id;
  const big = route.params.big;
  const tech = route.params.tech;
  const theme = route.params.theme;
  const slug = route.params.slug;
  
  if (slug && big && tech && theme) {
    return `/learning/${big}/${tech}/${theme}/${slug}`;
  }
  if (id) {
    return null;
  }
  return null;
});

watchEffect(() => {
  if (routePath.value) {
    detail.value = getLearningArticleByRoute(routePath.value);
    return;
  }
  const id = route.params.id;
  if (id) {
    detail.value = getLearningArticleById(id);
    return;
  }
  detail.value = null;
});

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  const target = detail.value?.themeRoute;
  if (target) router.push(target);
  else router.push('/learning');
};
</script>

<style scoped>
.learning-detail {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-nav {
  padding: 20px 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #eee;
  color: #666;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.back-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.detail-main {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* 适配美团/若依背景色的卡片容器 */
.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  flex: 1;
  min-width: 0;
}

.detail-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.detail-header {
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 20px;
}

.header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.category-pill {
  background: #e6f7ff;
  color: #1890ff;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #91d5ff;
}

.date-text {
  color: #999;
  font-size: 0.85rem;
}

.tag-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.78rem;
  color: #555;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 3px 10px;
  border-radius: 999px;
}

.detail-title {
  color: #111827;
  font-size: 2rem;
  font-weight: 900;
  margin: 0;
  line-height: 1.35;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}

.placeholder-content {
  background: #fafafa;
  padding: 24px;
  border-radius: 8px;
  border: 1px dashed #eee;
}

.article-content {
  background: transparent;
  padding: 0;
  border-radius: 0;
  border: none;
  line-height: 1.9;
  font-size: 1rem;
  color: #333;
  margin: 0;
}

.section-wrapper {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.section-content {
  white-space: pre-wrap;
}

.code-container {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
  border-bottom: 1px solid #4a5568;
}

.code-lang {
  font-size: 0.85rem;
  font-weight: 600;
  color: #90cdf4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #a0aec0;
  background: transparent;
  border: 1px solid #4a5568;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  color: #fff;
  background: #4a5568;
  border-color: #718096;
}

.code-block {
  background: #2d3748;
  color: #e2e8f0;
  padding: 16px;
  overflow-x: auto;
  margin: 0;
}

.code-block code {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.7;
  display: block;
  white-space: pre;
}

.empty-hint {
  text-align: center;
  color: #999;
  font-size: 0.9rem;
  margin: 0;
  font-style: italic;
}

.footer-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 40px 0 20px;
}

.last-updated {
  color: #999;
  font-size: 0.85rem;
  text-align: right;
}

/* 侧边栏样式 */
.outline-sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  z-index: 10;
}

.outline-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.outline-title {
  margin: 0 0 18px 0;
  font-size: 1rem;
  font-weight: 800;
  color: #1f2937;
}

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.outline-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.outline-item.active {
  background: #eff6ff;
  border-color: #93c5fd;
}

.outline-item.active .outline-text {
  color: #1890ff;
  font-weight: 700;
}

.step-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 2px;
}

.outline-num {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(24, 144, 255, 0.3);
}

.step-connector {
  width: 3px;
  height: 30px;
  background: linear-gradient(180deg, #1890ff 0%, #93c5fd 100%);
  border-radius: 2px;
}

.step-content {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.outline-text {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
  line-height: 1.4;
}

@media (max-width: 1024px) {
  .detail-main {
    flex-direction: column;
  }
  
  .outline-sidebar {
    width: 100%;
    position: static;
    order: -1;
  }
}
</style>
