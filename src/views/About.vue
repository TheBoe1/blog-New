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
      <MdPreview
        :editorId="editorId"
        :modelValue="aboutMd"
        :theme="theme"
        previewTheme="github"
        codeTheme="github"
      />
    </article>
  </BlogLayout3Col>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
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
// ── Essay (md-editor-v3 preview + brand overrides) ──
.about-essay {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--space-8);
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);

  :deep(.md-editor-preview-wrapper) {
    padding: 0;
  }

  :deep(h1) {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 var(--space-4);
    color: var(--text-primary);
  }

  :deep(h2) {
    font-size: 1.25rem;
    font-weight: 600;
    margin: var(--space-8) 0 var(--space-3);
    color: var(--text-primary);
  }

  :deep(p) {
    margin: var(--space-4) 0;
    line-height: 1.8;
  }

  :deep(ul) {
    margin: var(--space-4) 0;
    padding-left: var(--space-6);
  }

  :deep(li) {
    margin: var(--space-2) 0;
    line-height: 1.7;
  }

  :deep(a) {
    color: var(--brand-primary);
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.2s ease;

    &:hover { color: var(--brand-primary-hover); }
  }

  :deep(code) {
    font-family: 'Source Code Pro', 'Consolas', monospace;
    font-size: 0.9em;
    background: var(--brand-tint);
    color: var(--brand-primary);
    padding: 0.15em 0.4em;
    border-radius: 3px;
  }

  :deep(hr) {
    border: none;
    height: 1px;
    background: var(--border-color);
    margin: var(--space-8) 0;
  }

  :deep(strong) {
    font-weight: 600;
    color: var(--text-primary);
  }
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
