<template>
  <MdEditor
    v-model="content"
    :theme="theme"
    previewTheme="github"
    :language="language"
    :toolbars="toolbars"
    :placeholder="placeholder"
    @onSave="handleSave"
    @onUploadImg="handleUploadImg"
    class="markdown-editor"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MdEditor } from 'md-editor-v3'
import type { ToolbarNames } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { ElMessage } from 'element-plus'
import { htmlToMarkdown, isHtmlContent } from '@/utils/markdown'
import { articleApi } from '@/api/article'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  theme?: 'light' | 'dark'
  articleHash?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string]
  'save': []
}>()

const content = ref(props.modelValue || '')

watch(() => props.modelValue, (newVal) => {
  if (newVal !== content.value) {
    if (isHtmlContent(newVal)) {
      content.value = htmlToMarkdown(newVal)
    } else {
      content.value = newVal || ''
    }
  }
}, { immediate: true })

watch(content, (newVal) => {
  emit('update:modelValue', newVal)
})

// 主题跟随站点 isDark (prop 优先, 否则自动检测; ADR-002 §5 Component Agnostic)
const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const theme = computed<'light' | 'dark'>(() => props.theme ?? (isDark.value ? 'dark' : 'light'))
const language = ref('zh-CN')
const placeholder = computed(() => props.placeholder || '请输入 Markdown 内容...')

const toolbars: ToolbarNames[] = [
  'bold',
  'underline',
  'italic',
  '-',
  'strikeThrough',
  'title',
  'sub',
  'sup',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  '-',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'mermaid',
  '-',
  'revoke',
  'next',
  'save',
  '=',
  'pageFullscreen',
  'fullscreen',
  'preview',
  'catalog'
]

function handleSave() {
  emit('save')
}

async function handleUploadImg(files: File[], callback: (urls: string[]) => void) {
  try {
    const maxSize = 5 * 1024 * 1024
    const oversizedFiles = files.filter(f => f.size > maxSize)
    if (oversizedFiles.length > 0) {
      ElMessage.warning('图片大小不能超过 5MB')
      return
    }
    
    const results = await Promise.all(
      files.map(file => articleApi.uploadImage(file, props.articleHash, 'content'))
    )
    callback(results.map(r => r.url))
  } catch (error) {
    console.error('Image upload failed:', error)
    ElMessage.error('图片上传失败')
  }
}
</script>

<style scoped lang="scss">
.markdown-editor {
  height: 100%;
  
  :deep(.md-editor) {
    // 接入我们的 color system — 覆盖 md-editor-v3 的 CSS 变量到 Semantic/Content token (ADR-002 §5)
    // theme prop 仅控制 CodeMirror 语法高亮 light/dark; chrome/preview 颜色全走我方 token, 不用 md-editor 外来调色盘.
    // ── Chrome (toolbar / input / footer) ──
    --md-bk-color:             var(--surface-card);     // editor bg
    --md-bk-color-outstand:    var(--surface-chrome);   // toolbar/footer bg
    --md-bk-hover-color:       var(--bg-hover);         // hover bg
    --md-color:                var(--text-primary);     // chrome text
    --md-border-color:         var(--border-color);
    --md-border-active-color:  var(--brand-primary);
    --md-border-hover-color:   var(--brand-primary);
    --md-hover-color:          var(--brand-primary);
    // ── Scrollbar ──
    --md-scrollbar-bg-color:             var(--bg-secondary);
    --md-scrollbar-thumb-color:          var(--border-color);
    --md-scrollbar-thumb-hover-color:    var(--border-color-strong);
    --md-scrollbar-thumb-active-color:   var(--border-color-strong);
    // ── Content (preview pane) — Content domain token ──
    --md-theme-color:               var(--text-primary);
    --md-theme-bg-color:            transparent;            // preview 用 editor bg (surface-card)
    --md-theme-border-color:        var(--border-color);
    --md-theme-title-color:         var(--text-primary);
    --md-theme-heading-color:       var(--text-primary);
    --md-theme-link-color:          var(--brand-primary);
    --md-theme-link-hover-color:    var(--brand-primary-hover);
    --md-theme-strong-color:        var(--text-primary);
    --md-theme-em-color:            var(--text-primary);
    --md-theme-del-color:           var(--text-muted);
    --md-theme-blockquote-bg-color: var(--content-quote-bg);
    --md-theme-blockquote-color:    var(--text-secondary);
    --md-theme-quote-bg-color:      var(--content-quote-bg);
    --md-theme-quote-color:         var(--text-secondary);
    --md-theme-quote-border-color:  var(--brand-primary);
    --md-theme-code-bg-color:       var(--content-code-bg);
    --md-theme-code-block-bg-color: var(--content-code-bg);
    --md-theme-code-block-color:    var(--text-primary);
    --md-theme-code-inline-bg-color: var(--content-code-inline-bg);
    --md-theme-code-inline-color:   var(--brand-primary);
    --md-theme-table-thead-bg-color: var(--gradient-brand);
    --md-theme-table-th-color:      var(--text-on-brand);
    --md-theme-table-tht-color:     var(--text-on-brand);
    --md-theme-table-border-color:  var(--border-color);
    --md-theme-table-td-border-color: var(--border-color);
    --md-theme-table-stripe-color:  var(--bg-tertiary);
    --md-theme-table-tr-nc-color:   var(--bg-tertiary);
    --md-theme-table-trh-color:     var(--brand-tint);
    --md-theme-table-tr-bg-color:   transparent;

    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
  }

  :deep(.md-editor-toolbar-wrapper) {
    border-bottom: 1px solid var(--border-color);
  }
  
  :deep(.md-editor-content) {
    min-height: 300px;
  }
}
</style>
