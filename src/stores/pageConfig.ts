import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PageConfig, PageSectionConfig, PageElementConfig, ConfigFieldGroup } from '@/types'
import { pageConfigApi } from '@/api/pageConfig'

export const usePageConfigStore = defineStore('pageConfig', () => {
  const pageConfigs = ref<Record<string, PageConfig>>({})
  const currentPageConfig = ref<PageConfig | null>(null)
  const loading = ref(false)
  const previewHtml = ref('')

  const getElementContent = computed(() => {
    return (page: string, sectionKey: string, elementKey: string) => {
      const config = pageConfigs.value[page]
      if (!config) return null
      
      const section = config.sections.find(s => s.sectionKey === sectionKey)
      if (!section) return null
      
      return section.elements.find(e => e.elementKey === elementKey)
    }
  })

  const getSectionElements = computed(() => {
    return (page: string, sectionKey: string) => {
      const config = pageConfigs.value[page]
      if (!config) return []
      
      const section = config.sections.find(s => s.sectionKey === sectionKey)
      return section?.elements || []
    }
  })

  async function fetchPageConfig(page: string): Promise<PageConfig | null> {
    loading.value = true
    try {
      const config = await pageConfigApi.getPageConfig(page)
      pageConfigs.value[page] = config
      currentPageConfig.value = config
      return config
    } catch (error) {
      console.error('Failed to fetch page config:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchAllPageConfigs(): Promise<PageConfig[]> {
    loading.value = true
    try {
      const configs = await pageConfigApi.getAllPageConfigs()
      configs.forEach(config => {
        pageConfigs.value[config.page] = config
      })
      return configs
    } catch (error) {
      console.error('Failed to fetch all page configs:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  async function savePageConfig(page: string, data: Partial<PageConfig>): Promise<PageConfig | null> {
    loading.value = true
    try {
      const config = await pageConfigApi.updatePageConfig(page, data)
      pageConfigs.value[page] = config
      currentPageConfig.value = config
      return config
    } catch (error) {
      console.error('Failed to save page config:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createSection(page: string, data: Partial<PageSectionConfig>): Promise<PageSectionConfig | null> {
    loading.value = true
    try {
      const section = await pageConfigApi.createSection(page, data)
      if (pageConfigs.value[page]) {
        pageConfigs.value[page].sections.push(section)
      }
      return section
    } catch (error) {
      console.error('Failed to create section:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateSection(page: string, sectionKey: string, data: Partial<PageSectionConfig>): Promise<PageSectionConfig | null> {
    loading.value = true
    try {
      const section = await pageConfigApi.updateSection(page, sectionKey, data)
      if (pageConfigs.value[page]) {
        const index = pageConfigs.value[page].sections.findIndex(s => s.sectionKey === sectionKey)
        if (index !== -1) {
          pageConfigs.value[page].sections[index] = section
        }
      }
      return section
    } catch (error) {
      console.error('Failed to update section:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteSection(page: string, sectionKey: string): Promise<void> {
    loading.value = true
    try {
      await pageConfigApi.deleteSection(page, sectionKey)
      if (pageConfigs.value[page]) {
        pageConfigs.value[page].sections = pageConfigs.value[page].sections.filter(
          s => s.sectionKey !== sectionKey
        )
      }
    } catch (error) {
      console.error('Failed to delete section:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createElement(page: string, sectionKey: string, data: Partial<PageElementConfig>): Promise<PageElementConfig | null> {
    loading.value = true
    try {
      const element = await pageConfigApi.createElement(page, sectionKey, data)
      if (pageConfigs.value[page]) {
        const section = pageConfigs.value[page].sections.find(s => s.sectionKey === sectionKey)
        if (section) {
          section.elements.push(element)
        }
      }
      return element
    } catch (error) {
      console.error('Failed to create element:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateElement(page: string, sectionKey: string, elementKey: string, data: Partial<PageElementConfig>): Promise<PageElementConfig | null> {
    loading.value = true
    try {
      const element = await pageConfigApi.updateElement(page, sectionKey, elementKey, data)
      if (pageConfigs.value[page]) {
        const section = pageConfigs.value[page].sections.find(s => s.sectionKey === sectionKey)
        if (section) {
          const index = section.elements.findIndex(e => e.elementKey === elementKey)
          if (index !== -1) {
            section.elements[index] = element
          }
        }
      }
      return element
    } catch (error) {
      console.error('Failed to update element:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteElement(page: string, sectionKey: string, elementKey: string): Promise<void> {
    loading.value = true
    try {
      await pageConfigApi.deleteElement(page, sectionKey, elementKey)
      if (pageConfigs.value[page]) {
        const section = pageConfigs.value[page].sections.find(s => s.sectionKey === sectionKey)
        if (section) {
          section.elements = section.elements.filter(e => e.elementKey !== elementKey)
        }
      }
    } catch (error) {
      console.error('Failed to delete element:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchConfigFields(page: string): Promise<ConfigFieldGroup[]> {
    loading.value = true
    try {
      return await pageConfigApi.getConfigFields(page)
    } catch (error) {
      console.error('Failed to fetch config fields:', error)
      return []
    } finally {
      loading.value = false
    }
  }

  async function saveConfigFields(page: string, groups: ConfigFieldGroup[]): Promise<void> {
    loading.value = true
    try {
      await pageConfigApi.updateConfigFields(page, groups)
    } catch (error) {
      console.error('Failed to save config fields:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function previewConfig(page: string, data: Partial<PageConfig>): Promise<string> {
    loading.value = true
    try {
      const result = await pageConfigApi.previewConfig(page, data)
      previewHtml.value = result.html
      return result.html
    } catch (error) {
      console.error('Failed to preview config:', error)
      return ''
    } finally {
      loading.value = false
    }
  }

  return {
    pageConfigs,
    currentPageConfig,
    loading,
    previewHtml,
    getElementContent,
    getSectionElements,
    fetchPageConfig,
    fetchAllPageConfigs,
    savePageConfig,
    createSection,
    updateSection,
    deleteSection,
    createElement,
    updateElement,
    deleteElement,
    fetchConfigFields,
    saveConfigFields,
    previewConfig
  }
})
