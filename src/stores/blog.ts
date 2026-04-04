import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Article, Category, Tag, ArticleQuery, DashboardStats, VisitTrend } from '@/types'
import { articleApi, categoryApi, tagApi } from '@/api/article'
import request from '@/api/request'

export const useBlogStore = defineStore('blog', () => {
  const articles = ref<Article[]>([])
  const categories = ref<Category[]>([])
  const tags = ref<Tag[]>([])
  const currentArticle = ref<Article | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const dashboardStats = ref<DashboardStats | null>(null)
  const visitTrend = ref<VisitTrend[]>([])

  const articleCount = computed(() => total.value || articles.value.length)
  const categoryCount = computed(() => categories.value.length)
  const tagCount = computed(() => tags.value.length)
  const recentArticles = computed(() => 
    articles.value.slice(0, 5).sort((a, b) => 
      new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
    )
  )

  async function fetchArticles(params?: ArticleQuery): Promise<{ list: Article[]; total: number }> {
    loading.value = true
    try {
      const response = await articleApi.getList(params || {})
      const list = response.rows || response.list || []
      const totalNum = response.total || 0
      // Ensure tags is an array for each article
      articles.value = list.map(item => {
        // Ensure tags is an array
        if (!item.tags) {
          item.tags = []
        } else if (typeof item.tags === 'string') {
          // If tags is a string, split it into an array
          item.tags = item.tags.split(',').map(tag => tag.trim())
        }
        return item
      })
      total.value = totalNum
      return { list: articles.value, total: total.value }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      articles.value = []
      total.value = 0
      return { list: [], total: 0 }
    } finally {
      loading.value = false
    }
  }

  async function fetchAdminArticles(params?: ArticleQuery): Promise<{ list: Article[]; total: number }> {
    console.log('fetchAdminArticles called with params:', params)
    loading.value = true
    try {
      const response = await request.get('/api/admin/articles', { params: params || {} })
      console.log('Response from API:', response)
      const list = response.rows || response.list || []
      const totalNum = response.total || 0
      console.log('Processed data:', { list, totalNum })
      
      // Filter out undefined or null items and ensure tags is an array
      articles.value = list.filter(item => item != null).map(item => {
        console.log('Processing article:', item.title, 'tags:', item.tags, 'tags type:', typeof item.tags)
        
        // Ensure tags is an array
        if (!item.tags) {
          item.tags = []
          console.log('Tags is null/undefined, set to empty array')
        } else if (typeof item.tags === 'string') {
          // If tags is a string, split it into an array
          item.tags = item.tags.split(',').map(tag => tag.trim())
          console.log('Tags is string, converted to array:', item.tags)
        } else if (!Array.isArray(item.tags)) {
          // If tags is neither string nor array, set to empty array
          item.tags = []
          console.log('Tags is neither string nor array, set to empty array')
        } else {
          console.log('Tags is already an array:', item.tags)
        }
        
        return item
      })
      
      console.log('Final articles with tags:', articles.value.map(a => ({ title: a.title, tags: a.tags })))
      total.value = totalNum
      console.log('Updated store:', { articles: articles.value, total: total.value })
      return { list: articles.value, total: total.value }
    } catch (error) {
      console.error('Failed to fetch admin articles:', error)
      articles.value = []
      total.value = 0
      return { list: [], total: 0 }
    } finally {
      loading.value = false
    }
  }

  async function fetchArticleById(id: string): Promise<Article | null> {
    loading.value = true
    try {
      const article = await articleApi.getById(id)
      currentArticle.value = article
      return article
    } catch (error) {
      console.error('Failed to fetch article:', error)
      currentArticle.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function createArticle(article: Partial<Article>): Promise<Article> {
    loading.value = true
    try {
      const response = await request.post('/api/admin/articles', article)
      const newArticle = response.data
      articles.value.unshift(newArticle)
      total.value++
      return newArticle
    } catch (error) {
      console.error('Failed to create article:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateArticle(id: string, article: Partial<Article>): Promise<Article> {
    loading.value = true
    try {
      const response = await request.put(`/api/admin/articles/${id}`, article)
      const updatedArticle = response.data
      const index = articles.value.findIndex(a => a.id === id)
      if (index !== -1) {
        articles.value[index] = updatedArticle
      }
      return updatedArticle
    } catch (error) {
      console.error('Failed to update article:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function deleteArticle(id: string): Promise<void> {
    loading.value = true
    try {
      await request.delete(`/api/admin/articles/${id}`)
      articles.value = articles.value.filter(a => a.id !== id)
      total.value--
    } catch (error) {
      console.error('Failed to delete article:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories(): Promise<Category[]> {
    loading.value = true
    try {
      categories.value = await categoryApi.getList()
      return categories.value
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      categories.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function createCategory(category: Partial<Category>): Promise<Category> {
    try {
      const response = await request.post('/api/admin/categories', category)
      const newCategory = response.data
      categories.value.push(newCategory)
      return newCategory
    } catch (error) {
      console.error('Failed to create category:', error)
      throw error
    }
  }

  async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    try {
      const response = await request.put(`/api/admin/categories/${id}`, category)
      const updatedCategory = response.data
      const index = categories.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }
      return updatedCategory
    } catch (error) {
      console.error('Failed to update category:', error)
      throw error
    }
  }

  async function deleteCategory(id: string): Promise<void> {
    try {
      await request.delete(`/api/admin/categories/${id}`)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (error) {
      console.error('Failed to delete category:', error)
      throw error
    }
  }

  async function fetchTags(): Promise<Tag[]> {
    loading.value = true
    try {
      tags.value = await tagApi.getList()
      return tags.value
    } catch (error) {
      console.error('Failed to fetch tags:', error)
      tags.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  async function createTag(tag: Partial<Tag>): Promise<Tag> {
    try {
      const response = await request.post('/api/admin/tags', tag)
      const newTag = response.data
      tags.value.push(newTag)
      return newTag
    } catch (error) {
      console.error('Failed to create tag:', error)
      throw error
    }
  }

  async function updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
    try {
      const response = await request.put(`/api/admin/tags/${id}`, tag)
      const updatedTag = response.data
      const index = tags.value.findIndex(t => t.id === id)
      const oldTagName = index !== -1 ? tags.value[index].name : null
      
      if (index !== -1) {
        tags.value[index] = updatedTag
      }
      
      // 如果标签名称发生了变化，更新所有文章中的标签引用
      if (oldTagName && oldTagName !== updatedTag.name) {
        articles.value = articles.value.map(article => {
          if (article.tags && article.tags.includes(oldTagName)) {
            return {
              ...article,
              tags: article.tags.map(t => t === oldTagName ? updatedTag.name : t)
            }
          }
          return article
        })
      }
      
      return updatedTag
    } catch (error) {
      console.error('Failed to update tag:', error)
      throw error
    }
  }

  async function deleteTag(id: string): Promise<void> {
    try {
      // 先获取要删除的标签名称
      const tagToDelete = tags.value.find(t => t.id === id)
      const tagName = tagToDelete?.name
      
      await request.delete(`/api/admin/tags/${id}`)
      tags.value = tags.value.filter(t => t.id !== id)
      
      // 从所有文章中移除该标签
      if (tagName) {
        articles.value = articles.value.map(article => {
          if (article.tags && article.tags.includes(tagName)) {
            return {
              ...article,
              tags: article.tags.filter(t => t !== tagName)
            }
          }
          return article
        })
      }
    } catch (error) {
      console.error('Failed to delete tag:', error)
      throw error
    }
  }

  async function fetchDashboardStats(): Promise<DashboardStats | null> {
    try {
      const response = await request.get('/api/admin/stats/dashboard')
      const data = response.data
      dashboardStats.value = {
        articleCount: data.articleCount,
        viewCount: 0,
        likeCount: 0,
        categoryCount: data.categoryCount,
        tagCount: data.tagCount,
        todayPV: data.todayPV,
        todayUV: data.todayUV,
        onlineUsers: 0,
        recentArticles: data.recentArticles || [],
        categoryStats: []
      }
      return dashboardStats.value
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      return null
    }
  }

  async function fetchVisitTrend(startDate: string, endDate: string, granularity: string = 'day'): Promise<VisitTrend[]> {
    try {
      const response = await request.get('/api/admin/stats/trend', {
        params: { startDate, endDate, granularity }
      })
      visitTrend.value = response.data?.trend || []
      return visitTrend.value
    } catch (error) {
      console.error('Failed to fetch visit trend:', error)
      return []
    }
  }

  return {
    articles,
    categories,
    tags,
    currentArticle,
    loading,
    total,
    dashboardStats,
    visitTrend,
    articleCount,
    categoryCount,
    tagCount,
    recentArticles,
    fetchArticles,
    fetchAdminArticles,
    fetchArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchTags,
    createTag,
    updateTag,
    deleteTag,
    fetchDashboardStats,
    fetchVisitTrend
  }
})
