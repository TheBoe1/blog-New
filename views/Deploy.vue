<template>
  <div class="page-deploy">
    <div class="content-wrapper">
      <div class="article-header">
        <h2 class="page-title">从零搭建自己的服务器</h2>
        <p class="page-subtitle">完整的服务器部署教程，从零开始搭建你的个人网站</p>
        <div class="article-tags">
          <span v-for="tag in article?.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        <button class="read-btn" @click="openArticle">📖 阅读完整教程</button>
      </div>

      <section class="section-card">
        <h3 class="section-title">📋 教程大纲</h3>
        <div class="outline-list">
          <div 
            class="outline-item" 
            v-for="(item, index) in outline" 
            :key="index"
            @click="openStep(index)"
          >
            <div class="step-left">
              <div class="outline-num">{{ index + 1 }}</div>
              <div v-if="index < outline.length - 1" class="step-connector"></div>
            </div>
            <div class="step-content">
              <div class="outline-text">{{ item }}</div>
              <div class="step-desc">{{ stepDescriptions[index] }}</div>
            </div>
            <div class="step-arrow">→</div>
          </div>
        </div>
      </section>

      <section class="section-card">
        <h3 class="section-title">📌 当前项目部署</h3>
        <div class="block">
          <div class="k">构建命令</div>
          <pre class="code">npm run build</pre>
        </div>
        <div class="block">
          <div class="k">部署说明</div>
          <div class="v">当前路由基座为 /index/，部署时建议将 dist 内容放到 /var/www/myblog/ 目录，并参考教程第五步配置 Nginx。</div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { getLearningArticleById } from '../main/mockData.js';

const router = useRouter();

onMounted(() => {
  document.title = '从零搭建服务器 - 教程';
});

onUnmounted(() => {
  document.title = '文章分类';
});

const article = computed(() => getLearningArticleById(14));

const outline = [
  '选择合适的云服务器',
  '通过 SSH 远程连接服务器',
  '服务器初始化配置',
  '安装 Nginx Web 服务器',
  '配置 Nginx 托管静态网站',
  '购买域名与配置 DNS 解析',
  '配置 SSL 证书开启 HTTPS',
  '配置 Webhook 实现自动部署'
];

const stepDescriptions = [
  '了解云厂商选择和配置推荐',
  '学习 Windows/Mac/Linux 连接方法',
  '安全配置、软件安装与防火墙',
  'Web 服务器安装与基本操作',
  '站点配置与文件上传',
  '域名购买与 DNS 解析设置',
  '免费证书申请与 HTTPS 开启',
  'Git push 自动触发部署'
];

const openArticle = () => {
  if (article.value) {
    router.push(article.value.route);
  }
};

const openStep = (index) => {
  if (article.value) {
    router.push(article.value.route);
  }
};
</script>

<style scoped>
.page-deploy {
  padding: 0;
  min-height: 100%;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.article-header {
  text-align: center;
  padding: 20px 0;
  margin-bottom: 16px;
}

.page-title {
  color: #111827;
  font-size: 1.8rem;
  font-weight: 900;
  margin: 0 0 10px 0;
}

.page-subtitle {
  color: #6b7280;
  margin: 0 0 16px 0;
  font-size: 1rem;
}

.article-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tag {
  font-size: 0.8rem;
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
}

.read-btn {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.read-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
}

.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f1f1;
  margin-bottom: 16px;
}

.section-title {
  margin: 0 0 14px 0;
  font-size: 1.05rem;
  font-weight: 900;
  color: #111827;
}

.outline-list {
  display: flex;
  flex-direction: column;
  position: relative;
}

.outline-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  position: relative;
  z-index: 1;
}

.outline-item:hover {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-color: #93c5fd;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.1);
}

.step-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.outline-num {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  font-weight: 900;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.step-connector {
  width: 3px;
  height: 40px;
  background: linear-gradient(180deg, #1890ff 0%, #93c5fd 100%);
  border-radius: 2px;
}

.step-content {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.outline-text {
  font-weight: 800;
  color: #1f2937;
  font-size: 1rem;
  margin-bottom: 4px;
}

.step-desc {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
}

.step-arrow {
  font-size: 1.3rem;
  color: #9ca3af;
  flex-shrink: 0;
  margin-top: 6px;
  transition: transform 0.2s, color 0.2s;
}

.outline-item:hover .step-arrow {
  transform: translateX(4px);
  color: #1890ff;
}

.block {
  margin-top: 12px;
}

.k {
  font-size: 0.9rem;
  font-weight: 800;
  color: #374151;
  margin-bottom: 8px;
}

.v {
  color: #6b7280;
  line-height: 1.6;
}

.code {
  margin: 0;
  padding: 12px 14px;
  background: #0b1220;
  color: #e5e7eb;
  border-radius: 10px;
  overflow: auto;
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 520px) {
  .outline-item {
    padding: 12px;
  }
  
  .outline-num {
    width: 36px;
    height: 36px;
    font-size: 0.85rem;
  }
  
  .step-connector {
    height: 32px;
  }
}
</style>

