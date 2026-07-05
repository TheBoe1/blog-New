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
  
  // 颜色系统接入: 见 src/styles/adapters/md-editor.scss (ADR-003 Adapter 层, 全局生效)
  // 这里只持组件 layout, 不持颜色映射 — Adapter 才是 Semantic → 第三方的映射层
  :deep(.md-editor) {
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
