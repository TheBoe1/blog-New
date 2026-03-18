<template>
  <div class="page-git">
    <div class="content-wrapper">
      <div class="article-header">
        <h2 class="page-title">Git 完整教程：从安装到协作</h2>
        <p class="page-subtitle">完整的 Git 版本控制教程，从零开始掌握版本管理</p>
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
        <h3 class="section-title">📌 Git 常用命令速查</h3>
        <div class="block">
          <div class="k">初始化与配置</div>
          <pre class="code">git init
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"</pre>
        </div>
        <div class="block">
          <div class="k">基本操作</div>
          <pre class="code">git add .
git commit -m "提交说明"
git status
git log</pre>
        </div>
        <div class="block">
          <div class="k">远程操作</div>
          <pre class="code">git remote add origin &lt;仓库地址&gt;
git push -u origin main
git pull</pre>
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
  document.title = 'Git 完整教程 - 教程';
});

onUnmounted(() => {
  document.title = '文章分类';
});

const article = computed(() => getLearningArticleById(15));

const outline = [
  'Git 安装与配置',
  '创建与初始化本地仓库',
  '添加文件到暂存区',
  '提交到本地仓库',
  '查看提交历史与差异',
  '关联远程仓库',
  '推送与拉取代码',
  '分支管理与合并'
];

const stepDescriptions = [
  'Windows/Mac/Linux 多平台安装指南',
  'git init 和 git clone 两种方式',
  'git add 基本用法和状态查看',
  'git commit 提交信息规范',
  'git log、git diff 查看变更',
  'git remote 关联远程仓库',
  'git push 和 git pull 同步代码',
  'git branch 分支创建、切换与合并'
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
.page-git {
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
