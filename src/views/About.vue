<template>
  <BlogLayout3Col>
    <template #top>
      <div class="about-facts-widget">
        <h3 class="widget-title">本站</h3>
        <dl class="about-facts">
          <dt>技术栈</dt>
          <dd>Vue 3 · TypeScript · Vite · UnoCSS · Go</dd>

          <dt>写作焦点</dt>
          <dd>后端工程 · AI 开发 · 系统设计 · 软件架构</dd>
        </dl>
      </div>
    </template>

    <article class="about-essay">
      <div class="markdown-content">
        <MdPreview
          :editorId="editorId"
          :modelValue="aboutMd"
          :theme="theme"
          previewTheme="github"
          codeTheme="github"
        />
      </div>
    </article>
  </BlogLayout3Col>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { MdPreview } from 'md-editor-v3'
import { useThemeStore } from '@/stores/theme'
import BlogLayout3Col from '@/components/BlogLayout3Col.vue'
import aboutMd from '@/data/about.md?raw'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
// 复用文章详情页的暗色管线：theme 跟随站点 isDark
const theme = computed<'light' | 'dark'>(() => (isDark.value ? 'dark' : 'light'))

const editorId = 'about-md-preview'
</script>

<style scoped lang="scss">
// ── Essay (markdown 渲染交给全局 .markdown-content, 见 styles/markdown.scss) ──
.about-essay {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);
}

// ── Right sidebar: facts widget ──
.about-facts-widget {
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-md);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  color: var(--text-secondary);

  .widget-title {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-2);
  }
}

.about-facts {
  display: grid;
  gap: var(--space-4);
  margin: 0;

  dt {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 4px;
  }

  dd {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.6;
  }
}
</style>
