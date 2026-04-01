<template>
  <div class="learning-detail-container">
    <div class="article-wrapper" ref="articleWrapper">
      <div class="article-main" :class="{ 'with-outline': showOutline && filteredOutlineItems.length > 0 }">
        <a-page-header
          :title="detail?.topic"
          @back="goBack"
        >
          <template #tags>
            <a-tag color="blue">{{ detail?.bigName }}</a-tag>
            <a-tag>{{ detail?.techName }}</a-tag>
            <a-tag color="green">{{ detail?.themeName }}</a-tag>
          </template>
          <template #extra>
            <a-space>
              <span class="date-text"><CalendarOutlined /> 发布于 {{ detail?.date }}</span>
            </a-space>
          </template>
          <template #footer>
            <a-space v-if="detail?.tags?.length" wrap>
              <a-tag v-for="tag in detail.tags" :key="tag">{{ tag }}</a-tag>
            </a-space>
          </template>
        </a-page-header>

        <a-divider />

        <div class="article-content" ref="contentRef" v-if="detail?.content">
          <div class="content-section" v-html="parsedContent"></div>
        </div>
        
        <a-empty v-else description="详情内容正在持续更新中..." />

        <a-divider />

        <a-row justify="space-between" align="middle">
          <a-col>
            <a-space>
              <a-button type="text" @click="goBack">
                <template #icon><LeftOutlined /></template>
                返回列表
              </a-button>
            </a-space>
          </a-col>
          <a-col>
            <a-typography-text type="secondary">
              最后更新于: {{ detail?.date }}
            </a-typography-text>
          </a-col>
        </a-row>
      </div>

      <div 
        v-if="showOutline && filteredOutlineItems.length > 0" 
        class="article-outline"
        :class="{ 'outline-collapsed': outlineCollapsed }"
      >
        <div class="outline-header">
          <a-typography-text strong v-if="!outlineCollapsed">
            <UnorderedListOutlined /> 目录
          </a-typography-text>
          <UnorderedListOutlined v-else />
          <a-button 
            type="text" 
            size="small" 
            @click="outlineCollapsed = !outlineCollapsed"
            class="outline-toggle"
          >
            <template #icon>
              <MenuFoldOutlined v-if="!outlineCollapsed" />
              <MenuUnfoldOutlined v-else />
            </template>
          </a-button>
        </div>
        <div class="outline-content" v-show="!outlineCollapsed" ref="outlineContentRef">
          <div class="outline-list">
            <div
              v-for="item in visibleOutlineItems"
              :key="item.id"
              :ref="el => setOutlineItemRef(el, item.id)"
              :class="['outline-item', `level-${item.level}`, { active: activeHeadingId === item.id }]"
              @click="scrollToHeading(item.id)"
            >
              {{ item.text }}
            </div>
          </div>
          <div v-if="hasMoreOutline" class="outline-more">
            <a-button 
              type="text" 
              size="small" 
              block
              @click="showAllOutline = !showAllOutline"
              class="outline-more-btn"
            >
              <template #icon>
                <EllipsisOutlined v-if="!showAllOutline" />
                <MinusOutlined v-else />
              </template>
              {{ showAllOutline ? '收起大纲' : `共 ${filteredOutlineItems.length} 项` }}
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <a-back-top :visibilityHeight="200" />

    <a-drawer
      v-model:open="mobileOutlineVisible"
      title="目录"
      placement="right"
      :width="260"
      class="outline-drawer"
    >
      <div class="outline-list mobile">
        <div
          v-for="item in filteredOutlineItems"
          :key="item.id"
          :class="['outline-item', `level-${item.level}`, { active: activeHeadingId === item.id }]"
          @click="scrollToHeadingMobile(item.id)"
        >
          {{ item.text }}
        </div>
      </div>
    </a-drawer>

    <div v-if="isMobile && filteredOutlineItems.length > 0" class="mobile-outline-trigger">
      <a-button 
        type="primary" 
        shape="circle"
        size="large"
        @click="mobileOutlineVisible = true"
      >
        <template #icon><UnorderedListOutlined /></template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getLearningArticleByRoute, getLearningArticleById } from '../main/mockData.js';
import { 
  CalendarOutlined, 
  LeftOutlined, 
  UnorderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EllipsisOutlined,
  MinusOutlined
} from '@ant-design/icons-vue';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import bash from 'highlight.js/lib/languages/bash';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('java', java);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('plaintext', plaintext);

const route = useRoute();
const router = useRouter();
const detail = ref(null);
const contentRef = ref(null);
const articleWrapper = ref(null);
const outlineItems = ref([]);
const showOutline = ref(false);
const outlineCollapsed = ref(false);
const mobileOutlineVisible = ref(false);
const isMobile = ref(false);
const activeHeadingId = ref('');
const collapsedCodeBlocks = ref({});
const outlineContentRef = ref(null);
const outlineItemRefs = {};
const isOutlineScrolling = ref(false);
let outlineScrollTimeout = null;

const filteredOutlineItems = computed(() => {
  return outlineItems.value.filter(item => item.level <= 3);
});

const showAllOutline = ref(true);
const visibleOutlineItems = computed(() => {
  if (showAllOutline.value) {
    return filteredOutlineItems.value;
  }
  return filteredOutlineItems.value.slice(0, 5);
});

const hasMoreOutline = computed(() => {
  return filteredOutlineItems.value.length > 5;
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

const parseContent = (content) => {
  if (!content) return '';
  
  let result = content;
  
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  result = result.replace(codeBlockRegex, (match, lang, code) => {
    const language = lang || 'plaintext';
    const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
    const trimmedCode = code.trim();
    const lineCount = trimmedCode.split('\n').length;
    
    let highlightedCode;
    try {
      if (hljs.getLanguage(language)) {
        highlightedCode = hljs.highlight(trimmedCode, { language }).value;
      } else {
        highlightedCode = hljs.highlightAuto(trimmedCode).value;
      }
    } catch (e) {
      highlightedCode = escapeHtml(trimmedCode);
    }
    
    return `<div class="code-block" data-code-id="${codeId}">
      <div class="code-header">
        <span class="code-lang">${language}</span>
        <div class="code-actions">
          <button class="code-toggle-btn" onclick="toggleCode('${codeId}')" title="收起/展开">
            <span class="toggle-icon">▼</span>
          </button>
          <button class="copy-btn" onclick="copyCode('${codeId}')" title="复制代码">
            <svg class="copy-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
            </svg>
          </button>
        </div>
      </div>
      <pre class="code-content" id="${codeId}"><code class="hljs language-${language}">${highlightedCode}</code></pre>
    </div>`;
  });
  
  const inlineCodeRegex = /`([^`]+)`/g;
  result = result.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');
  
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  result = result.replace(headingRegex, (match, hashes, text) => {
    const level = hashes.length;
    const id = 'heading-' + Math.random().toString(36).substr(2, 9);
    return `<h${level} id="${id}" class="article-heading heading-${level}">${text}</h${level}>`;
  });
  
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  result = result.replace(/^- (.+)$/gm, '<li>$1</li>');
  result = result.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  result = result.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  result = result.replace(/^-{3,}$/gm, '<hr class="divider" />');
  
  result = result.replace(/\n\n/g, '</p><p class="paragraph">');
  result = '<p class="paragraph">' + result + '</p>';
  
  result = result.replace(/<p class="paragraph"><\/p>/g, '');
  result = result.replace(/<p class="paragraph">(<h[1-6])/g, '$1');
  result = result.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  result = result.replace(/<p class="paragraph">(<div class="code-block")/g, '$1');
  result = result.replace(/(<\/div>)<\/p>/g, '$1');
  result = result.replace(/<p class="paragraph">(<ul)/g, '$1');
  result = result.replace(/(<\/ul>)<\/p>/g, '$1');
  result = result.replace(/<p class="paragraph">(<hr)/g, '$1');
  result = result.replace(/(<\/hr>)<\/p>/g, '$1');
  
  return result;
};

const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
};

const parsedContent = computed(() => {
  return parseContent(detail.value?.content || '');
});

const extractOutline = () => {
  nextTick(() => {
    if (!contentRef.value) return;
    
    const headings = contentRef.value.querySelectorAll('.article-heading');
    outlineItems.value = Array.from(headings).map(h => ({
      id: h.id,
      text: h.textContent,
      level: parseInt(h.tagName.replace('H', ''))
    }));
    
    showOutline.value = filteredOutlineItems.value.length > 0;
  });
};

const scrollToHeading = (id) => {
  const target = document.getElementById(id);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activeHeadingId.value = id;
  }
};

const scrollToHeadingMobile = (id) => {
  scrollToHeading(id);
  mobileOutlineVisible.value = false;
};

const setOutlineItemRef = (el, id) => {
  if (el) {
    outlineItemRefs[id] = el;
  }
};

const scrollOutlineToActive = (id) => {
  if (!outlineContentRef.value || isOutlineScrolling.value) return;
  
  const activeElement = outlineItemRefs[id];
  if (!activeElement) return;
  
  const container = outlineContentRef.value;
  const containerRect = container.getBoundingClientRect();
  const elementRect = activeElement.getBoundingClientRect();
  
  const containerHeight = containerRect.height;
  const elementTop = elementRect.top - containerRect.top;
  const elementHeight = elementRect.height;
  
  const isAboveViewport = elementTop < 60;
  const isBelowViewport = elementTop + elementHeight > containerHeight - 60;
  
  if (isAboveViewport || isBelowViewport) {
    const targetScrollTop = container.scrollTop + elementTop - (containerHeight / 2) + (elementHeight / 2);
    
    isOutlineScrolling.value = true;
    
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
    
    if (outlineScrollTimeout) {
      clearTimeout(outlineScrollTimeout);
    }
    
    outlineScrollTimeout = setTimeout(() => {
      isOutlineScrolling.value = false;
    }, 300);
  }
};

const updateActiveHeading = () => {
  const headings = document.querySelectorAll('.article-heading');
  let currentId = '';
  
  headings.forEach(heading => {
    const rect = heading.getBoundingClientRect();
    if (rect.top <= 150) {
      currentId = heading.id;
    }
  });
  
  if (currentId && currentId !== activeHeadingId.value) {
    activeHeadingId.value = currentId;
    scrollOutlineToActive(currentId);
  }
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }
  const target = detail.value?.themeRoute;
  if (target) router.push(target);
  else router.push('/learning');
};

const checkMobile = () => {
  isMobile.value = window.innerWidth < 1200;
};

const handleOutlineScroll = () => {
  isOutlineScrolling.value = true;
  
  if (outlineScrollTimeout) {
    clearTimeout(outlineScrollTimeout);
  }
  
  outlineScrollTimeout = setTimeout(() => {
    isOutlineScrolling.value = false;
  }, 150);
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  window.addEventListener('scroll', updateActiveHeading);
  
  if (outlineContentRef.value) {
    outlineContentRef.value.addEventListener('scroll', handleOutlineScroll);
  }
  
  window.copyCode = (codeId) => {
    const codeElement = document.getElementById(codeId);
    if (codeElement) {
      const code = codeElement.textContent;
      navigator.clipboard.writeText(code).then(() => {
        const block = document.querySelector(`[data-code-id="${codeId}"]`);
        if (block) {
          const btn = block.querySelector('.copy-btn');
          const svg = btn.querySelector('.copy-icon');
          btn.classList.add('copied');
          svg.innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>';
          setTimeout(() => {
            svg.innerHTML = '<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>';
            btn.classList.remove('copied');
          }, 2000);
        }
      });
    }
  };
  
  window.toggleCode = (codeId) => {
    const block = document.querySelector(`[data-code-id="${codeId}"]`);
    if (block) {
      const content = block.querySelector('.code-content');
      const icon = block.querySelector('.toggle-icon');
      if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
        block.classList.remove('collapsed');
      } else {
        content.style.display = 'none';
        icon.textContent = '▶';
        block.classList.add('collapsed');
      }
    }
  };
  
  extractOutline();
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  window.removeEventListener('scroll', updateActiveHeading);
  
  if (outlineContentRef.value) {
    outlineContentRef.value.removeEventListener('scroll', handleOutlineScroll);
  }
  
  if (outlineScrollTimeout) {
    clearTimeout(outlineScrollTimeout);
  }
  
  delete window.copyCode;
  delete window.toggleCode;
});
</script>

<style scoped>
.learning-detail-container {
  position: relative;
}

.learning-detail-container :deep(.ant-page-header) {
  padding: 24px 0;
}

.learning-detail-container :deep(.ant-page-header-heading-title) {
  font-size: 24px;
  font-weight: 600;
  color: #202124;
}

.learning-detail-container :deep(.ant-tag) {
  border-radius: 12px;
  padding: 2px 12px;
  font-size: 12px;
  border: none;
  font-weight: 500;
}

.article-wrapper {
  display: flex;
  gap: 24px;
  position: relative;
}

.article-main {
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 220px);
  transition: margin-right 0.3s;
}

.article-main.with-outline {
  margin-right: 0;
}

.article-outline {
  position: fixed;
  right: 24px;
  top: 80px;
  width: 180px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.outline-collapsed {
  width: 48px;
  max-height: 48px;
  overflow: hidden;
}

.outline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: transparent;
  border-radius: 8px 8px 0 0;
}

.article-outline:not(.outline-collapsed) .outline-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px 8px 0 0;
}

.outline-toggle {
  opacity: 0.7;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s;
}

.outline-toggle:hover {
  opacity: 1;
  background: rgba(66, 133, 244, 0.1);
}

.outline-content {
  padding: 12px;
}

.outline-collapsed .outline-content {
  display: none !important;
  padding: 0;
  height: 0;
  overflow: hidden;
}

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.outline-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #5f6368;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-left: 3px solid transparent;
  margin: 2px 0;
}

.outline-item:hover {
  background: rgba(66, 133, 244, 0.08);
  color: #1a73e8;
  border-left-color: #1a73e8;
  transform: translateX(2px);
}

.outline-item.active {
  background: rgba(66, 133, 244, 0.12);
  color: #1a73e8;
  font-weight: 500;
  border-left-color: #1a73e8;
}

.outline-item.level-2 {
  padding-left: 8px;
}

.outline-item.level-3 {
  padding-left: 16px;
  font-size: 12px;
}

.outline-more {
  padding: 0;
  margin-top: 8px;
  border-top: 1px dashed #e8e8e8;
}

.outline-more-btn {
  color: #8c8c8c !important;
  font-size: 12px !important;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.outline-more-btn:hover {
  color: #1890ff !important;
  background: #f0f5ff !important;
}

.outline-more-btn :deep(.anticon) {
  font-size: 14px;
}

.article-content {
  line-height: 1.8;
  font-size: 15px;
  color: #333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.content-section :deep(.paragraph) {
  margin-bottom: 16px;
  line-height: 1.8;
}

.content-section :deep(.article-heading) {
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #262626;
}

.content-section :deep(.heading-1) {
  font-size: 24px;
}

.content-section :deep(.heading-2) {
  font-size: 20px;
}

.content-section :deep(.heading-3) {
  font-size: 18px;
}

.content-section :deep(.heading-4) {
  font-size: 16px;
}

.content-section :deep(.inline-code) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 0.85em;
  color: #fff;
}

.content-section :deep(.code-block) {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #282c34;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.content-section :deep(.code-block.collapsed) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.content-section :deep(.code-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #21252b;
  border-bottom: 1px solid #333;
}

.content-section :deep(.code-lang) {
  color: #61afef;
  font-size: 12px;
  text-transform: uppercase;
  font-family: 'Fira Code', monospace;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.content-section :deep(.code-actions) {
  display: flex;
  gap: 8px;
}

.content-section :deep(.code-toggle-btn) {
  background: transparent;
  border: none;
  color: #abb2bf;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.2s;
}

.content-section :deep(.code-toggle-btn:hover) {
  background: #3e4451;
  color: #61afef;
}

.content-section :deep(.copy-btn) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.content-section :deep(.copy-btn:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

.content-section :deep(.copy-btn.copied) {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.content-section :deep(.code-content) {
  margin: 0;
  padding: 16px;
  overflow-x: auto;
  background: #282c34;
  transition: all 0.3s ease;
}

.content-section :deep(.code-content code) {
  font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #abb2bf;
}

.content-section :deep(.divider) {
  border: none;
  height: 1px;
  background: linear-gradient(90deg, transparent, #d9d9d9, transparent);
  margin: 24px 0;
}

.content-section :deep(ul) {
  padding-left: 24px;
  margin: 12px 0;
}

.content-section :deep(li) {
  margin: 8px 0;
}

.date-text {
  color: #5f6368;
  font-size: 13px;
}

.learning-detail-container :deep(.ant-btn-text) {
  border-radius: 24px;
  padding: 4px 16px;
  height: 36px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #5f6368;
}

.learning-detail-container :deep(.ant-btn-text:hover) {
  background: rgba(26, 115, 232, 0.08);
  color: #1a73e8;
}

.learning-detail-container :deep(.ant-btn-text:active) {
  background: rgba(26, 115, 232, 0.12);
}

.mobile-outline-trigger {
  position: fixed;
  right: 24px;
  bottom: 80px;
  z-index: 100;
}

.mobile-outline-trigger :deep(.ant-btn) {
  box-shadow: 0 4px 16px rgba(26, 115, 232, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.mobile-outline-trigger :deep(.ant-btn:hover) {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(26, 115, 232, 0.45);
}

.mobile-outline-trigger :deep(.ant-btn:active) {
  transform: scale(0.95);
}

.outline-drawer :deep(.ant-drawer-body) {
  padding: 16px;
}

.outline-list.mobile .outline-item {
  padding: 10px 12px;
}

@media (max-width: 1200px) {
  .article-outline {
    display: none;
  }
  
  .article-main.with-outline {
    margin-right: 0;
  }
}

@media (max-width: 768px) {
  .learning-detail-container :deep(.ant-page-header) {
    padding: 12px 0;
  }
  
  .learning-detail-container :deep(.ant-page-header-heading-title) {
    font-size: 20px;
  }
  
  .content-section :deep(.code-block) {
    margin: 12px -16px;
    border-radius: 0;
  }
  
  .content-section :deep(.code-content) {
    padding: 12px;
    font-size: 12px;
  }
  
  .article-content {
    font-size: 14px;
    line-height: 1.7;
  }
  
  .content-section :deep(.article-heading) {
    margin: 16px 0 12px;
  }
  
  .content-section :deep(.heading-1) {
    font-size: 20px;
  }
  
  .content-section :deep(.heading-2) {
    font-size: 18px;
  }
  
  .content-section :deep(.heading-3) {
    font-size: 16px;
  }
}

@media (max-width: 576px) {
  .learning-detail-container :deep(.ant-page-header-heading-title) {
    font-size: 18px;
  }
  
  .learning-detail-container :deep(.ant-tag) {
    font-size: 11px;
    padding: 1px 8px;
  }
  
  .content-section :deep(.inline-code) {
    padding: 1px 6px;
    font-size: 0.8em;
  }
  
  .mobile-outline-trigger {
    right: 16px;
    bottom: 70px;
  }
  
  .mobile-outline-trigger :deep(.ant-btn) {
    width: 48px;
    height: 48px;
  }
}
</style>

<style>
.hljs {
  background: transparent;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-built_in,
.hljs-name,
.hljs-tag {
  color: #c678dd;
}

.hljs-string,
.hljs-title,
.hljs-section,
.hljs-attribute,
.hljs-literal,
.hljs-template-tag,
.hljs-template-variable,
.hljs-type {
  color: #98c379;
}

.hljs-comment,
.hljs-deletion {
  color: #5c6370;
  font-style: italic;
}

.hljs-number,
.hljs-regexp,
.hljs-addition {
  color: #d19a66;
}

.hljs-function {
  color: #61afef;
}

.hljs-variable,
.hljs-params {
  color: #e06c75;
}

.hljs-selector-class,
.hljs-selector-id {
  color: #e5c07b;
}

.hljs-meta {
  color: #61afef;
}
</style>
