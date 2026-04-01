import { request } from './request'
import type { Article, ArticleQuery, PaginatedResponse, Category, Tag } from '@/types'

export const articleApi = {
  getList(params: ArticleQuery): Promise<PaginatedResponse<Article>> {
    return request.get('/api/articles', { params })
  },

  getAdminList(params: ArticleQuery): Promise<PaginatedResponse<Article>> {
    return request.get('/api/articles', { params: { ...params, admin: true } })
  },

  getById(id: string): Promise<Article> {
    return request.get(`/api/articles/${id}`)
  },

  getBySlug(slug: string): Promise<Article> {
    return request.get(`/api/articles/slug/${slug}`)
  },

  create(data: Partial<Article>): Promise<Article> {
    return request.post('/api/articles', data)
  },

  update(id: string, data: Partial<Article>): Promise<Article> {
    return request.put(`/api/articles/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/api/articles/${id}`)
  },

  uploadCover(file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> {
    return request.upload('/api/articles/upload', file, onProgress)
  },

  uploadImage(file: File, onProgress?: (percent: number) => void): Promise<{ url: string }> {
    return request.upload('/api/articles/upload', file, onProgress)
  },

  getArchive(): Promise<{month: string; count: number}[]> {
    return request.get('/api/articles/archive')
  },

  getHot(limit: number = 10): Promise<Article[]> {
    return request.get('/api/articles/hot', { params: { limit } })
  },
}

export const categoryApi = {
  getList(): Promise<Category[]> {
    return request.get('/api/categories')
  },

  getById(id: string): Promise<Category> {
    return request.get(`/api/categories/${id}`)
  },

  create(data: Partial<Category>): Promise<Category> {
    return request.post('/api/categories', data)
  },

  update(id: string, data: Partial<Category>): Promise<Category> {
    return request.put(`/api/categories/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/api/categories/${id}`)
  },
}

export const tagApi = {
  getList(): Promise<Tag[]> {
    return request.get('/api/tags')
  },

  getById(id: string): Promise<Tag> {
    return request.get(`/api/tags/${id}`)
  },

  create(data: Partial<Tag>): Promise<Tag> {
    return request.post('/api/tags', data)
  },

  update(id: string, data: Partial<Tag>): Promise<Tag> {
    return request.put(`/api/tags/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/api/tags/${id}`)
  }
}
