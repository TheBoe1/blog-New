import { request } from './request'
import type { PageConfig, PageSectionConfig, PageElementConfig, ConfigFieldGroup } from '@/types'

export const pageConfigApi = {
  getPageConfig(page: string): Promise<PageConfig> {
    return request.get(`/api/page-config/${page}`)
  },

  getAllPageConfigs(): Promise<PageConfig[]> {
    return request.get('/api/page-config')
  },

  createPageConfig(data: Partial<PageConfig>): Promise<PageConfig> {
    return request.post('/api/page-config', data)
  },

  updatePageConfig(page: string, data: Partial<PageConfig>): Promise<PageConfig> {
    return request.put(`/api/page-config/${page}`, data)
  },

  deletePageConfig(page: string): Promise<void> {
    return request.delete(`/api/page-config/${page}`)
  },

  getSectionConfig(page: string, sectionKey: string): Promise<PageSectionConfig> {
    return request.get(`/api/page-config/${page}/section/${sectionKey}`)
  },

  createSection(page: string, data: Partial<PageSectionConfig>): Promise<PageSectionConfig> {
    return request.post(`/api/page-config/${page}/section`, data)
  },

  updateSection(page: string, sectionKey: string, data: Partial<PageSectionConfig>): Promise<PageSectionConfig> {
    return request.put(`/api/page-config/${page}/section/${sectionKey}`, data)
  },

  deleteSection(page: string, sectionKey: string): Promise<void> {
    return request.delete(`/api/page-config/${page}/section/${sectionKey}`)
  },

  getElementConfig(page: string, sectionKey: string, elementKey: string): Promise<PageElementConfig> {
    return request.get(`/api/page-config/${page}/section/${sectionKey}/element/${elementKey}`)
  },

  createElement(page: string, sectionKey: string, data: Partial<PageElementConfig>): Promise<PageElementConfig> {
    return request.post(`/api/page-config/${page}/section/${sectionKey}/element`, data)
  },

  updateElement(page: string, sectionKey: string, elementKey: string, data: Partial<PageElementConfig>): Promise<PageElementConfig> {
    return request.put(`/api/page-config/${page}/section/${sectionKey}/element/${elementKey}`, data)
  },

  deleteElement(page: string, sectionKey: string, elementKey: string): Promise<void> {
    return request.delete(`/api/page-config/${page}/section/${sectionKey}/element/${elementKey}`)
  },

  getConfigFields(page: string): Promise<ConfigFieldGroup[]> {
    return request.get(`/api/page-config/${page}/fields`)
  },

  updateConfigFields(page: string, groups: ConfigFieldGroup[]): Promise<void> {
    return request.put(`/api/page-config/${page}/fields`, { groups })
  },

  previewConfig(page: string, data: Partial<PageConfig>): Promise<{ html: string }> {
    return request.post(`/api/page-config/${page}/preview`, data)
  }
}
