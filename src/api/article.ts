import { request } from './request'
import type { Article, ArticleQuery, PaginatedResponse, Category, Tag } from '@/types'

export const articleApi = {
  getList(params: ArticleQuery): Promise<PaginatedResponse<Article>> {
    return request.get('/api/articles', { params })
  },

  getById(id: string): Promise<Article> {
    return request.get(`/api/articles/${id}`)
  },

  getBySlug(slug: string): Promise<Article> {
    return request.get(`/api/articles/slug/${slug}`)
  },

  getArchive(): Promise<{month: string; count: number}[]> {
    return request.get('/api/articles/archive')
  },

  getHot(limit: number = 10): Promise<Article[]> {
    return request.get('/api/articles/hot', { params: { limit } })
  },

  getRecent(limit: number = 10): Promise<Article[]> {
    return request.get('/api/articles/recent', { params: { limit } })
  },

  uploadImage(file: File): Promise<{ url: string }> {
    return request.upload('/api/admin/articles/upload', file)
  },

  uploadCover(file: File): Promise<{ url: string }> {
    return request.upload('/api/admin/articles/upload', file)
  }
}

export const categoryApi = {
  getList(): Promise<Category[]> {
    return request.get('/api/categories')
  },

  getById(id: string): Promise<Category> {
    return request.get(`/api/categories/${id}`)
  }
}

export const tagApi = {
  getList(): Promise<Tag[]> {
    return request.get('/api/tags')
  },

  getById(id: string): Promise<Tag> {
    return request.get(`/api/tags/${id}`)
  }
}
