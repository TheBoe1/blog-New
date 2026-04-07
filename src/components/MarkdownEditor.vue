<template>
  <MdEditor
    v-model="content"
    :theme="theme"
    :previewTheme="previewTheme"
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
import 'md-editor-v3/lib/style.css'
import { htmlToMarkdown, isHtmlContent } from '@/utils/markdown'
import { articleApi } from '@/api/article'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  theme?: 'light' | 'dark'
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

const theme = computed(() => props.theme || 'light')
const previewTheme = computed(() => props.theme || 'light')
const language = ref('zh-CN')
const placeholder = computed(() => props.placeholder || '请输入 Markdown 内容...')

const toolbars = [
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
  'undo',
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
    const results = await Promise.all(
      files.map(file => articleApi.uploadImage(file))
    )
    callback(results.map(r => r.url))
  } catch (error) {
    console.error('Image upload failed:', error)
  }
}
</script>

<style scoped lang="scss">
.markdown-editor {
  height: 100%;
  
  :deep(.md-editor) {
    border: 1px solid #e4e7ed;
    border-radius: 4px;
  }
  
  :deep(.md-editor-toolbar-wrapper) {
    border-bottom: 1px solid #e4e7ed;
  }
  
  :deep(.md-editor-content) {
    min-height: 300px;
  }
}
</style>
