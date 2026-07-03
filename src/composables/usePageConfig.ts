import { ref, onMounted, computed } from 'vue'
import { usePageConfigStore } from '@/stores/pageConfig'
import type { PageSectionConfig, PageElementConfig } from '@/types'

interface PageConfigError {
  message: string
  statusCode?: number
  isNotFound: boolean
}

export function usePageConfig(pageName: string) {
  const pageConfigStore = usePageConfigStore()
  const loading = ref(true)
  const error = ref<PageConfigError | null>(null)

  const config = computed(() => pageConfigStore.pageConfigs[pageName])

  const sections = computed(() => {
    if (!config.value) return []
    return config.value.sections
      .filter(s => s.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  })

  const globalStyles = computed(() => {
    return config.value?.globalStyles || {}
  })

  async function loadConfig() {
    loading.value = true
    error.value = null
    try {
      await pageConfigStore.fetchPageConfig(pageName)
    } catch (e: any) {
      const statusCode = e?.response?.status || e?.status
      const isNotFound = statusCode === 404
      
      error.value = {
        message: isNotFound 
          ? `页面配置 "${pageName}" 尚未创建，请先在管理后台创建配置`
          : `加载页面配置失败: ${e.message || '未知错误'}`,
        statusCode,
        isNotFound
      }
      
      console.error(`Failed to load page config for ${pageName}:`, e)
    } finally {
      loading.value = false
    }
  }

  function getSection(sectionKey: string): PageSectionConfig | undefined {
    return sections.value.find(s => s.sectionKey === sectionKey)
  }

  function getElement(sectionKey: string, elementKey: string): PageElementConfig | undefined {
    const section = getSection(sectionKey)
    if (!section) return undefined
    return section.elements.find(e => e.elementKey === elementKey)
  }

  function getElementContent(sectionKey: string, elementKey: string): string {
    const element = getElement(sectionKey, elementKey)
    return element?.content || ''
  }

  function getSectionElements(sectionKey: string): PageElementConfig[] {
    const section = getSection(sectionKey)
    if (!section) return []
    return section.elements
      .filter(e => e.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  onMounted(() => {
    loadConfig()
  })

  return {
    config,
    sections,
    globalStyles,
    loading,
    error,
    loadConfig,
    getSection,
    getElement,
    getElementContent,
    getSectionElements
  }
}

export function useDynamicElement(pageName: string, sectionKey: string, elementKey: string) {
  const { getElement, loading, error } = usePageConfig(pageName)

  const element = computed(() => getElement(sectionKey, elementKey))

  const content = computed(() => element.value?.content || '')

  const styles = computed(() => element.value?.styles || {})

  const attributes = computed(() => element.value?.attributes || {})

  const isVisible = computed(() => element.value?.isVisible ?? true)

  return {
    element,
    content,
    styles,
    attributes,
    isVisible,
    loading,
    error
  }
}
