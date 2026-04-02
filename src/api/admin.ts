import { request } from './request'
import type { Article, ArticleQuery, PaginatedResponse, Category, Tag } from '@/types'

export const adminArticleApi = {
  getList(params: ArticleQuery): Promise<PaginatedResponse<Article>> {
    return request.get('/api/admin/articles', { params })
  },

  getById(id: string): Promise<Article> {
    return request.get(`/api/admin/articles/${id}`)
  },

  create(data: Partial<Article>): Promise<Article> {
    return request.post('/api/admin/articles', data)
  },

  update(id: string, data: Partial<Article>): Promise<Article> {
    return request.put(`/api/admin/articles/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/api/admin/articles/${id}`)
  },

  uploadCover(file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> {
    return request.upload('/api/admin/articles/upload', file, onProgress)
  },

  uploadImage(file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> {
    return request.upload('/api/admin/articles/upload', file, onProgress)
  },

  getStats(): Promise<{ total: number; published: number; draft: number }> {
    return request.get('/api/admin/articles/stats')
  }
}

export const adminCategoryApi = {
  getList(): Promise<Category[]> {
    return request.get('/api/admin/categories')
  },

  getById(id: string): Promise<Category> {
    return request.get(`/api/admin/categories/${id}`)
  },

  create(data: Partial<Category>): Promise<Category> {
    return request.post('/api/admin/categories', data)
  },

  update(id: string, data: Partial<Category>): Promise<Category> {
    return request.put(`/api/admin/categories/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/api/admin/categories/${id}`)
  }
}

export const adminTagApi = {
  getList(): Promise<Tag[]> {
    return request.get('/api/admin/tags')
  },

  getById(id: string): Promise<Tag> {
    return request.get(`/api/admin/tags/${id}`)
  },

  create(data: Partial<Tag>): Promise<Tag> {
    return request.post('/api/admin/tags', data)
  },

  update(id: string, data: Partial<Tag>): Promise<Tag> {
    return request.put(`/api/admin/tags/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/api/admin/tags/${id}`)
  }
}

export const adminSettingsApi = {
  getSettings(): Promise<Record<string, string>> {
    return request.get('/api/admin/settings')
  },

  updateSettings(data: Record<string, string>): Promise<void> {
    return request.put('/api/admin/settings', data)
  }
}

export const adminStatsApi = {
  getDashboard(): Promise<{
    articleCount: number
    categoryCount: number
    tagCount: number
    todayPV: number
    todayUV: number
    recentArticles: Article[]
  }> {
    return request.get('/api/admin/stats/dashboard')
  },

  getRealtime(): Promise<{
    onlineUsers: number
    todayPV: number
    todayUV: number
    todayIP: number
  }> {
    return request.get('/api/admin/stats/realtime')
  },

  getTrend(params: { startDate: string; endDate: string; granularity?: string }): Promise<{
    summary: { totalPV: number; totalUV: number; totalIP: number; avgDailyPV: number; avgDailyUV: number }
    trend: { date: string; pv: number; uv: number; ip: number }[]
    comparison: { pvGrowth: number; uvGrowth: number; ipGrowth: number }
  }> {
    return request.get('/api/admin/stats/trend', { params })
  },

  getVisitLogs(params?: { page?: number; pageSize?: number; ip?: string; path?: string }): Promise<{
    list: any[]
    total: number
  }> {
    return request.get('/api/admin/stats/visit/logs', { params })
  },

  getArticleRanking(params?: { limit?: number; sortBy?: string }): Promise<any[]> {
    return request.get('/api/admin/stats/articles/ranking', { params })
  }
}
